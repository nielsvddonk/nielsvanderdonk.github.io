// Settings for Hungry.
//
// While supabaseUrl and supabasePublishableKey are empty the app runs in LOCAL mode:
// recipes are stored in this browser only, which is perfect for trying it out.
// Fill them in (see README.md, "Going online") to switch to the shared online
// database that works on every device.
//
// Everything in this file is visible to anyone who visits the website.

export const config = {
  supabaseUrl: 'https://howcrhcuqtytcrdqothc.supabase.co',

  // Supabase → Project Settings → API Keys → "Publishable key" (starts with sb_publishable_).
  // NEVER the secret key (sb_secret_…): that one can do anything and must stay private.
  supabasePublishableKey: 'sb_publishable_fCCjHU1k-xwPsKUFo4yfVw_EPhflJJ_',

  adminEmail: 'info@yonk.online', // the user you created in Supabase → Authentication

  imageBucket: 'recipe-images',
};
