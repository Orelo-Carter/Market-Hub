export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  VENDOR_ADMIN: 'vendor_admin',
  VENDOR_MANAGER: 'vendor_manager',
  MANAGER: 'manager',
  CUSTOMER: 'customer',
};

export const USER_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  INVITED: 'invited',
  SUSPENDED: 'suspended',
  BANNED: 'banned',
};

export const VENDOR_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
};

export const PRODUCT_STATUS = {
  PENDING_VENDOR: 'pending_vendor',
  PENDING_ADMIN: 'pending_admin',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
};
