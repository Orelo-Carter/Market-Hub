import express from 'express';
import {
  getMyVendor,
  getPublicVendor,
  inviteManager,
  inviteVendorManager,
  listVendorManagers,
  listManagers,
  removeVendorManager,
  registerVendor,
  updateVendorManagerPermissions,
  updateManagerPermissions,
  updateVendorProfile,
} from '../controllers/vendorController.js';
import { ROLES } from '../constants/enums.js';
import { authorize, protect, requireApprovedVendor } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { vendorSchemas } from '../validators/schemas.js';

const router = express.Router();

router.post('/register', validate(vendorSchemas.register), registerVendor);
router.get('/public/:slug', getPublicVendor);

router.use(protect, authorize(ROLES.VENDOR_ADMIN, ROLES.VENDOR_MANAGER, ROLES.MANAGER), requireApprovedVendor);
router.get('/me', getMyVendor);
router.patch('/profile', authorize(ROLES.VENDOR_ADMIN), validate(vendorSchemas.updateProfile), updateVendorProfile);

router.use(authorize(ROLES.VENDOR_ADMIN));
router.get('/:vendorId/managers', validate(vendorSchemas.managerByVendor), listVendorManagers);
router.post('/:vendorId/managers', validate(vendorSchemas.inviteManagerByVendor), inviteVendorManager);
router.patch('/:vendorId/managers/:userId/permissions', validate(vendorSchemas.updateManagerByVendor), updateVendorManagerPermissions);
router.delete('/:vendorId/managers/:userId', validate(vendorSchemas.removeManagerByVendor), removeVendorManager);
router.get('/managers', listManagers);
router.post('/managers/invite', validate(vendorSchemas.inviteManager), inviteManager);
router.patch('/managers/:managerId', validate(vendorSchemas.updateManager), updateManagerPermissions);

export default router;
