import { connectDB } from '../config/db.js';
import { assertRequiredEnv } from '../config/env.js';
import { PRODUCT_STATUS, ROLES, USER_STATUS, VENDOR_STATUS } from '../constants/enums.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';

const vendorPassword = 'VendorPass123!';

const taxonomy = {
  'Fashion & Apparel': ["Men's Clothing", "Women's Clothing", 'Shoes', 'Bags & Wallets'],
  Electronics: ['Phones & Tablets', 'Computers & Laptops', 'Audio', 'Wearables'],
  'Home & Garden': ['Furniture', 'Kitchen & Dining', 'Home Decor', 'Outdoor & Patio'],
  'Health & Beauty': ['Skincare', 'Makeup', 'Haircare', 'Fragrances'],
  'Sports & Outdoors': ['Fitness Equipment', 'Camping & Hiking', 'Cycling', 'Sportswear'],
  'Baby, Kids & Toys': ['Baby Gear', 'Toys & Games', 'School Supplies'],
  'Handmade & Craft Supplies': ['Art & Collectibles', 'Custom & Personalized Gifts', 'Craft Tools'],
  'Pet Supplies': ['Pet Food', 'Pet Accessories', 'Grooming', 'Pet Toys'],
};

const vendors = [
  {
    storeName: 'Atlas Apparel',
    slug: 'atlas-apparel',
    ownerName: 'Ari Morgan',
    email: 'atlas@markethub.test',
    description: 'Everyday fashion essentials, clean staples, and small-batch accessories.',
    logoUrl: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=300&q=80',
    ratingAvg: 4.8,
  },
  {
    storeName: 'Pixel Pantry',
    slug: 'pixel-pantry',
    ownerName: 'Maya Chen',
    email: 'pixel@markethub.test',
    description: 'Useful tech, audio gear, wearables, and desk upgrades for modern homes.',
    logoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=300&q=80',
    ratingAvg: 4.7,
  },
  {
    storeName: 'Hearth & Bloom',
    slug: 'hearth-bloom',
    ownerName: 'Noah Silva',
    email: 'hearth@markethub.test',
    description: 'Warm home goods, kitchen pieces, and outdoor living finds.',
    logoUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300&q=80',
    ratingAvg: 4.6,
  },
  {
    storeName: 'Glow Lab',
    slug: 'glow-lab',
    ownerName: 'Iris Bennett',
    email: 'glow@markethub.test',
    description: 'Skincare, fragrance, and beauty essentials from trusted independent brands.',
    logoUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=300&q=80',
    ratingAvg: 4.9,
  },
  {
    storeName: 'Trail & Play Co.',
    slug: 'trail-play-co',
    ownerName: 'Leo Grant',
    email: 'trail@markethub.test',
    description: 'Outdoor gear, activewear, family toys, and smart supplies for busy days.',
    logoUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=300&q=80',
    ratingAvg: 4.5,
  },
  {
    storeName: 'Maker & Paw',
    slug: 'maker-paw',
    ownerName: 'Sofia Reed',
    email: 'makerpaw@markethub.test',
    description: 'Handmade goods and pet essentials with personality.',
    logoUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=300&q=80',
    ratingAvg: 4.8,
  },
];

const products = [
  {
    vendor: 'atlas-apparel',
    title: 'Heavyweight Fleece Hoodie',
    slug: 'heavyweight-fleece-hoodie',
    categories: ['fashion-apparel', 'mens-clothing'],
    price: 68,
    compareAtPrice: 88,
    stock: 72,
    sku: 'ATL-HOOD-001',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80',
    salesCount: 184,
    ratingAvg: 4.8,
    reviewCount: 126,
    flashSale: true,
  },
  {
    vendor: 'atlas-apparel',
    title: 'Canvas Weekend Bag',
    slug: 'canvas-weekend-bag',
    categories: ['fashion-apparel', 'bags-wallets'],
    price: 72,
    compareAtPrice: 150,
    stock: 38,
    sku: 'ATL-BAG-002',
    image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=80',
    salesCount: 96,
    ratingAvg: 4.6,
    reviewCount: 54,
    flashSale: true,
  },
  {
    vendor: 'atlas-apparel',
    title: 'Minimal Leather Sneakers',
    slug: 'minimal-leather-sneakers',
    categories: ['fashion-apparel', 'shoes'],
    price: 89,
    compareAtPrice: 119,
    stock: 44,
    sku: 'ATL-SHOE-003',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80',
    salesCount: 141,
    ratingAvg: 4.7,
    reviewCount: 88,
  },
  {
    vendor: 'pixel-pantry',
    title: 'Portable Audio Speaker',
    slug: 'portable-audio-speaker',
    categories: ['electronics', 'audio'],
    price: 45,
    compareAtPrice: 99,
    stock: 64,
    sku: 'PIX-AUD-101',
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=80',
    salesCount: 220,
    ratingAvg: 4.7,
    reviewCount: 101,
    flashSale: true,
  },
  {
    vendor: 'pixel-pantry',
    title: 'Wireless Noise Cancelling Headphones',
    slug: 'wireless-noise-cancelling-headphones',
    categories: ['electronics', 'audio'],
    price: 129,
    compareAtPrice: 179,
    stock: 26,
    sku: 'PIX-HP-102',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
    salesCount: 176,
    ratingAvg: 4.8,
    reviewCount: 143,
  },
  {
    vendor: 'pixel-pantry',
    title: 'Smart Fitness Watch',
    slug: 'smart-fitness-watch',
    categories: ['electronics', 'wearables', 'sports-outdoors'],
    price: 79,
    compareAtPrice: 159,
    stock: 55,
    sku: 'PIX-WCH-103',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
    salesCount: 188,
    ratingAvg: 4.5,
    reviewCount: 78,
  },
  {
    vendor: 'hearth-bloom',
    title: 'Oak Accent Lounge Chair',
    slug: 'oak-accent-lounge-chair',
    categories: ['home-garden', 'furniture'],
    price: 210,
    compareAtPrice: 320,
    stock: 12,
    sku: 'HNB-CHR-201',
    image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=900&q=80',
    salesCount: 48,
    ratingAvg: 4.6,
    reviewCount: 31,
  },
  {
    vendor: 'hearth-bloom',
    title: 'Ceramic Dinnerware Set',
    slug: 'ceramic-dinnerware-set',
    categories: ['home-garden', 'kitchen-dining'],
    price: 54,
    compareAtPrice: 76,
    stock: 46,
    sku: 'HNB-KTN-202',
    image: 'https://images.unsplash.com/photo-1603199506016-b9a594b593c0?auto=format&fit=crop&w=900&q=80',
    salesCount: 132,
    ratingAvg: 4.8,
    reviewCount: 67,
  },
  {
    vendor: 'hearth-bloom',
    title: 'Woven Cotton Throw Blanket',
    slug: 'woven-cotton-throw-blanket',
    categories: ['home-garden', 'home-decor'],
    price: 36,
    compareAtPrice: 72,
    stock: 68,
    sku: 'HNB-DEC-203',
    image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=900&q=80',
    salesCount: 155,
    ratingAvg: 4.7,
    reviewCount: 92,
  },
  {
    vendor: 'glow-lab',
    title: 'Vitamin C Glow Serum',
    slug: 'vitamin-c-glow-serum',
    categories: ['health-beauty', 'skincare'],
    price: 28,
    compareAtPrice: 42,
    stock: 88,
    sku: 'GLO-SKN-301',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80',
    salesCount: 201,
    ratingAvg: 4.9,
    reviewCount: 164,
    flashSale: true,
  },
  {
    vendor: 'glow-lab',
    title: 'Soft Matte Lip Trio',
    slug: 'soft-matte-lip-trio',
    categories: ['health-beauty', 'makeup'],
    price: 24,
    compareAtPrice: 48,
    stock: 62,
    sku: 'GLO-MKP-302',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80',
    salesCount: 117,
    ratingAvg: 4.6,
    reviewCount: 73,
  },
  {
    vendor: 'glow-lab',
    title: 'Amber Woods Eau de Parfum',
    slug: 'amber-woods-eau-de-parfum',
    categories: ['health-beauty', 'fragrances'],
    price: 49,
    compareAtPrice: 69,
    stock: 33,
    sku: 'GLO-FRG-303',
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=900&q=80',
    salesCount: 89,
    ratingAvg: 4.7,
    reviewCount: 58,
  },
  {
    vendor: 'trail-play-co',
    title: 'Adjustable Dumbbell Pair',
    slug: 'adjustable-dumbbell-pair',
    categories: ['sports-outdoors', 'fitness-equipment'],
    price: 149,
    compareAtPrice: 229,
    stock: 18,
    sku: 'TPC-FIT-401',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80',
    salesCount: 74,
    ratingAvg: 4.5,
    reviewCount: 42,
  },
  {
    vendor: 'trail-play-co',
    title: 'Trail Hiking Backpack',
    slug: 'trail-hiking-backpack',
    categories: ['sports-outdoors', 'camping-hiking'],
    price: 58,
    compareAtPrice: 116,
    stock: 41,
    sku: 'TPC-HIK-402',
    image: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=900&q=80',
    salesCount: 122,
    ratingAvg: 4.8,
    reviewCount: 84,
  },
  {
    vendor: 'trail-play-co',
    title: 'Wooden Learning Blocks',
    slug: 'wooden-learning-blocks',
    categories: ['baby-kids-toys', 'toys-games'],
    price: 22,
    compareAtPrice: 32,
    stock: 75,
    sku: 'TPC-TOY-403',
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=900&q=80',
    salesCount: 166,
    ratingAvg: 4.8,
    reviewCount: 119,
  },
  {
    vendor: 'maker-paw',
    title: 'Handmade Ceramic Planter',
    slug: 'handmade-ceramic-planter',
    categories: ['handmade-craft-supplies', 'art-collectibles', 'home-garden'],
    price: 34,
    compareAtPrice: 68,
    stock: 28,
    sku: 'MKP-ART-501',
    image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=80',
    salesCount: 105,
    ratingAvg: 4.9,
    reviewCount: 61,
  },
  {
    vendor: 'maker-paw',
    title: 'Personalized Leather Keychain',
    slug: 'personalized-leather-keychain',
    categories: ['handmade-craft-supplies', 'custom-personalized-gifts'],
    price: 16,
    compareAtPrice: 24,
    stock: 120,
    sku: 'MKP-GFT-502',
    image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=900&q=80',
    salesCount: 198,
    ratingAvg: 4.7,
    reviewCount: 134,
  },
  {
    vendor: 'maker-paw',
    title: 'Orthopedic Pet Bed',
    slug: 'orthopedic-pet-bed',
    categories: ['pet-supplies', 'pet-accessories'],
    price: 48,
    compareAtPrice: 96,
    stock: 36,
    sku: 'MKP-PET-503',
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80',
    salesCount: 149,
    ratingAvg: 4.8,
    reviewCount: 97,
    flashSale: true,
  },
  {
    vendor: 'maker-paw',
    title: 'Natural Dog Grooming Kit',
    slug: 'natural-dog-grooming-kit',
    categories: ['pet-supplies', 'grooming'],
    price: 29,
    compareAtPrice: 45,
    stock: 52,
    sku: 'MKP-PET-504',
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=900&q=80',
    salesCount: 87,
    ratingAvg: 4.6,
    reviewCount: 49,
  },
];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toNairaPrice(value) {
  return value * 1000;
}

async function ensureCategories() {
  const categoriesBySlug = new Map();

  for (const [parentName, childNames] of Object.entries(taxonomy)) {
    const parentSlug = slugify(parentName);
    const parent = await Category.findOneAndUpdate(
      { slug: parentSlug },
      { $setOnInsert: { name: parentName, slug: parentSlug, parent: null } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    categoriesBySlug.set(parentSlug, parent);

    for (const childName of childNames) {
      const childSlug = slugify(childName);
      const child = await Category.findOneAndUpdate(
        { slug: childSlug },
        { $setOnInsert: { name: childName, slug: childSlug, parent: parent._id } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      categoriesBySlug.set(childSlug, child);
    }
  }

  return categoriesBySlug;
}

async function ensureVendors() {
  const vendorsBySlug = new Map();

  for (const vendorData of vendors) {
    let owner = await User.findOne({ email: vendorData.email });
    if (!owner) {
      owner = await User.create({
        name: vendorData.ownerName,
        email: vendorData.email,
        password: vendorPassword,
        role: ROLES.VENDOR_ADMIN,
        status: USER_STATUS.ACTIVE,
        isActive: true,
      });
    } else {
      owner.name = vendorData.ownerName;
      owner.role = ROLES.VENDOR_ADMIN;
      owner.status = USER_STATUS.ACTIVE;
      owner.isActive = true;
      owner.password = vendorPassword;
      await owner.save();
    }

    const vendor = await Vendor.findOneAndUpdate(
      { slug: vendorData.slug },
      {
        storeName: vendorData.storeName,
        slug: vendorData.slug,
        description: vendorData.description,
        logoUrl: vendorData.logoUrl,
        owner: owner._id,
        status: VENDOR_STATUS.APPROVED,
        ratingAvg: vendorData.ratingAvg,
        approvedAt: new Date(),
        commissionRate: 0.1,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    owner.vendor = vendor._id;
    await owner.save();
    vendorsBySlug.set(vendorData.slug, vendor);
  }

  return vendorsBySlug;
}

async function seedProducts(categoriesBySlug, vendorsBySlug) {
  let created = 0;
  let updated = 0;

  for (const productData of products) {
    const vendor = vendorsBySlug.get(productData.vendor);
    const categoryIds = productData.categories
      .map((slug) => categoriesBySlug.get(slug)?._id)
      .filter(Boolean);

    if (!vendor || !categoryIds.length) continue;

    const existing = await Product.findOne({ slug: productData.slug });
    const productPayload = {
      vendor: vendor._id,
      name: productData.title,
      title: productData.title,
      slug: productData.slug,
      description: `${productData.title} from ${vendor.storeName}. Carefully selected for Markethub shoppers and ready to ship.`,
      price: toNairaPrice(productData.price),
      compareAtPrice: productData.compareAtPrice ? toNairaPrice(productData.compareAtPrice) : undefined,
      stock: productData.stock,
      sku: productData.sku,
      images: [productData.image],
      category: categoryIds[0],
      categories: categoryIds,
      status: PRODUCT_STATUS.APPROVED,
      createdBy: vendor.owner,
      createdByRole: ROLES.VENDOR_ADMIN,
      pendingChanges: undefined,
      flashSale: {
        active: Boolean(productData.flashSale),
        endsAt: productData.flashSale ? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) : null,
      },
      salesCount: productData.salesCount,
      ratingAvg: productData.ratingAvg,
      reviewCount: productData.reviewCount,
    };

    if (existing) {
      await Product.updateOne({ _id: existing._id }, productPayload);
      updated += 1;
    } else {
      await Product.create(productPayload);
      created += 1;
    }
  }

  return { created, updated };
}

try {
  assertRequiredEnv();
  await connectDB();

  const categoriesBySlug = await ensureCategories();
  const vendorsBySlug = await ensureVendors();
  const productSummary = await seedProducts(categoriesBySlug, vendorsBySlug);

  console.log('Demo storefront seed complete.');
  console.log(`${vendorsBySlug.size} approved vendors ready.`);
  console.log(`${productSummary.created} products created, ${productSummary.updated} products updated.`);
  console.log('');
  console.log('Vendor login accounts:');
  vendors.forEach((vendor) => {
    console.log(`${vendor.storeName}`);
    console.log(`  Email: ${vendor.email}`);
    console.log(`  Password: ${vendorPassword}`);
  });
  process.exit(0);
} catch (error) {
  console.error('Failed to seed demo storefront data');
  console.error(error.message);
  process.exit(1);
}
