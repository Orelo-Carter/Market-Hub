import express from 'express';
import {
  approveManagerProduct,
  createProduct,
  deleteProduct,
  listPendingVendorProducts,
  listVendorProducts,
  rejectManagerProduct,
  updateProduct,
} from '../controllers/productController.js';
import { ROLES } from '../constants/enums.js';
import {
  authorize,
  protect,
  requireApprovedVendor,
  requireManagerPermission,
} from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { productSchemas } from '../validators/schemas.js';

const router = express.Router();

router.use(
  protect,
  authorize(ROLES.VENDOR_ADMIN, ROLES.VENDOR_MANAGER, ROLES.MANAGER),
  requireApprovedVendor,
);

router.get('/', listVendorProducts);
router.post('/', requireManagerPermission('canCreateProduct'), validate(productSchemas.create), createProduct);
router.patch('/:productId', requireManagerPermission('canEditProduct'), validate(productSchemas.update), updateProduct);
router.delete('/:productId', requireManagerPermission('canDeleteProduct'), validate(productSchemas.productId), deleteProduct);

router.get('/reviews/pending-manager', authorize(ROLES.VENDOR_ADMIN), listPendingVendorProducts);
router.patch('/:productId/vendor-approve', authorize(ROLES.VENDOR_ADMIN), validate(productSchemas.vendorReview), approveManagerProduct);
router.patch('/:productId/vendor-reject', authorize(ROLES.VENDOR_ADMIN), validate(productSchemas.vendorReview), rejectManagerProduct);

export default router;
