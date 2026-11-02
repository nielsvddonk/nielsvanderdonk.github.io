// The apps on nielsvanderdonk.nl/apps — this is the list the apps page shows.
//
// To add an app:
//   1. Put it in its own folder next to this file, e.g. apps/budget/ (with an index.html).
//   2. Give it the same Supabase settings as config.js, so the one login works there too.
//   3. Add it to the list below, then commit + push with GitHub Desktop.
//
// public: true  → everyone sees it here (Hungry: recipes are meant to be shared)
// public: false → only shown after logging in

export const apps = [
  {
    name: 'Hungry',
    path: 'hungry/',
    icon: 'hungry/icons/icon.svg',
    description: 'Our recipes: random pick, week planner, cook mode.',
    public: true,
  },
  {
    name: 'Pesten Score',
    path: 'pesten/',
    icon: 'pesten/icon.svg',
    description: 'Who’s winning at pesten: Vikki vs Niels.',
    public: true,
  },
];
