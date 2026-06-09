export const PROCESS_TYPES = [
    'PURCHASE',
    'PAYMENT',
    'IMPREST',
    'IMPREST RETIREMENT',
    'LEAVE REQUEST'
];

export const getProcessTypes = (hasHumanResourcesModule: boolean) => {
    if (hasHumanResourcesModule) {
        return PROCESS_TYPES;
    }

    return PROCESS_TYPES.filter((type) => type !== 'LEAVE REQUEST');
};