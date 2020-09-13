import * as _ from 'lodash';
import * as yaml from 'js-yaml';
import {
    CheckPoint, Condition, DiffKeys, IgnoreCase, PropertyDiffs, PropertyDiffsByCognition,
    Trial
} from '../models/models';
import {ignore} from 'selenium-webdriver/testing'

const isDiffKeysEmpty = (diffKeys: DiffKeys): boolean =>
    diffKeys.added.length === 0 &&
    diffKeys.changed.length === 0 &&
    diffKeys.removed.length === 0;

function matchRegExp(pattern: string, target: string): boolean {
    return new RegExp(`^(${pattern})$`).test(target);
}

function toLodashPath(property: string): string {
    return property
        .replace('root', '')
        .replace(/</g, '[')
        .replace(/>/g, ']');
}

function toCheckedAlready(yamlStr: string): IgnoreCase[] {
    const checkPoint: CheckPoint = yaml.safeLoad(yamlStr) as CheckPoint;
    const assignVars = (ignoreCase: IgnoreCase): IgnoreCase =>
        _.reduce(checkPoint.vars, (result, v, k) => Object.assign({}, result, {
            image: result.image ? result.image.replace(new RegExp(`{{ ${k} }}`, 'g'), v) : undefined,
            link: result.link ? result.link.replace(new RegExp(`{{ ${k} }}`, 'g'), v) : undefined
        }), ignoreCase);

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
    if (!trial.diff_keys && !trial.diffs_by_cognition) {
        return undefined;
    }

    let ignoredDiffs: PropertyDiffs[]
    let diffsWithoutIgnored: DiffKeys
    if (trial.diffs_by_cognition) {
        const toPropertyDiffs = (val, key) => Object.assign(
            new PropertyDiffs(),
            { title: key, added: val.added, changed: val.changed, removed: val.removed, }
        )

        ignoredDiffs = _(trial.diffs_by_cognition)
            .map(toPropertyDiffs)
            .filter( x => x.title !== 'unknown' )
            .value()
        diffsWithoutIgnored = trial.diffs_by_cognition.unknown || Object.assign(new DiffKeys(), {
            added: [], changed: [], removed: [],
        })
    } else {
        // FIXME: Old operation... erase soon if judgement/ignore_properties is removed
        ignoredDiffs = ignores.map(
            x => createPropertyDiff(x, trial.path, trial.name, trial.diff_keys)
        );
        diffsWithoutIgnored = Object.assign(new DiffKeys(), {
            added: trial.diff_keys.added.filter(x => !_.includes(_.flatMap(ignoredDiffs, y => y.added), x)),
            changed: trial.diff_keys.changed.filter(x => !_.includes(_.flatMap(ignoredDiffs, y => y.changed), x)),
            removed: trial.diff_keys.removed.filter(x => !_.includes(_.flatMap(ignoredDiffs, y => y.removed), x)),
        });
    }

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
        checkedAlready: checkedAlreadyDiffs.filter(x => !isDiffKeysEmpty(x)),
        ignored: ignoredDiffs.filter(x => !isDiffKeysEmpty(x))
    });
}

export {
    toCheckedAlready,
    toLodashPath,
    createPropertyDiff,
    createPropertyDiffs
}
