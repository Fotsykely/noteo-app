-- Noteo — resserrage des droits.
--
-- Le projet donne par défaut TOUS les droits à anon et authenticated sur chaque
-- nouvelle table du schéma public (option « Automatically expose new tables »).
-- Les GRANT de la migration rls s'ajoutaient donc à ces droits au lieu de les
-- remplacer : la RLS protégeait les lignes, mais pas les colonnes (un utilisateur
-- pouvait par exemple fixer rating_avg sur un lieu qu'il propose).
--
-- 1. On retire tout, puis on redonne exactement les droits voulus.
-- 2. On coupe ces droits par défaut : toute future table ou fonction devra être
--    ouverte explicitement dans sa migration.

revoke all on public.categories, public.criteria, public.profiles, public.places, public.reviews
  from anon, authenticated;

grant select on public.categories, public.criteria, public.profiles, public.places, public.reviews
  to anon, authenticated;

grant update (display_name, avatar_url) on public.profiles to authenticated;
grant insert (name, category_slug, subcategory, district, address, phone, lat, lng)
  on public.places to authenticated;
grant insert (place_id, rating, comment, criteria) on public.reviews to authenticated;
grant update (rating, comment, criteria) on public.reviews to authenticated;
grant delete on public.reviews to authenticated;

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on functions from anon, authenticated;
