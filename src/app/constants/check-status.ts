const _enum = {
    todo: 'Todo',
    looking: 'Looking',
    looked: 'Looked',
    confirming: 'Confirming',
    confirmed: 'Confirmed',
    "creating-issue": 'Creating issue',
    closed: 'Closed'
};

type CheckStatus = keyof typeof _enum

namespace CheckStatuses {
    export const values: CheckStatus[] = Object.keys(_enum) as CheckStatus[];
    export const toDisplay = (key: CheckStatus): string => _enum[key];
}

export {
    CheckStatuses
};
export default CheckStatus;
