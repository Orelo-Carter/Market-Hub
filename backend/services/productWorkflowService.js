import { ROLES, PRODUCT_STATUS } from '../constants/enums.js';

const productFields = [
  'name',
  'title',
  'description',
  'price',
  'compareAtPrice',
  'stock',
  'sku',
  'images',
  'category',
  'categories',
  'variants',
  'flashSale',
];

export function buildProductPayload(body) {
  return productFields.reduce((payload, field) => {
    if (body[field] !== undefined) payload[field] = body[field];
    return payload;
  }, {});
}

export function initialProductStatusFor(user) {
  return [ROLES.VENDOR_MANAGER, ROLES.MANAGER].includes(user.role)
    ? PRODUCT_STATUS.PENDING_VENDOR
    : PRODUCT_STATUS.PENDING_ADMIN;
}

export function createPendingChanges({ action, data, user, reviewStatus }) {
  return {
    action,
    data,
    submittedBy: user._id,
    submittedRole: user.role,
    submittedAt: new Date(),
    reviewStatus: reviewStatus || initialProductStatusFor(user),
  };
}

export function applyApprovedChanges(product, reviewerId) {
  const changes = product.pendingChanges;
  if (!changes) return product;

  if (changes.action === 'delete') {
    product.deletedAt = new Date();
    product.status = PRODUCT_STATUS.REJECTED;
    product.rejectionReason = 'Deleted after admin approval';
  } else {
    Object.assign(product, changes.data);
    product.status = PRODUCT_STATUS.APPROVED;
    product.rejectionReason = undefined;
  }

  product.history.push({
    action: changes.action,
    data: changes.data,
    changedBy: reviewerId,
    note: 'Super Admin approved pending changes',
  });
  product.pendingChanges = undefined;

  return product;
}

export function rejectPendingChanges(product, reviewerId, reason) {
  product.rejectionReason = reason || 'Rejected';
  product.history.push({
    action: 'reject',
    data: product.pendingChanges?.data,
    changedBy: reviewerId,
    note: reason || 'Rejected',
  });

  if (product.status === PRODUCT_STATUS.APPROVED) {
    product.pendingChanges = undefined;
  } else {
    product.status = PRODUCT_STATUS.REJECTED;
  }

  return product;
}
