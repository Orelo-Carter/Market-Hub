import express from 'express';
import { createCheckout, verifyCheckoutPayment } from '../controllers/checkoutController.js';
import { ROLES } from '../constants/enums.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { checkoutSchemas } from '../validators/schemas.js';

const router = express.Router();

router.use(protect, authorize(ROLES.CUSTOMER));
router.post('/', validate(checkoutSchemas.create), createCheckout);
router.get('/verify/:reference', validate(checkoutSchemas.verify), verifyCheckoutPayment);

export default router;
