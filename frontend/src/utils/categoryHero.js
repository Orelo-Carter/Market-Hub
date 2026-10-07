const categoryHeroCopy = {
  'fashion-apparel': {
    headline: 'Style that speaks for you',
    subtext: 'Curated fashion from verified vendors, new arrivals daily.',
    cta: 'Shop Fashion',
  },
  electronics: {
    headline: 'Power up your everyday',
    subtext: 'Phones, laptops, audio and more - tested, trusted, delivered fast.',
    cta: 'Shop Electronics',
  },
  'home-garden': {
    headline: 'Make it feel like home',
    subtext: 'Furniture, decor and garden finds from independent makers.',
    cta: 'Shop Home & Garden',
  },
  'health-beauty': {
    headline: 'Look good, feel better',
    subtext: 'Skincare, wellness and beauty essentials, vendor-verified.',
    cta: 'Shop Health & Beauty',
  },
  'sports-outdoors': {
    headline: 'Gear up, go further',
    subtext: 'Everything for your next workout, hike, or ride.',
    cta: 'Shop Sports',
  },
  'baby-kids-toys': {
    headline: 'Little ones, big smiles',
    subtext: 'Safe, quality gear and toys picked for growing families.',
    cta: 'Shop Kids & Baby',
  },
  'handmade-craft-supplies': {
    headline: 'One of a kind, made by hand',
    subtext: 'Support independent makers and find something truly unique.',
    cta: 'Shop Handmade',
  },
  'pet-supplies': {
    headline: 'Spoil your best friend',
    subtext: 'Food, toys and accessories for the pet who has it all.',
    cta: 'Shop Pet Supplies',
  },
}

export function getCategoryHeroImage(category) {
  if (category?.image) return category.image
  // Development-only fallback. Production should rely on admin-uploaded category.image values.
  return `https://source.unsplash.com/1600x500/?${encodeURIComponent(category?.name || 'shopping')}`
}

export function getCategoryHeroCopy(category) {
  return categoryHeroCopy[category?.slug] || {
    headline: category?.name || 'Shop categories',
    subtext: category?.name ? `Explore ${category.name} from verified marketplace vendors.` : '',
    cta: category?.name ? `Shop ${category.name}` : 'Shop now',
  }
}
