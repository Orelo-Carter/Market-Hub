import express from 'express';
import { listVendorOrders, updateVendorSubOrderStatus } from '../controllers/orderController.js';
import { ROLES } from '../constants/enums.js';
import { authorize, protect, requireApprovedVendor } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { orderSchemas } from '../validators/schemas.js';

const router = express.Router();

router.use(protect, authorize(ROLES.VENDOR_ADMIN, ROLES.VENDOR_MANAGER, ROLES.MANAGER), requireApprovedVendor);
router.get('/', validate(orderSchemas.list), listVendorOrders);
router.patch('/:orderId/status', validate(orderSchemas.updateVendorOrderStatus), updateVendorSubOrderStatus);
router.patch('/:orderId/sub-orders/:subOrderId/status', validate(orderSchemas.updateSubOrderStatus), updateVendorSubOrderStatus);

export default router;
