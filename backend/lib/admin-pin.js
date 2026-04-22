const DEFAULT_ADMIN_PIN_HASH = '$2b$10$ALFo.0ELVxWpfbkXZ3O8feiZDEmMelYE0AKGWP/aIy857eacF.j.C';

function isStaffRole(role) {
  return role === 'admin' || role === 'mod';
}

async function ensureStaffPinHash(db, userId, role) {
  if (!isStaffRole(role)) return false;

  await db.query(
    'UPDATE users SET pin_hash = COALESCE(pin_hash, ?) WHERE id = ?',
    [DEFAULT_ADMIN_PIN_HASH, userId]
  );

  return true;
}

module.exports = {
  DEFAULT_ADMIN_PIN_HASH,
  isStaffRole,
  ensureStaffPinHash,
};