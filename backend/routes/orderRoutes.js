import express from 'express';
import { getMyOrder, listMyOrders } from '../controllers/orderController.js';
import { ROLES } from '../constants/enums.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { orderSchemas } from '../validators/schemas.js';

const router = express.Router();

router.use(protect, authorize(ROLES.CUSTOMER));
router.get('/', validate(orderSchemas.list), listMyOrders);
router.get('/:orderId', validate(orderSchemas.orderId), getMyOrder);

export default router;
