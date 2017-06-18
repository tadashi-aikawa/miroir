import * as _ from 'lodash';
import * as yaml from 'js-yaml';
import {
    CheckPoint, Condition, DiffKeys, IgnoreCase, PropertyDiffs, PropertyDiffsByCognition,
    Trial
} from '../models/models';

function matchRegExp(pattern: string, target: string): boolean {
    return new RegExp(`^${pattern}$`).test(target);
}

function toCheckedAlready(yamlStr: string): IgnoreCase[] {
    const checkPoint: CheckPoint = yaml.safeLoad(yamlStr);
    const assignVars = (ignoreCase: IgnoreCase): IgnoreCase => _.omitBy(
        _.reduce(checkPoint.vars, (result, v, k) => Object.assign({}, result, {
            image: result.image ? result.image.replace(new RegExp(`{{ ${k} }}`, 'g'), v) : undefined,
            link: result.link ? result.link.replace(new RegExp(`{{ ${k} }}`, 'g'), v) : undefined
        }), ignoreCase),
        v => v === undefined
    );

    return checkPoint.cases.map(assignVars);
}

function createPropertyDiff(ignore: IgnoreCase, path: string, name: string, diff_keys: DiffKeys): PropertyDiffs {
    const validConditions: Condition[] = _.filter(
        ignore.conditions,
        (c: Condition) => _.every([
            !c.path || matchRegExp(c.path, path),
            !c.name || matchRegExp(c.name, name)
        ])
    );

    return Object.assign(new PropertyDiffs(), {
        title: ignore.title,
        image: ignore.image,
        link: ignore.link,
        added: diff_keys.added.filter(
            x => _(validConditions).flatMap(c => c.added).compact().some(c => matchRegExp(c, x))
        ),
        changed: diff_keys.changed.filter(
            x => _(validConditions).flatMap(c => c.changed).compact().some(c => matchRegExp(c, x))
        ),
        removed: diff_keys.removed.filter(
            x => _(validConditions).flatMap(c => c.removed).compact().some(c => matchRegExp(c, x))
        )
    });
}

function createPropertyDiffs(trial: Trial, ignores: IgnoreCase[], checkedAlready: IgnoreCase[]): PropertyDiffsByCognition {
    if (!trial.diff_keys) {
        return undefined;
    }

    const ignoredDiffs: PropertyDiffs[] = ignores.map(
        x => createPropertyDiff(x, trial.path, trial.name, trial.diff_keys)
    );

    const diffsWithoutIgnored: DiffKeys = Object.assign(new DiffKeys(), {
        added: trial.diff_keys.added.filter(x => !_.includes(_.flatMap(ignoredDiffs, y => y.added), x)),
        changed: trial.diff_keys.changed.filter(x => !_.includes(_.flatMap(ignoredDiffs, y => y.changed), x)),
        removed: trial.diff_keys.removed.filter(x => !_.includes(_.flatMap(ignoredDiffs, y => y.removed), x)),
    });

    const checkedAlreadyDiffs: PropertyDiffs[] = checkedAlready.map(
        x => createPropertyDiff(x, trial.path, trial.name, diffsWithoutIgnored)
    );

    const unknownDiffs: DiffKeys = Object.assign(new DiffKeys(), {
        added: diffsWithoutIgnored.added.filter(x => !_.includes(_.flatMap(checkedAlreadyDiffs, y => y.added), x)),
        changed: diffsWithoutIgnored.changed.filter(x => !_.includes(_.flatMap(checkedAlreadyDiffs, y => y.changed), x)),
        removed: diffsWithoutIgnored.removed.filter(x => !_.includes(_.flatMap(checkedAlreadyDiffs, y => y.removed), x)),
    });

    return Object.assign(new PropertyDiffsByCognition(), {
        unknown: Object.assign(new PropertyDiffs(), unknownDiffs),
        checkedAlready: checkedAlreadyDiffs,
        ignored: ignoredDiffs
    });
}

export {
    toCheckedAlready,
    createPropertyDiff,
    createPropertyDiffs
}
