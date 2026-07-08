export const PROCESS_TYPES = [
  'PURCHASE',
  'PAYMENT',
  'IMPREST',
  'LEAVE REQUEST',
  'PAYROLL'
];

export const getProcessTypes = (hasHumanResourcesModule: boolean) => {
  if (hasHumanResourcesModule) {
    return PROCESS_TYPES;
  }

  return PROCESS_TYPES.filter(
    (type) => !['LEAVE REQUEST', 'PAYROLL'].includes(type)
  );
};
