import {
    AccessPoint,
    Condition,
    DiffKeys,
    EditorConfig,
    IgnoreCase,
    MergeViewConfig,
    PropertyDiffs,
    PropertyDiffsByCognition,
    Trial
} from '../../models/models';
import {AwsService} from '../../services/aws-service';
import {Component, Input, OnInit, Optional, ViewChild} from '@angular/core';
import * as yaml from 'js-yaml';
import {MdDialogRef} from '@angular/material';
import {IOption} from 'ng-select';
import {Hotkey, HotkeysService} from 'angular2-hotkeys';
import {LocalDataSource} from 'ng2-smart-table';
import {LocalStorageService} from 'angular-2-local-storage';
import * as _ from 'lodash';


interface RowData {
    key: string;
    value: string;
}

const toLanguage = (contentType: string) => {
    if (contentType.match(/json/)) {
        return 'json';
    } else if (contentType.match(/xml/)) {
        return 'xml';
    } else if (contentType.match(/html/)) {
        return 'html';
    } else {
        return 'plain';
    }
};

const filterFunction = (v, q) =>
    q.split(' and ').every(x => {
        try {
            return new RegExp(x).test(v);
        } catch (e) {
            return false;
        }
    });

function createConfig(one: string, other: string, oneContentType: string, otherContentType: string, sideBySide: boolean): MergeViewConfig {
    return {
        leftContent: one,
        leftContentType: oneContentType,
        rightContent: other,
        rightContentType: otherContentType,
        readOnly: false,
        sideBySide: sideBySide,
        theme: 'vs'
    };
}

@Component({
    templateUrl: './detail-dialog.component.html',
    styleUrls: [
        './detail-dialog.css',
        '../../../../node_modules/hover.css/css/hover.css'
    ]
})
export class DetailDialogComponent implements OnInit {
    @Input() reportKey: string;
    @Input() oneAccessPoint: AccessPoint;
    @Input() otherAccessPoint: AccessPoint;
    @Input() trials: Trial[];
    @Input() ignores: IgnoreCase[];
    @Input() checkedAlready: IgnoreCase[];
    @Input() activeTabIndex: string;
    @Input() unifiedDiff: boolean = this.localStorageService.get<boolean>('unifiedDiff');

    @ViewChild('selector') selector;
    @ViewChild('mergeView') mergeView;
    @ViewChild('editor') editor;

    queryTableSettings: any;
    queryTableSource = new LocalDataSource();
    propertyDiffsByCognition: PropertyDiffsByCognition;
    oneExpectedEncoding: string;
    otherExpectedEncoding: string;

    activeIndex: string;
    options: IOption[];
    isLoading: boolean;
    errorMessage: string;
    mergeViewConfig: MergeViewConfig;
    editorConfig: EditorConfig;
    displayedQueries: {key: string, value: string}[];

    get activeIndexNum(): number {
        return Number(this.activeIndex)
    }

    constructor(private service: AwsService,
                @Optional() public dialogRef: MdDialogRef<DetailDialogComponent>,
                private _hotkeysService: HotkeysService,
                private localStorageService: LocalStorageService) {
        // To prevent from unexpected close
        dialogRef._containerInstance.dialogConfig = {disableClose: true};

        // XXX: _hotkeysService.remove(Hotkey[]) is not worked (maybe issues)
        _hotkeysService.hotkeys.splice(0).forEach(x => _hotkeysService.remove(x));

        _hotkeysService.add([
            new Hotkey('d', () => {this.changeTab(0); return false; }, null, 'Move `Diff viewer` tab.'),
            new Hotkey('q', () => {this.changeTab(1); return false; }, null, 'Move `Query parameters` tab.'),
            new Hotkey('p', () => {this.changeTab(2); return false; }, null, 'Move `Property diffs` tab.'),
            new Hotkey('i', () => {this.mergeView.moveToPreviousDiff(true); return false; }, null, 'Move to next diff.'),
            new Hotkey('j', () => {this.showPreviousTrial(); return false; }, null, 'Show previous trial.'),
            new Hotkey('k', () => {this.mergeView.moveToNextDiff(true); return false; }, null, 'Move to previous diff.'),
            new Hotkey('l', () => {this.showNextTrial(); return false; }, null, 'Show next trial.'),
            new Hotkey('w', () => {this.closeDialog(); return false; }, null, 'Close this dialog'),
            new Hotkey('/', () => {this.openSelector(); return false; }, null, 'Open trial list'),
            new Hotkey('?', () => {this.toggleCheatSheet(); return false; }, null, 'Open/Close cheat sheet')
        ]);
    }

    ngOnInit(): void {
        // FIXME
        this.editorConfig = {
            content: `
- title: for test
  conditions:
    - removed:
        - root<'items'><[0-9]><'color'>
          `,
            contentType: 'yaml',
            readOnly: false,
            theme: 'vs'
        };

        this.checkedAlready = yaml.safeLoad(this.editorConfig.content);

        // value is index of trial
        this.options = this.trials.map((t, i) => ({
            label: `${t.seq}. ${t.name} (${t.path})`,
            value: String(i)
        }));

        this.queryTableSettings = {
            columns: {
                key: {title: 'Key', filterFunction: filterFunction},
                value: {title: 'Value', filterFunction: filterFunction}
            },
            actions: false
        };
        this.showTrial(this.getActiveTrial());
    }

    toggleCheatSheet(): void {
        this._hotkeysService.cheatSheetToggle.next({});
    }

    closeDialog(): void {
        this.dialogRef.close();
    }

    getActiveTrial(): Trial {
        return this.trials[this.activeIndex];
    }

    showNextTrial(): boolean {
        if (this.activeIndexNum === this.trials.length - 1) {
            return false;
        }

        this.showTrial(this.trials[this.activeIndexNum + 1]);
        this.activeIndex = String(this.activeIndexNum + 1);
    }

    showPreviousTrial(): boolean {
        if (this.activeIndexNum === 0) {
            return false;
        }

        this.showTrial(this.trials[this.activeIndexNum - 1]);
        this.activeIndex = String(this.activeIndexNum - 1);
    }

    openSelector(): void {
        this.selector.open();
    }

    showTrial(trial: Trial): void {
        // Diff viewer
        this.isLoading = true;
        if (trial.hasResponse()) {
            const fetchFile = (file: string) => this.service.fetchTrial(this.reportKey, file);
            Promise.all([fetchFile(trial.one.file), fetchFile(trial.other.file)])
                .then((rs: {encoding: string, body: string}[]) => {
                    this.isLoading = false;
                    this.errorMessage = undefined;
                    this.mergeViewConfig = createConfig(
                        rs[0].body, rs[1].body,
                        toLanguage(trial.one.content_type), toLanguage(trial.other.content_type),
                        !this.unifiedDiff
                    );
                    this.oneExpectedEncoding = rs[0].encoding;
                    this.otherExpectedEncoding = rs[1].encoding;
                })
                .catch(err => {
                    this.isLoading = false;
                    this.errorMessage = err;
                });
        } else {
            this.errorMessage = undefined;
            // We must initialize mergeView after set config.
            // Changing `this.isLoading` and sleep a bit time causes onInit event so I wrote ...
            setTimeout(() => {
                this.isLoading = false;
                this.mergeViewConfig = createConfig('No file', 'No file', 'text', 'text', !this.unifiedDiff);
            }, 100);
        }

        // Query parameters
        this.displayedQueries = Object.keys(trial.queries)
            .map(k => ({key: k, value: trial.queries[k].join(', ')}));
        this.queryTableSource.load(this.displayedQueries.map(t => (<RowData>{
            key: t.key,
            value: t.value
        })));

        // Property diffs
        this.updatePropertyDiffs(trial);
    }

    private updatePropertyDiffs(trial: Trial) {
        const ignoredDiffs: PropertyDiffs[] = this.ignores.map(
            x => this.createPropertyDiff(x, trial.path, trial.diff_keys)
        );

        const diffsWithoutIgnored: DiffKeys = {
            added: trial.diff_keys.added.filter(x => !_.includes(_.flatMap(ignoredDiffs, x => x.added), x)),
            changed: trial.diff_keys.changed.filter(x => !_.includes(_.flatMap(ignoredDiffs, x => x.changed), x)),
            removed: trial.diff_keys.removed.filter(x => !_.includes(_.flatMap(ignoredDiffs, x => x.removed), x)),
        };

        const checkedAlreadyDiffs: PropertyDiffs[] = this.checkedAlready.map(
            x => this.createPropertyDiff(x, trial.path, diffsWithoutIgnored)
        );

        const unknownDiffs: DiffKeys = {
            added: diffsWithoutIgnored.added.filter(x => !_.includes(_.flatMap(checkedAlreadyDiffs, x => x.added), x)),
            changed: diffsWithoutIgnored.changed.filter(x => !_.includes(_.flatMap(checkedAlreadyDiffs, x => x.changed), x)),
            removed: diffsWithoutIgnored.removed.filter(x => !_.includes(_.flatMap(checkedAlreadyDiffs, x => x.removed), x)),
        };

        this.propertyDiffsByCognition = Object.assign(new PropertyDiffsByCognition(), {
            unknown: Object.assign(new PropertyDiffs(), unknownDiffs),
            checkedAlready: checkedAlreadyDiffs,
            ignored: ignoredDiffs
        });
    }

    changeTab(index: number): void {
        this.activeTabIndex = String(index);
        this.afterChangeTab(index);
    }

    changeDiffType(unifiedDiff: boolean) {
        this.unifiedDiff = unifiedDiff;
        this.localStorageService.set('unifiedDiff', unifiedDiff);

        this.mergeViewConfig.sideBySide = !unifiedDiff;

        // We must initialize mergeView after set config.
        // Changing `this.isLoading` and sleep a bit time causes onInit event so I wrote ...
        this.isLoading = true;
        setTimeout(() => {
            this.isLoading = false;
        }, 1);
    }

    afterChangeTab(index: number): void {
        if (index === 0 && this.mergeView) {
            this.mergeView.updateView();
        }

        if (index === 2 && this.editor) {
            this.editor.updateView();
        }
    }

    updateEditorConfig() {
        this.checkedAlready = yaml.safeLoad(this.editor.getValue());
        this.updatePropertyDiffs(this.getActiveTrial());
    }

    createActiveTrialLink() {
        return `${location.origin}${location.pathname}#/report/${this.reportKey}/${this.reportKey}/${this.getActiveTrial().seq}`
    }

    // congnitionは出てこない....
    private createPropertyDiff(ignore: IgnoreCase, path: string, diff_keys: DiffKeys): PropertyDiffs {
        const validConditions: Condition[] = _.filter(
            ignore.conditions,
            (c: Condition) => !c.path || matchRegExp(c.path, path)
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
}

function matchRegExp(pattern: string, target: string): boolean {
    return new RegExp(pattern).test(target);
}
