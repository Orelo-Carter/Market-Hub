import express from 'express';
import {
  getPublicProduct,
  listFlashSaleProducts,
  listPublicProducts,
  listTopSellerProducts,
} from '../controllers/productController.js';
import { validate } from '../middleware/validate.js';
import { productSchemas } from '../validators/schemas.js';

const router = express.Router();

router.get('/', validate(productSchemas.listPublic), listPublicProducts);
router.get('/flash-sales', listFlashSaleProducts);
router.get('/top-sellers', validate(productSchemas.topSellers), listTopSellerProducts);
router.get('/:productId', validate(productSchemas.publicLookup), getPublicProduct);

export default router;
