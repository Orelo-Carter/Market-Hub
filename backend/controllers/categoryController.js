import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { slugify } from '../utils/slugify.js';

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .populate('parent', 'name slug')
    .sort({ parent: 1, name: 1 });

  res.json({ categories });
});

export const createCategory = asyncHandler(async (req, res) => {
  const slug = slugify(req.body.name);
  const existing = await Category.findOne({ slug });
  if (existing) throw new AppError('A category with this name already exists', 409);

  if (req.body.parent) {
    const parent = await Category.findById(req.body.parent);
    if (!parent) throw new AppError('Parent category not found', 404);
    if (parent.parent) throw new AppError('Only top-level categories can be selected as a parent', 400);
  }

  const category = await Category.create({
    name: req.body.name,
    slug,
    parent: req.body.parent || null,
    image: req.body.image,
  });

  res.status(201).json({ category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.categoryId);
  if (!category) throw new AppError('Category not found', 404);

  if (req.body.name && req.body.name !== category.name) {
    const slug = slugify(req.body.name);
    const existing = await Category.findOne({ slug, _id: { $ne: category._id } });
    if (existing) throw new AppError('A category with this name already exists', 409);
    category.name = req.body.name;
    category.slug = slug;
  }

  if (req.body.parent !== undefined) {
    if (req.body.parent) {
      if (req.body.parent === category._id.toString()) {
        throw new AppError('A category cannot be its own parent', 400);
      }

      const parent = await Category.findById(req.body.parent);
      if (!parent) throw new AppError('Parent category not found', 404);
      if (parent.parent) throw new AppError('Only top-level categories can be selected as a parent', 400);
    }

    category.parent = req.body.parent || null;
  }

  if (req.body.image !== undefined) category.image = req.body.image;

  await category.save();
  res.json({ category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.categoryId);
  if (!category) throw new AppError('Category not found', 404);

  const [childCount, productCount] = await Promise.all([
    Category.countDocuments({ parent: category._id }),
    Product.countDocuments({
      $or: [
        { category: category._id },
        { categories: category._id },
        { 'pendingChanges.data.category': category._id },
        { 'pendingChanges.data.categories': category._id },
      ],
    }),
  ]);

  if (childCount > 0) {
    throw new AppError('Cannot delete this category while it has subcategories. Reassign or remove those first.', 400);
  }

  if (productCount > 0) {
    throw new AppError('Cannot delete this category while products use it. Reassign those products first.', 400);
  }

  await category.deleteOne();
  res.status(204).send();
});
