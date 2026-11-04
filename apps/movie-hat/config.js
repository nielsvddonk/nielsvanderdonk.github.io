// Movie Hat settings. Everything here is public on purpose.
// (The TMDB key is NOT here: it's pasted in the app once and kept in Supabase.)

export const config = {
  // The Supabase project shared by all apps (same as apps/config.js).
  supabaseUrl: 'https://howcrhcuqtytcrdqothc.supabase.co',
  supabasePublishableKey: 'sb_publishable_fCCjHU1k-xwPsKUFo4yfVw_EPhflJJ_',

  // Who adds movies. "id" is what's saved with each movie — don't change it later.
  people: [
    { id: 'niels', name: 'Niels' },
    { id: 'vikki', name: 'Vikki' },
  ],
};
