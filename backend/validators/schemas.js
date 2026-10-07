import { z } from 'zod';
import { ORDER_STATUS, USER_STATUS, VENDOR_STATUS } from '../constants/enums.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');
const money = z.coerce.number().min(0);
const variantOptionSchema = z.object({
  label: z.string().trim().min(1),
  priceModifier: z.coerce.number().min(0).optional().default(0),
  stock: z.coerce.number().int().min(0).optional().default(0),
  sku: z.string().trim().optional().default(''),
});
const variantSchema = z.object({
  name: z.string().trim().optional().default(''),
  options: z.array(variantOptionSchema).optional().default([]),
});
const flashSaleSchema = z.object({
  active: z.boolean().optional().default(false),
  endsAt: z.coerce.date().nullable().optional().default(null),
});
const paginationQuery = {
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
};

export const authSchemas = {
  registerCustomer: z.object({
    body: z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
    }),
  }),
  login: z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }),
  }),
  acceptInvite: z.object({
    body: z.object({
      token: z.string().min(32),
      name: z.string().min(2).optional(),
      password: z.string().min(8),
    }),
  }),
  setPassword: z.object({
    body: z.object({
      token: z.string().min(20),
      password: z.string().min(8),
    }),
  }),
  validateSetPassword: z.object({
    params: z.object({ token: z.string().min(20) }),
  }),
};

export const vendorSchemas = {
  register: z.object({
    body: z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
      storeName: z.string().min(2),
      description: z.string().max(2000).optional(),
    }),
  }),
  list: z.object({
    query: z.object({
      ...paginationQuery,
      status: z.enum(Object.values(VENDOR_STATUS)).optional(),
      search: z.string().optional(),
    }),
  }),
  adminDecision: z.object({
    params: z.object({ vendorId: objectId }),
    body: z.object({ reason: z.string().max(1000).optional() }).optional().default({}),
  }),
  inviteManager: z.object({
    body: z.object({
      email: z.string().email(),
      name: z.string().min(2).optional(),
      permissions: z.object({
        canCreateProduct: z.boolean().optional(),
        canEditProduct: z.boolean().optional(),
        canDeleteProduct: z.boolean().optional(),
        canViewOrders: z.boolean().optional(),
        canManageOrders: z.boolean().optional(),
      }).default({}),
    }),
  }),
  inviteManagerByVendor: z.object({
    params: z.object({ vendorId: objectId }),
    body: z.object({
      email: z.string().email(),
      permissions: z.object({
        canCreateProduct: z.boolean().optional(),
        canEditProduct: z.boolean().optional(),
        canDeleteProduct: z.boolean().optional(),
        canViewOrders: z.boolean().optional(),
      }).default({}),
    }),
  }),
  updateManager: z.object({
    params: z.object({ managerId: objectId }),
    body: z.object({
      permissions: z.object({
        canCreateProduct: z.boolean().optional(),
        canEditProduct: z.boolean().optional(),
        canDeleteProduct: z.boolean().optional(),
        canViewOrders: z.boolean().optional(),
        canManageOrders: z.boolean().optional(),
      }),
    }),
  }),
  updateManagerByVendor: z.object({
    params: z.object({ vendorId: objectId, userId: objectId }),
    body: z.object({
      permissions: z.object({
        canCreateProduct: z.boolean().optional(),
        canEditProduct: z.boolean().optional(),
        canDeleteProduct: z.boolean().optional(),
        canViewOrders: z.boolean().optional(),
      }),
    }),
  }),
  managerByVendor: z.object({
    params: z.object({ vendorId: objectId }),
  }),
  removeManagerByVendor: z.object({
    params: z.object({ vendorId: objectId, userId: objectId }),
  }),
  updateProfile: z.object({
    body: z.object({
      storeName: z.string().min(2).optional(),
      description: z.string().max(2000).optional(),
      logo: z.string().url().optional().or(z.literal('')),
      banner: z.string().url().optional().or(z.literal('')),
      bankName: z.string().trim().optional(),
      accountNumber: z.string().trim().optional(),
      accountName: z.string().trim().optional(),
    }),
  }),
};

export const productSchemas = {
  listPublic: z.object({
    query: z.object({
      ...paginationQuery,
      search: z.string().optional(),
      minPrice: z.coerce.number().min(0).optional(),
      maxPrice: z.coerce.number().min(0).optional(),
      vendor: z.string().optional(),
      sort: z.enum(['newest', 'price_asc', 'price_desc', 'top_rated', 'discount_desc']).optional(),
      category: z.string().optional(),
      minDiscountPercent: z.coerce.number().min(0).max(100).optional(),
    }),
  }),
  topSellers: z.object({
    query: z.object({
      limit: z.coerce.number().int().positive().max(48).optional(),
    }),
  }),
  create: z.object({
    body: z.object({
      name: z.string().min(2).optional(),
      title: z.string().min(2).optional(),
      description: z.string().min(1),
      price: money,
      compareAtPrice: money.optional(),
      stock: z.coerce.number().int().min(0),
      sku: z.string().trim().optional(),
      images: z.array(z.string().url()).optional().default([]),
      category: objectId.optional(),
      categories: z.array(objectId).optional(),
      variants: z.array(variantSchema).optional().default([]),
      flashSale: flashSaleSchema.optional(),
    })
      .refine((body) => body.name || body.title, 'Product name or title is required')
      .refine(
        (body) => body.category || body.categories?.length,
        'Select at least one category',
      ),
  }),
  update: z.object({
    params: z.object({ productId: objectId }),
    body: z.object({
      name: z.string().min(2).optional(),
      title: z.string().min(2).optional(),
      description: z.string().min(1).optional(),
      price: money.optional(),
      compareAtPrice: money.optional(),
      stock: z.coerce.number().int().min(0).optional(),
      sku: z.string().trim().optional(),
      images: z.array(z.string().url()).optional(),
      category: objectId.optional(),
      categories: z.array(objectId).optional(),
      variants: z.array(variantSchema).optional(),
      flashSale: flashSaleSchema.optional(),
    }).refine((body) => Object.keys(body).length > 0, 'At least one field is required'),
  }),
  productId: z.object({ params: z.object({ productId: objectId }) }),
  publicLookup: z.object({ params: z.object({ productId: z.string().min(1) }) }),
  vendorReview: z.object({
    params: z.object({ productId: objectId }),
    body: z.object({ reason: z.string().max(1000).optional() }).optional().default({}),
  }),
  adminReview: z.object({
    params: z.object({ productId: objectId }),
    body: z.object({ reason: z.string().max(1000).optional() }).optional().default({}),
  }),
  listPending: z.object({
    query: z.object({ ...paginationQuery, vendor: objectId.optional() }),
  }),
};

export const cartSchemas = {
  addItem: z.object({
    body: z.object({
      productId: objectId,
      quantity: z.coerce.number().int().min(1),
    }),
  }),
  updateItem: z.object({
    params: z.object({ productId: objectId }),
    body: z.object({ quantity: z.coerce.number().int().min(1) }),
  }),
  productId: z.object({ params: z.object({ productId: objectId }) }),
  checkout: z.object({
    body: z.object({
      payment: z.object({
        provider: z.string().optional(),
        reference: z.string().optional(),
        status: z.enum(['pending', 'paid']).optional(),
      }).optional(),
    }).optional().default({}),
  }),
};

export const orderSchemas = {
  list: z.object({
    query: z.object({ ...paginationQuery, status: z.enum(Object.values(ORDER_STATUS)).optional() }),
  }),
  orderId: z.object({ params: z.object({ orderId: objectId }) }),
  updateSubOrderStatus: z.object({
    params: z.object({ orderId: objectId, subOrderId: objectId }),
    body: z.object({
      status: z.enum(Object.values(ORDER_STATUS)),
      trackingNumber: z.string().trim().optional(),
      carrier: z.string().trim().optional(),
      note: z.string().trim().optional(),
    }),
  }),
  updateVendorOrderStatus: z.object({
    params: z.object({ orderId: objectId }),
    body: z.object({
      status: z.enum(Object.values(ORDER_STATUS)),
      trackingNumber: z.string().trim().optional(),
      carrier: z.string().trim().optional(),
      note: z.string().trim().optional(),
    }),
  }),
};

export const checkoutSchemas = {
  create: z.object({
    body: z.object({
      shippingAddress: z.object({
        name: z.string().min(2),
        phone: z.string().min(5),
        addressLine: z.string().min(4),
        city: z.string().min(2),
        state: z.string().min(2),
        country: z.string().min(2),
      }),
      cartItems: z.array(z.object({
        productId: objectId,
        variantSelection: z.record(z.string(), z.any()).optional().default({}),
        quantity: z.coerce.number().int().min(1),
      })).min(1),
    }),
  }),
  verify: z.object({
    params: z.object({
      reference: z.string().min(6),
    }),
  }),
};

export const adminSchemas = {
  updateUserStatus: z.object({
    params: z.object({ userId: objectId }),
    body: z.object({ status: z.enum([USER_STATUS.ACTIVE, USER_STATUS.SUSPENDED, USER_STATUS.BANNED]) }),
  }),
};

export const categorySchemas = {
  create: z.object({
    body: z.object({
      name: z.string().min(2),
      parent: objectId.nullable().optional(),
      image: z.string().url().optional().or(z.literal('')),
    }),
  }),
  update: z.object({
    params: z.object({ categoryId: objectId }),
    body: z.object({
      name: z.string().min(2).optional(),
      parent: objectId.nullable().optional(),
      image: z.string().url().optional().or(z.literal('')),
    }),
  }),
  categoryId: z.object({
    params: z.object({ categoryId: objectId }),
  }),
};
