-- Noteo — liste des quartiers pour le sélecteur de l'app.
--
-- Déduite des lieux publiés : un quartier n'apparaît que s'il contient au moins
-- un lieu (dans la catégorie demandée). L'API REST ne sait pas faire de
-- SELECT DISTINCT, d'où cette fonction.
--
-- Appel : supabase.rpc('list_districts', { p_category: 'resto' })

create function public.list_districts(p_category text default null)
returns table (name text, place_count integer)
language sql
stable
set search_path = ''
as $$
  select p.district, count(*)::integer
  from public.places p
  where p.status = 'published'
    and (p_category is null or p.category_slug = p_category)
  group by p.district
  order by count(*) desc, p.district;
$$;

-- Les fonctions ne sont plus ouvertes par défaut (migration tighten_grants).
revoke all on function public.list_districts(text) from public;
grant execute on function public.list_districts(text) to anon, authenticated, service_role;
