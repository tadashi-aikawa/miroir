export function regexpComparator (filter: string, gridValue: any, regExp: string): boolean {
    switch (filter) {
    case 'contains':
        return !!gridValue.match(new RegExp(regExp));
    case 'notContains':
        return !gridValue.match(new RegExp(regExp));
    case 'equals':
        return !!gridValue.match(new RegExp(`^(${regExp})$`));
    case 'notEqual':
        return !gridValue.match(new RegExp(`^(${regExp})$`));
    case 'startsWith':
        return !!gridValue.match(new RegExp(`^(${regExp})`));
    case 'endsWith':
        return !!gridValue.match(new RegExp(`(${regExp})$`));
    default:
        // should never happen
        console.warn('invalid filter type ' + filter);
        return false;
    }
}

