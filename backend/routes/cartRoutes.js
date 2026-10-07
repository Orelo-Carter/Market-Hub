import express from 'express';
import {
  addCartItem,
  checkout,
  getCart,
  removeCartItem,
  updateCartItem,
} from '../controllers/cartController.js';
import { ROLES } from '../constants/enums.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { cartSchemas } from '../validators/schemas.js';

const router = express.Router();

router.use(protect, authorize(ROLES.CUSTOMER));
router.get('/', getCart);
router.post('/items', validate(cartSchemas.addItem), addCartItem);
router.patch('/items/:productId', validate(cartSchemas.updateItem), updateCartItem);
router.delete('/items/:productId', validate(cartSchemas.productId), removeCartItem);
router.post('/checkout', validate(cartSchemas.checkout), checkout);

export default router;
