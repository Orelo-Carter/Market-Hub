import express from 'express';
import { updateUserStatus } from '../controllers/adminController.js';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../controllers/categoryController.js';
import {
  approveVendor,
  listPendingVendors,
  listVendors,
  rejectVendor,
  suspendVendor,
} from '../controllers/vendorController.js';
import {
  approveProductByAdmin,
  listPendingAdminProducts,
  rejectProductByAdmin,
} from '../controllers/productController.js';
import { listAllOrders } from '../controllers/orderController.js';
import { ROLES } from '../constants/enums.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { adminSchemas, categorySchemas, orderSchemas, productSchemas, vendorSchemas } from '../validators/schemas.js';

const router = express.Router();

router.use(protect, authorize(ROLES.SUPER_ADMIN));

router.get('/vendors/pending', validate(vendorSchemas.list), listPendingVendors);
router.get('/vendors', validate(vendorSchemas.list), listVendors);
router.patch('/vendors/:vendorId/approve', validate(vendorSchemas.adminDecision), approveVendor);
router.patch('/vendors/:vendorId/reject', validate(vendorSchemas.adminDecision), rejectVendor);
router.patch('/vendors/:vendorId/suspend', validate(vendorSchemas.adminDecision), suspendVendor);

router.get('/products/pending', validate(productSchemas.listPending), listPendingAdminProducts);
router.patch('/products/:productId/approve', validate(productSchemas.adminReview), approveProductByAdmin);
router.patch('/products/:productId/reject', validate(productSchemas.adminReview), rejectProductByAdmin);

router.get('/orders', validate(orderSchemas.list), listAllOrders);
router.patch('/users/:userId/status', validate(adminSchemas.updateUserStatus), updateUserStatus);

router.get('/categories', listCategories);
router.post('/categories', validate(categorySchemas.create), createCategory);
router.patch('/categories/:categoryId', validate(categorySchemas.update), updateCategory);
router.delete('/categories/:categoryId', validate(categorySchemas.categoryId), deleteCategory);

export default router;
