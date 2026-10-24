-- Noteo — signalements et modération.
--
-- Règles :
-- 1. Tout compte connecté peut signaler un lieu (fermé, erroné, doublon) ou un avis
--    (insultant, faux, hors sujet).
-- 2. Aucun retrait automatique : un admin ou un modérateur décide.
-- 3. Un lieu « fermé » disparaît de l'app mais reste en base (statut `closed`) ; le
--    réimport OpenStreetMap ne touche jamais au statut, il ne le fait donc pas revenir.
-- 4. Un avis masqué sort de la note moyenne, de la répartition et du compteur « sur
--    place » ; seuls son auteur et les modérateurs le voient encore.

-- ---------------------------------------------------------------------------
-- Modérateurs : les admins le sont aussi
-- ---------------------------------------------------------------------------

create function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.user_roles r
    where r.user_id = (select auth.uid()) and r.role in ('admin', 'moderator')
  );
$$;

revoke all on function public.is_moderator() from public;
grant execute on function public.is_moderator() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Lieux : statut « fermé », corrections par les modérateurs
-- ---------------------------------------------------------------------------

alter table public.places drop constraint places_status_check;
alter table public.places
  add constraint places_status_check
  check (status in ('pending', 'published', 'rejected', 'closed'));

-- Les modérateurs voient aussi les lieux retirés, pour pouvoir les rétablir.
drop policy "Lieux publiés ou à confirmer visibles de tous" on public.places;
create policy "Lieux publiés ou à confirmer visibles de tous"
  on public.places for select to anon, authenticated
  using (
    status in ('published', 'pending')
    or created_by = (select auth.uid())
    or (select public.is_moderator())
  );

drop policy "Les admins modifient les lieux" on public.places;
create policy "Les modérateurs modifient les lieux"
  on public.places for update to authenticated
  using ((select public.is_moderator()))
  with check ((select public.is_moderator()));

-- ---------------------------------------------------------------------------
-- Avis masqués
-- Pas de GRANT d'écriture sur `hidden` : seule la fonction moderate_review le change.
-- Un auteur ne peut donc pas rétablir lui-même un avis masqué.
-- ---------------------------------------------------------------------------

alter table public.reviews add column hidden boolean not null default false;

drop policy "Avis lisibles si le lieu l'est" on public.reviews;
create policy "Avis visibles si le lieu l'est et qu'ils ne sont pas masqués"
  on public.reviews for select to anon, authenticated
  using (
    exists (select 1 from public.places p where p.id = place_id)
    and (
      not hidden
      or author_id = (select auth.uid())
      or (select public.is_moderator())
    )
  );

-- Agrégats d'un lieu : sans les avis masqués
-- (remplace la version de la migration roles_and_place_validation)
create or replace function private.refresh_place_stats(p_place_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_required_on_site constant integer := 3;
begin
  perform 1 from public.places where id = p_place_id for update;

  update public.places p
  set
    rating_count        = s.total,
    rating_avg          = coalesce(round(s.average, 2), 0),
    rating_distribution = array[s.r1, s.r2, s.r3, s.r4, s.r5],
    criteria_avgs       = coalesce(c.averages, '{}'::jsonb),
    on_site_count       = s.on_site,
    -- Publication, jamais l'inverse : un lieu validé le reste si un avis disparaît.
    status = case
      when p.status = 'pending' and p.lat is not null and s.on_site >= c_required_on_site
        then 'published'
      else p.status
    end
  from
    (
      select
        count(*)::integer                                       as total,
        avg(r.rating)                                           as average,
        count(*) filter (where r.rating = 1)::integer           as r1,
        count(*) filter (where r.rating = 2)::integer           as r2,
        count(*) filter (where r.rating = 3)::integer           as r3,
        count(*) filter (where r.rating = 4)::integer           as r4,
        count(*) filter (where r.rating = 5)::integer           as r5,
        count(distinct r.author_id) filter (where r.on_site)::integer as on_site
      from public.reviews r
      where r.place_id = p_place_id and not r.hidden
    ) s,
    (
      select jsonb_object_agg(t.key, round(t.average, 2)) as averages
      from (
        select e.key, avg(e.value::numeric) as average
        from public.reviews r
        cross join lateral jsonb_each_text(r.criteria) e
        where r.place_id = p_place_id and not r.hidden
        group by e.key
      ) t
    ) c
  where p.id = p_place_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Signalements
-- ---------------------------------------------------------------------------

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  place_id    uuid not null references public.places (id) on delete cascade,
  -- Renseigné pour signaler un avis ; vide pour signaler le lieu lui-même.
  review_id   uuid references public.reviews (id) on delete cascade,
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  reason      text not null,
  comment     text check (char_length(comment) <= 500),
  status      text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at  timestamptz not null default now(),

  constraint reports_reason_valid check (
    (review_id is null     and reason in ('closed', 'wrong_info', 'duplicate', 'other'))
    or (review_id is not null and reason in ('offensive', 'fake', 'off_topic', 'other'))
  )
);

-- Un seul signalement ouvert par personne et par cible (lieu ou avis).
create unique index reports_one_open_per_target
  on public.reports (reporter_id, place_id, coalesce(review_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status = 'open';
create index reports_open_idx on public.reports (place_id, review_id) where status = 'open';

-- Pour un avis, le lieu est celui de l'avis ; on ne signale pas son propre avis.
create function private.prepare_report()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_place  uuid;
  v_author uuid;
begin
  if new.review_id is not null then
    select r.place_id, r.author_id into v_place, v_author
    from public.reviews r where r.id = new.review_id;

    if v_place is null then
      raise exception 'Avis introuvable' using errcode = '22023';
    end if;
    if v_author = new.reporter_id then
      raise exception 'Vous ne pouvez pas signaler votre propre avis' using errcode = '22023';
    end if;
    new.place_id := v_place;
  end if;

  new.status := 'open';
  new.resolved_by := null;
  new.resolved_at := null;
  return new;
end;
$$;

create trigger reports_prepare
  before insert on public.reports
  for each row execute function private.prepare_report();

alter table public.reports enable row level security;

-- Écriture limitée aux colonnes saisies : le statut ne se modifie que par les fonctions
-- de modération ci-dessous.
grant select on public.reports to authenticated;
grant insert (place_id, review_id, reason, comment) on public.reports to authenticated;
grant all on public.reports to service_role;

create policy "Chacun voit ses signalements, les modérateurs tous"
  on public.reports for select to authenticated
  using (reporter_id = (select auth.uid()) or (select public.is_moderator()));

create policy "Un compte signale un lieu ou un avis visible"
  on public.reports for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and exists (select 1 from public.places p where p.id = place_id)
  );

-- ---------------------------------------------------------------------------
-- Actions de modération : une seule transaction (décision + clôture des signalements)
-- ---------------------------------------------------------------------------

create function private.assert_moderator()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if not public.is_moderator() then
    raise exception 'Réservé aux modérateurs' using errcode = '42501';
  end if;
end;
$$;

-- Change le statut d'un lieu (fermé, retiré, publié, remis à confirmer) et clôt les
-- signalements ouverts qui le concernent.
create function public.moderate_place(p_place_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.assert_moderator();

  if p_status not in ('published', 'pending', 'rejected', 'closed') then
    raise exception 'Statut inconnu : %', p_status using errcode = '22023';
  end if;

  update public.places set status = p_status where id = p_place_id;
  if not found then
    raise exception 'Lieu introuvable' using errcode = '22023';
  end if;

  update public.reports
  set status = 'resolved', resolved_by = auth.uid(), resolved_at = now()
  where place_id = p_place_id and review_id is null and status = 'open';
end;
$$;

-- Masque (ou rétablit) un avis ; les agrégats du lieu sont recalculés par le trigger
-- de la table reviews.
create function public.moderate_review(p_review_id uuid, p_hidden boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.assert_moderator();

  update public.reviews set hidden = p_hidden where id = p_review_id;
  if not found then
    raise exception 'Avis introuvable' using errcode = '22023';
  end if;

  update public.reports
  set status = 'resolved', resolved_by = auth.uid(), resolved_at = now()
  where review_id = p_review_id and status = 'open';
end;
$$;

-- Écarte les signalements ouverts d'une cible sans rien changer (signalement infondé).
create function public.dismiss_reports(p_place_id uuid, p_review_id uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.assert_moderator();

  update public.reports
  set status = 'dismissed', resolved_by = auth.uid(), resolved_at = now()
  where place_id = p_place_id
    and review_id is not distinct from p_review_id
    and status = 'open';
end;
$$;

revoke all on function private.assert_moderator() from public;
revoke all on function public.moderate_place(uuid, text) from public;
revoke all on function public.moderate_review(uuid, boolean) from public;
revoke all on function public.dismiss_reports(uuid, uuid) from public;
grant execute on function public.moderate_place(uuid, text) to authenticated, service_role;
grant execute on function public.moderate_review(uuid, boolean) to authenticated, service_role;
grant execute on function public.dismiss_reports(uuid, uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- File de modération : une ligne par cible à traiter, la plus signalée d'abord
-- Security invoker : la RLS fait le tri (les modérateurs lisent tout) et le test
-- is_moderator() évite qu'un simple compte obtienne la liste de ses propres signalements.
-- ---------------------------------------------------------------------------

create function public.moderation_queue()
returns table (
  kind           text,
  place_id       uuid,
  place_name     text,
  place_status   text,
  district       text,
  category_slug  text,
  review_id      uuid,
  review_rating  smallint,
  review_comment text,
  review_author  text,
  review_hidden  boolean,
  report_count   integer,
  reasons        text[],
  comments       text[],
  latest_at      timestamptz
)
language sql
stable
set search_path = ''
as $$
  select * from (
    -- Lieux signalés
    select
      'place_report'::text as kind, p.id as place_id, p.name as place_name,
      p.status as place_status, p.district, p.category_slug,
      null::uuid as review_id, null::smallint as review_rating, null::text as review_comment,
      null::text as review_author, null::boolean as review_hidden,
      count(*)::integer as report_count,
      array_agg(r.reason order by r.created_at) as reasons,
      coalesce(array_agg(r.comment order by r.created_at) filter (where r.comment is not null), '{}') as comments,
      max(r.created_at) as latest_at
    from public.reports r
    join public.places p on p.id = r.place_id
    where r.status = 'open' and r.review_id is null
    group by p.id

    union all

    -- Avis signalés
    select
      'review_report'::text, p.id, p.name, p.status, p.district, p.category_slug,
      rv.id, rv.rating, rv.comment, pr.display_name, rv.hidden,
      count(*)::integer,
      array_agg(r.reason order by r.created_at),
      coalesce(array_agg(r.comment order by r.created_at) filter (where r.comment is not null), '{}'),
      max(r.created_at)
    from public.reports r
    join public.reviews rv on rv.id = r.review_id
    join public.places p on p.id = rv.place_id
    join public.profiles pr on pr.id = rv.author_id
    where r.status = 'open'
    group by p.id, rv.id, pr.display_name

    union all

    -- Lieux proposés sans GPS : seul un modérateur peut les publier
    select
      'place_pending'::text, p.id, p.name, p.status, p.district, p.category_slug,
      null::uuid, null::smallint, null::text, null::text, null::boolean,
      0, '{}'::text[], '{}'::text[], p.created_at
    from public.places p
    where p.status = 'pending' and p.lat is null
  ) q
  where (select public.is_moderator())
  order by q.report_count desc, q.latest_at desc nulls last;
$$;

revoke all on function public.moderation_queue() from public;
grant execute on function public.moderation_queue() to authenticated, service_role;
