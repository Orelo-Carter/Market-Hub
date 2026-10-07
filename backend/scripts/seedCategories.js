import { connectDB } from '../config/db.js';
import { assertRequiredEnv } from '../config/env.js';
import { Category } from '../models/Category.js';

const taxonomy = {
  'Fashion & Apparel': [
    "Men's Clothing",
    "Women's Clothing",
    "Kids' Clothing",
    'Shoes',
    'Bags & Wallets',
    'Jewelry & Watches',
  ],
  Electronics: [
    'Phones & Tablets',
    'Computers & Laptops',
    'TVs & Home Theater',
    'Audio',
    'Cameras & Drones',
    'Wearables',
  ],
  'Home & Garden': [
    'Furniture',
    'Kitchen & Dining',
    'Home Decor',
    'Bedding & Bath',
    'Tools & Home Improvement',
    'Outdoor & Patio',
  ],
  'Health & Beauty': [
    'Skincare',
    'Makeup',
    'Haircare',
    'Personal Care',
    'Wellness & Supplements',
    'Fragrances',
  ],
  'Sports & Outdoors': [
    'Fitness Equipment',
    'Camping & Hiking',
    'Cycling',
    'Sportswear',
    'Team Sports Gear',
  ],
  'Baby, Kids & Toys': [
    'Baby Gear',
    'Diapering & Feeding',
    'Toys & Games',
    "Kids' Furniture",
    'School Supplies',
  ],
  'Handmade & Craft Supplies': [
    'Art & Collectibles',
    'DIY Materials',
    'Custom & Personalized Gifts',
    'Craft Tools',
  ],
  'Pet Supplies': [
    'Pet Food',
    'Pet Accessories',
    'Grooming',
    'Pet Toys',
  ],
};

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

try {
  assertRequiredEnv();
  await connectDB();

  let topLevelCreated = 0;
  let subcategoriesCreated = 0;
  let skipped = 0;

  for (const [parentName, children] of Object.entries(taxonomy)) {
    const parentSlug = slugify(parentName);
    let parent = await Category.findOne({ slug: parentSlug });

    if (parent) {
      skipped += 1;
    } else {
      parent = await Category.create({ name: parentName, slug: parentSlug, parent: null });
      topLevelCreated += 1;
    }

    for (const childName of children) {
      const childSlug = slugify(childName);
      const existingChild = await Category.findOne({ slug: childSlug });

      if (existingChild) {
        skipped += 1;
        continue;
      }

      await Category.create({ name: childName, slug: childSlug, parent: parent._id });
      subcategoriesCreated += 1;
    }
  }

  console.log(`Categories seeded: ${topLevelCreated} top-level created, ${subcategoriesCreated} subcategories created, ${skipped} skipped.`);
  process.exit(0);
} catch (error) {
  console.error('Failed to seed categories');
  console.error(error.message);
  process.exit(1);
}
