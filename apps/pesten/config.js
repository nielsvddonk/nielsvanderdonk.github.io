// Pesten Score settings. Everything here is public on purpose.

export const config = {
  // The Supabase project shared by all apps (same as apps/config.js).
  supabaseUrl: 'https://howcrhcuqtytcrdqothc.supabase.co',
  supabasePublishableKey: 'sb_publishable_fCCjHU1k-xwPsKUFo4yfVw_EPhflJJ_',

  // Left to right on the screen. "id" is what's saved for each win — don't change it later.
  players: [
    { id: 'vikki', name: 'Vikki', suit: '♥', color: 'red' },
    { id: 'niels', name: 'Niels', suit: '♠', color: 'black' },
  ],
};
