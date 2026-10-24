// Example recipes shown the first time Hungry runs in local mode.
// Delete them in the app whenever you like.

const NOTE = 'Example recipe — delete it once you have added your own.';
const T = '2026-01-01T12:00:00.000Z';

export const SEED = [
  {
    id: 'example-aglio-olio',
    title: 'Spaghetti aglio e olio',
    cook: 'Example',
    servings: 2,
    time: 20,
    source: '',
    tags: ['pasta', 'italian', 'quick', 'vegetarian'],
    image: '',
    ingredients: [{
      name: '',
      items: ['200 g spaghetti', '4 cloves garlic, thinly sliced', '5 tbsp olive oil', '1 tsp chili flakes',
        'handful of parsley, chopped', 'salt', 'parmesan, to serve'],
    }],
    steps: [
      'Cook the spaghetti in plenty of salted water until al dente. Keep a cup of the pasta water.',
      'Meanwhile, warm the olive oil in a large pan over low heat. Add garlic and chili flakes and cook gently until the garlic is just golden.',
      'Add the drained pasta and a splash of pasta water. Toss for a minute until glossy.',
      'Stir in the parsley, season with salt and serve with parmesan.',
    ],
    notes: NOTE,
    createdAt: T, updatedAt: T,
  },
  {
    id: 'example-carrot-soup',
    title: 'Carrot ginger soup',
    cook: 'Example',
    servings: 4,
    time: 35,
    source: '',
    tags: ['soup', 'vegetarian'],
    image: '',
    ingredients: [{
      name: '',
      items: ['1 tbsp olive oil', '1 onion, chopped', '600 g carrots, sliced', '3 cm ginger, grated',
        '1 l vegetable stock', '200 ml coconut milk', 'salt and pepper'],
    }],
    steps: [
      'Heat the oil in a large pot and fry the onion for 5 minutes until soft.',
      'Add the carrots and ginger and cook for another 2 minutes.',
      'Pour in the stock, bring to a boil and simmer for 20 minutes until the carrots are soft.',
      'Add the coconut milk and blend until smooth. Season with salt and pepper.',
    ],
    notes: NOTE,
    createdAt: T, updatedAt: T,
  },
  {
    id: 'example-teriyaki',
    title: 'Chicken teriyaki',
    cook: 'Example',
    servings: 2,
    time: 30,
    source: '',
    tags: ['japanese', 'chicken', 'meat', 'rice'],
    image: '',
    ingredients: [
      { name: '', items: ['4 chicken thighs, boneless', '1 tbsp oil', '150 g rice', '2 spring onions, sliced', '1 tsp sesame seeds'] },
      { name: 'Sauce', items: ['4 tbsp soy sauce', '3 tbsp mirin', '2 tbsp sake', '1 tbsp sugar'] },
    ],
    steps: [
      'Cook the rice.',
      'Mix all sauce ingredients in a small bowl.',
      'Fry the chicken skin side down in the oil over medium heat for about 8 minutes until crisp. Flip and cook 4 more minutes.',
      'Pour off excess fat, add the sauce and let it bubble until thick and sticky, turning the chicken to coat.',
      'Slice the chicken, serve on rice and top with spring onion and sesame seeds.',
    ],
    notes: NOTE,
    createdAt: T, updatedAt: T,
  },
  {
    id: 'example-chickpea-curry',
    title: 'Chickpea spinach curry',
    cook: 'Example',
    servings: 4,
    time: 30,
    source: '',
    tags: ['curry', 'indian', 'vegetarian'],
    image: '',
    ingredients: [
      { name: '', items: ['1 onion, chopped', '2 cloves garlic, minced', '2 cm ginger, grated', '1 tin chickpeas, drained',
        '400 g chopped tomatoes', '200 ml coconut milk', '200 g spinach', '1 tbsp oil'] },
      { name: 'Spices', items: ['1 tsp cumin', '1 tsp garam masala', '1 tsp turmeric', '½ tsp chili powder'] },
    ],
    steps: [
      'Fry the onion in the oil for 5 minutes. Add garlic and ginger and cook 1 minute more.',
      'Stir in the spices and cook for 30 seconds until fragrant.',
      'Add the tomatoes, coconut milk and chickpeas. Simmer for 15 minutes.',
      'Stir in the spinach until wilted. Season and serve with rice or naan.',
    ],
    notes: NOTE,
    createdAt: T, updatedAt: T,
  },
];
