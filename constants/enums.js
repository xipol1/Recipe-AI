const USER_ROLES = Object.freeze(['admin', 'advertiser', 'creator']);

const AD_STATES = Object.freeze([
  'borrador',
  'pendiente_aprobacion',
  'aprobado',
  'rechazado',
  'programado',
  'activo',
  'pausado',
  'completado',
  'cancelado',
  'expirado'
]);

module.exports = {
  USER_ROLES,
  AD_STATES
};
