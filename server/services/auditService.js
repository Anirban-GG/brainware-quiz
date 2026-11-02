const AuditLog = require('../models/AuditLog');

const logAction = async ({ userId, role, action, targetType = '', targetId = '', metadata = {} }) => {
  try {
    await AuditLog.create({
      userId,
      role,
      action,
      targetType,
      targetId: String(targetId),
      metadata
    });
  } catch (err) {
    console.error('[AuditLog Error]: Failed to write audit log', err.message);
  }
};

module.exports = {
  logAction
};
