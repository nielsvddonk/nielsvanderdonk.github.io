// All reading and writing of recipes goes through this file.
// Two backends with the same functions:
//   local    → this browser's localStorage (for trying things out)
//   supabase → shared online database + photo storage (see README.md)
//
// A recipe looks like:
// {
//   id, title, cook, servings, time (minutes), source, tags: ['pasta'],
//   image: 'https://…' or '',
//   ingredients: [{ name: '' | 'Sauce', items: ['2 carrots', '1 tbsp soy sauce'] }],
//   steps: ['Boil water…', 'Add pasta…'],
//   notes, createdAt, updatedAt
// }
// In Supabase everything except id/dates lives in one JSON column, so new
// fields can be added later without changing the database.

import { config } from './config.js';
import { SEED } from './seed.js';
import { local, uid, unique } from './lib/util.js';
import { resizeImage, blobToDataUrl } from './lib/image.js';
import { allIngredientLines, ingredientName } from './lib/ingredients.js';

const supabaseKey = config.supabasePublishableKey || config.supabaseAnonKey || ''; // anon = old name
export const mode = config.supabaseUrl && supabaseKey ? 'supabase' : 'local';

const LOCAL_KEY = 'hungry.recipes';
const LOCAL_ADMIN = 'hungry.localAdmin';

// A secret / service_role key gives full access to everything and must never be in a website.
function isSecretKey(key) {
  if (key.startsWith('sb_secret_')) return true;
  try {
    const payload = key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)).role === 'service_role';
  } catch {
    return false;
  }
}

let sb = null;
async function db() {
  if (!sb) {
    if (isSecretKey(supabaseKey)) {
      throw new Error('js/config.js contains the SECRET Supabase key. Remove it and use the publishable key '
        + '(Project Settings → API Keys, starts with sb_publishable_). See README.md.');
    }
    // Accept the URL as copied from the dashboard, e.g. with /rest/v1/ at the end.
    const url = config.supabaseUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/+esm');
    sb = createClient(url, supabaseKey);
  }
  return sb;
}

let cache = null;

const fromRow = (row) => ({ ...row.data, id: row.id, createdAt: row.created_at, updatedAt: row.updated_at });

function writeLocal() {
  if (!local.set(LOCAL_KEY, cache)) {
    throw new Error('Browser storage is full. Photos take a lot of space in local mode — try without a photo.');
  }
}

// ---------- Recipes ----------

export async function listRecipes() {
  if (cache) return cache;
  if (mode === 'supabase') {
    const { data, error } = await (await db()).from('recipes').select('*').order('created_at');
    if (error) throw error;
    cache = data.map(fromRow);
  } else {
    cache = local.get(LOCAL_KEY);
    if (!cache) { cache = structuredClone(SEED); local.set(LOCAL_KEY, cache); }
  }
  return cache;
}

export async function getRecipe(id) {
  return (await listRecipes()).find((r) => r.id === id) || null;
}

export async function saveRecipe(recipe) {
  await listRecipes();
  const { id, createdAt, updatedAt, ...data } = recipe;
  const now = new Date().toISOString();
  let saved;

  if (mode === 'supabase') {
    const table = (await db()).from('recipes');
    const query = id
      ? table.update({ data, updated_at: now }).eq('id', id).select().single()
      : table.insert({ data }).select().single();
    const { data: row, error } = await query;
    if (error) throw error;
    saved = fromRow(row);
  } else {
    saved = { ...data, id: id || uid(), createdAt: createdAt || now, updatedAt: now };
  }

  const i = cache.findIndex((r) => r.id === saved.id);
  if (i >= 0) cache[i] = saved; else cache.push(saved);
  if (mode === 'local') writeLocal();
  return saved;
}

export async function deleteRecipe(id) {
  await listRecipes();
  if (mode === 'supabase') {
    const { error } = await (await db()).from('recipes').delete().eq('id', id);
    if (error) throw error;
  }
  cache = cache.filter((r) => r.id !== id);
  if (mode === 'local') { writeLocal(); local.remove(ticksKey(id)); }
}

// Returns a URL to store in recipe.image.
export async function uploadImage(file) {
  if (mode === 'supabase') {
    const blob = file.type === 'image/jpeg' && file.size < 400_000 ? file : await resizeImage(file);
    const path = `${uid()}.jpg`;
    const storage = (await db()).storage.from(config.imageBucket);
    const { error } = await storage.upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
    if (error) throw error;
    return storage.getPublicUrl(path).data.publicUrl;
  }
  // Local mode: keep photos small, they live inside localStorage.
  return blobToDataUrl(await resizeImage(file, 1000, 0.75));
}

// ---------- Backup ----------

export async function exportRecipes() {
  return JSON.stringify({ app: 'hungry', exportedAt: new Date().toISOString(), recipes: await listRecipes() }, null, 2);
}

// Adds recipes from a backup file. Existing ones (same id) are overwritten.
export async function importRecipes(json) {
  const parsed = JSON.parse(json);
  const list = Array.isArray(parsed) ? parsed : parsed.recipes;
  if (!Array.isArray(list)) throw new Error('This does not look like a Hungry backup file.');
  const existing = new Set((await listRecipes()).map((r) => r.id));
  let count = 0;
  for (const r of list) {
    const recipe = { ...r };
    if (mode === 'supabase') {
      if (!existing.has(recipe.id)) delete recipe.id;
      if (recipe.image?.startsWith('data:')) {
        recipe.image = await uploadImage(await (await fetch(recipe.image)).blob());
      }
    }
    await saveRecipe(recipe);
    count++;
  }
  return count;
}

// ---------- Login ----------

export async function isAdmin() {
  if (mode === 'supabase') {
    const { data } = await (await db()).auth.getSession();
    return Boolean(data.session);
  }
  return local.get(LOCAL_ADMIN) === true;
}

export async function login(password, email = config.adminEmail) {
  if (mode === 'supabase') {
    const { error } = await (await db()).auth.signInWithPassword({ email, password });
    if (error) throw new Error('That did not work. Check the password.');
    return;
  }
  if (password !== config.localPassword) throw new Error('Wrong password.');
  local.set(LOCAL_ADMIN, true);
}

export async function logout() {
  if (mode === 'supabase') await (await db()).auth.signOut();
  else local.remove(LOCAL_ADMIN);
}

// ---------- Ticks ----------
// Ticked ingredients and finished steps, stored as short keys per recipe.
// Logged in (online): saved in Supabase and shared live between your devices.
// Everyone else: kept in their own browser only — so people you send a recipe
// to never see your ticks, and you never see theirs.

const ticksKey = (recipeId) => 'hungry.ticks.' + recipeId;
export const ticksAreShared = async () => mode === 'supabase' && (await isAdmin());

export async function loadTicks(recipeId) {
  if (await ticksAreShared()) {
    const { data, error } = await (await db()).from('ticks').select('item').eq('recipe_id', recipeId);
    if (error) throw error;
    return data.map((row) => row.item);
  }
  return local.get(ticksKey(recipeId), []);
}

export async function setTick(recipeId, item, on) {
  if (await ticksAreShared()) {
    const table = (await db()).from('ticks');
    const { error } = on
      ? await table.upsert({ recipe_id: recipeId, item }, { onConflict: 'recipe_id,item', ignoreDuplicates: true })
      : await table.delete().match({ recipe_id: recipeId, item });
    if (error) throw error;
    return;
  }
  const items = new Set(local.get(ticksKey(recipeId), []));
  on ? items.add(item) : items.delete(item);
  local.set(ticksKey(recipeId), [...items]);
}

export async function clearTicks(recipeId) {
  if (await ticksAreShared()) {
    const { error } = await (await db()).from('ticks').delete().eq('recipe_id', recipeId);
    if (error) throw error;
    return;
  }
  local.remove(ticksKey(recipeId));
}

// Calls onChange() whenever ticks may have changed somewhere else
// (the other phone, or another tab). Returns a function that stops watching.
export async function watchTicks(recipeId, onChange) {
  if (!(await ticksAreShared())) {
    const onStorage = (e) => { if (e.key === ticksKey(recipeId)) onChange(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }
  const client = await db();
  const { data } = await client.auth.getSession();
  if (data.session) client.realtime.setAuth(data.session.access_token);
  const channel = client
    .channel('ticks-' + uid())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ticks' }, (change) => {
      // Deletes only carry the row id, so any delete might concern this recipe.
      if (change.eventType === 'DELETE' || change.new?.recipe_id === recipeId) onChange();
    })
    // Also re-check after (re)connecting, e.g. when the phone wakes up.
    .subscribe((status) => { if (status === 'SUBSCRIBED') onChange(); });
  return () => client.removeChannel(channel);
}

// ---------- Indexes for filters and suggestions ----------

export const allTags = (recipes) => unique(recipes.flatMap((r) => r.tags || [])).sort();
export const allCooks = (recipes) => unique(recipes.map((r) => r.cook).filter(Boolean)).sort();
export const allIngredientNames = (recipes) =>
  unique(recipes.flatMap(allIngredientLines).map(ingredientName).filter(Boolean)).sort();
