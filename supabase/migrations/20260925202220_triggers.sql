-- Noteo — triggers.
--
-- Toutes les fonctions vivent dans le schéma `private` (non exposé par l'API) et
-- fixent `search_path = ''` : chaque objet est qualifié par son schéma, ce qui
-- empêche de détourner une fonction SECURITY DEFINER avec un objet homonyme.

-- ---------------------------------------------------------------------------
-- updated_at automatique
-- ---------------------------------------------------------------------------

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create trigger places_set_updated_at
  before update on public.places
  for each row execute function private.set_updated_at();

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Profil créé à l'inscription
-- Le nom vient du fournisseur (Google, Facebook) ou, à défaut, de l'e-mail.
-- ---------------------------------------------------------------------------

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(
      coalesce(
        nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
        nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
        nullif(split_part(new.email, '@', 1), ''),
        'Utilisateur'
      ),
      60
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- Contrôle des notes par critère
-- Chaque clé doit être un critère de la catégorie du lieu, chaque valeur un
-- entier de 1 à 5. Une contrainte CHECK ne peut pas consulter d'autres tables.
-- ---------------------------------------------------------------------------

create function private.validate_review_criteria()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_category text;
  v_key      text;
  v_value    jsonb;
begin
  select p.category_slug into v_category
  from public.places p
  where p.id = new.place_id;

  for v_key, v_value in select key, value from jsonb_each(new.criteria) loop
    if not exists (
      select 1 from public.criteria c
      where c.category_slug = v_category and c.slug = v_key
    ) then
      raise exception 'Critère « % » inconnu pour la catégorie « % »', v_key, v_category
        using errcode = '22023';
    end if;

    if jsonb_typeof(v_value) <> 'number' or v_value::text not in ('1', '2', '3', '4', '5') then
      raise exception 'La note du critère « % » doit être un entier de 1 à 5', v_key
        using errcode = '22023';
    end if;
  end loop;

  return new;
end;
$$;

create trigger reviews_validate_criteria
  before insert or update of criteria, place_id on public.reviews
  for each row execute function private.validate_review_criteria();

-- ---------------------------------------------------------------------------
-- Agrégats d'un lieu : moyenne, nombre, répartition, moyenne par critère
-- Recalculés en entier à partir des avis (quelques centaines par lieu au plus),
-- plus simple et plus sûr qu'une mise à jour incrémentale.
-- ---------------------------------------------------------------------------

create function private.refresh_place_stats(p_place_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Verrouille le lieu AVANT de compter : deux avis publiés au même instant
  -- s'attendent, et le second recompte en voyant le premier. Sans ce verrou,
  -- chacun compterait sans l'autre et le dernier écrit gagnerait.
  perform 1 from public.places where id = p_place_id for update;

  update public.places p
  set
    rating_count        = s.total,
    rating_avg          = coalesce(round(s.average, 2), 0),
    rating_distribution = array[s.r1, s.r2, s.r3, s.r4, s.r5],
    criteria_avgs       = coalesce(c.averages, '{}'::jsonb)
  from
    (
      select
        count(*)::integer                              as total,
        avg(r.rating)                                  as average,
        count(*) filter (where r.rating = 1)::integer  as r1,
        count(*) filter (where r.rating = 2)::integer  as r2,
        count(*) filter (where r.rating = 3)::integer  as r3,
        count(*) filter (where r.rating = 4)::integer  as r4,
        count(*) filter (where r.rating = 5)::integer  as r5
      from public.reviews r
      where r.place_id = p_place_id
    ) s,
    (
      select jsonb_object_agg(t.key, round(t.average, 2)) as averages
      from (
        select e.key, avg(e.value::numeric) as average
        from public.reviews r
        cross join lateral jsonb_each_text(r.criteria) e
        where r.place_id = p_place_id
        group by e.key
      ) t
    ) c
  where p.id = p_place_id;
end;
$$;

revoke all on function private.refresh_place_stats(uuid) from public;

-- SECURITY DEFINER : l'auteur d'un avis n'a pas le droit d'écrire dans places,
-- la fonction s'exécute donc avec les droits de son propriétaire.
create function private.handle_review_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform private.refresh_place_stats(new.place_id);
  end if;

  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and old.place_id <> new.place_id) then
    perform private.refresh_place_stats(old.place_id);
  end if;

  return null;
end;
$$;

create trigger reviews_refresh_place_stats
  after insert or update or delete on public.reviews
  for each row execute function private.handle_review_change();
