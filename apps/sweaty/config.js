// Sweaty settings. Everything here is public on purpose.

export const config = {
  // The Supabase project shared by all apps (same as apps/config.js).
  supabaseUrl: 'https://howcrhcuqtytcrdqothc.supabase.co',
  supabasePublishableKey: 'sb_publishable_fCCjHU1k-xwPsKUFo4yfVw_EPhflJJ_',

  // Your own exercise pictures go in the same public picture storage as Hungry's recipe photos,
  // in a sweaty/ folder. Anyone with a picture's (long, random) address can see it.
  imageBucket: 'recipe-images',
};
