import express from 'express';
import {
  acceptManagerInvite,
  login,
  me,
  registerCustomer,
  setPassword,
  validateSetPasswordToken,
} from '../controllers/authController.js';
import { ROLES } from '../constants/enums.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { authSchemas } from '../validators/schemas.js';

const router = express.Router();

router.post('/register', validate(authSchemas.registerCustomer), registerCustomer);
router.post('/login', validate(authSchemas.login), login);
router.post('/manager/accept-invite', validate(authSchemas.acceptInvite), acceptManagerInvite);
router.get('/set-password/:token/validate', validate(authSchemas.validateSetPassword), validateSetPasswordToken);
router.post('/set-password', validate(authSchemas.setPassword), setPassword);
router.get('/me', protect, authorize(ROLES.SUPER_ADMIN, ROLES.VENDOR_ADMIN, ROLES.VENDOR_MANAGER, ROLES.MANAGER, ROLES.CUSTOMER), me);

export default router;
