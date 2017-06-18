import {
    AccessPoint,
    DiffViewConfig,
    EditorConfig,
    IgnoreCase,
    Pair,
    PropertyDiffs,
    PropertyDiffsByCognition,
    Trial
} from '../../models/models';
import {AwsService} from '../../services/aws-service';
import {Component, Input, OnInit, Optional, ViewChild} from '@angular/core';
import {MdDialogRef} from '@angular/material';
import {IOption} from 'ng-select';
import {Hotkey, HotkeysService} from 'angular2-hotkeys';
import {LocalDataSource} from 'ng2-smart-table';
import * as _ from 'lodash';
import {SettingsService} from '../../services/settings-service';
import {createPropertyDiffs, toCheckedAlready} from '../../utils/diffs';


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

const applyIgnores = (contents: Pair<string>, languages: Pair<string>,
                      ignoreDiffs: PropertyDiffs[], prefix: string): Pair<string> => {
    if (languages.one !== 'json' || languages.other !== 'json') {
        return {one: contents.one, other: contents.other};
    }

    const titleAndPaths = (f: Function): {title, path}[] => _.flatMap(
        ignoreDiffs,
        (d: PropertyDiffs) => f(d).map(p => ({
            title: d.title,
            path: p.replace('root', '').replace(/></g, '.').replace(/([<>'])/g, '')
        })));

    const jsonOne = JSON.parse(contents.one);
    const jsonOther = JSON.parse(contents.other);

    titleAndPaths(x => x.added).forEach(x => {
        _.set(jsonOne, x.path, `<-- [${prefix}] (added) ${x.title} -->`);
        _.set(jsonOther, x.path, `<-- [${prefix}] (added) ${x.title} -->`);
    });
    titleAndPaths(x => x.changed).forEach(x => {
        _.set(jsonOne, x.path, `<-- [${prefix}] (changed) ${x.title} -->`);
        _.set(jsonOther, x.path, `<-- [${prefix}] (changed) ${x.title} -->`);
    });
    titleAndPaths(x => x.removed).forEach(x => {
        _.set(jsonOne, x.path, `<-- [${prefix}] (removed) ${x.title} -->`);
        _.set(jsonOther, x.path, `<-- [${prefix}] (removed) ${x.title} -->`);
    });

    const sortStringify = (obj): string =>
        JSON.stringify(
            obj,
            (_, v) => (!(v instanceof Array || v === null) && typeof v === 'object') ?
                Object.keys(v).sort().reduce((r, k) => { r[k] = v[k]; return r; }, {}) : v,
            4
        );

    return {
        one: sortStringify(jsonOne),
        other: sortStringify(jsonOther)
    };
};


function createConfig(one: string, other: string, oneContentType: string, otherContentType: string, sideBySide: boolean): DiffViewConfig {
    return {
        leftContent: one,
        leftContentType: oneContentType,
        rightContent: other,
        rightContentType: otherContentType,
        readOnly: true,
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
    @Input() reportTitle: string;
    @Input() oneAccessPoint: AccessPoint;
    @Input() otherAccessPoint: AccessPoint;
    @Input() trials: Trial[];
    @Input() ignores: IgnoreCase[] = [];
    @Input() checkedAlready: IgnoreCase[] = [];
    @Input() activeTabIndex: string;
    @Input() unifiedDiff: boolean = this.settingsService.unifiedDiff;
    @Input() hideIgnoredDiff: boolean = this.settingsService.hideIgnoredDiff;
    @Input() hideCheckedAlreadyDiff: boolean = this.settingsService.hideCheckedAlreadyDiff;

    @ViewChild('selector') selector;
    @ViewChild('diffView') diffView;
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
    diffViewConfig: DiffViewConfig;
    editorConfig: EditorConfig;
    displayedQueries: { key: string, value: string }[];

    get activeIndexNum(): number {
        return Number(this.activeIndex);
    }

    constructor(private service: AwsService,
                @Optional() public dialogRef: MdDialogRef<DetailDialogComponent>,
                private _hotkeysService: HotkeysService,
                private settingsService: SettingsService) {
        // To prevent from unexpected close
        dialogRef._containerInstance.dialogConfig = {disableClose: true};

        // XXX: _hotkeysService.remove(Hotkey[]) is not worked (maybe issues)
        _hotkeysService.hotkeys.splice(0).forEach(x => _hotkeysService.remove(x));

        _hotkeysService.add([
            new Hotkey('d', () => {
                this.changeTab(0);
                return false;
            }, null, 'Move `Diff viewer` tab.'),
            new Hotkey('q', () => {
                this.changeTab(1);
                return false;
            }, null, 'Move `Query parameters` tab.'),
            new Hotkey('p', () => {
                this.changeTab(2);
                return false;
            }, null, 'Move `Property diffs` tab.'),
            new Hotkey('i', () => {
                this.diffView.moveToPreviousDiff(true);
                return false;
            }, null, 'Move to next diff.'),
            new Hotkey('j', () => {
                this.showPreviousTrial();
                return false;
            }, null, 'Show previous trial.'),
            new Hotkey('k', () => {
                this.diffView.moveToNextDiff(true);
                return false;
            }, null, 'Move to previous diff.'),
            new Hotkey('l', () => {
                this.showNextTrial();
                return false;
            }, null, 'Show next trial.'),
            new Hotkey('w', () => {
                this.closeDialog();
                return false;
            }, null, 'Close this dialog'),
            new Hotkey('/', () => {
                this.openSelector();
                return false;
            }, null, 'Open trial list'),
            new Hotkey('?', () => {
                this.toggleCheatSheet();
                return false;
            }, null, 'Open/Close cheat sheet')
        ]);
    }

    ngOnInit(): void {
        // FIXME
        this.editorConfig = {
            content: this.settingsService.checkList || `
vars:
  mimizou: https://avatars0.githubusercontent.com/u/9500018?v=3&s=460
cases:
  - title: something
    image: '{{ mimizou }}'
    conditions:
      - added:
          # regexp
          - root<'items'><[0-9]><'hogehoge-added'>
      - changed:
          # regexp
          - .+
      - removed:
          # regexp
          - root<'items'><[0-9]><'hogehoge-removed'>
          `,
            contentType: 'yaml',
            readOnly: true,
            theme: 'vs'
        };

        this.checkedAlready = toCheckedAlready(this.editorConfig.content);

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
        this.showTrial(this.trial);
    }

    get trial(): Trial {
        return this.trials[this.activeIndex];
    }

    toggleCheatSheet(): void {
        this._hotkeysService.cheatSheetToggle.next({});
    }

    closeDialog(): void {
        this.dialogRef.close();
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
                .then((rs: { encoding: string, body: string }[]) => {
                    this.isLoading = false;
                    this.errorMessage = undefined;

                    const bodyPair: Pair<string> = {one: rs[0].body, other: rs[1].body};
                    const languagePair: Pair<string> = {
                        one: toLanguage(trial.one.content_type),
                        other: toLanguage(trial.other.content_type)
                    };

                    const bodyPair2: Pair<string> = this.hideIgnoredDiff ? applyIgnores(
                        bodyPair, languagePair, this.propertyDiffsByCognition.ignored, 'IGNORED'
                    ) : {one: bodyPair.one, other: bodyPair.other};

                    const bodyPair3: Pair<string> = this.hideCheckedAlreadyDiff ? applyIgnores(
                        bodyPair2, languagePair, this.propertyDiffsByCognition.checkedAlready, 'CHECKD_ALREADY'
                    ) : {one: bodyPair2.one, other: bodyPair2.other};

                    this.diffViewConfig = createConfig(
                        bodyPair3.one,
                        bodyPair3.other,
                        languagePair.one,
                        languagePair.other,
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
            // We must initialize diffView after set config.
            // Changing `this.isLoading` and sleep a bit time causes onInit event so I wrote ...
            setTimeout(() => {
                this.isLoading = false;
                this.diffViewConfig = createConfig('No file', 'No file', 'text', 'text', !this.unifiedDiff);
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
        this.propertyDiffsByCognition = createPropertyDiffs(
            trial, this.ignores, this.checkedAlready
        );
    }

    changeTab(index: number): void {
        this.activeTabIndex = String(index);
        this.afterChangeTab(index);
    }

    changeDiffType(unifiedDiff: boolean) {
        this.unifiedDiff = unifiedDiff;
        this.settingsService.unifiedDiff = unifiedDiff;
        this.diffViewConfig.sideBySide = !unifiedDiff;

        // We must initialize diffView after set config.
        // Changing `this.isLoading` and sleep a bit time causes onInit event so I wrote ...
        this.isLoading = true;
        setTimeout(() => {
            this.isLoading = false;
        }, 1);
    }

    changeHideIgnoredDiff(hideIgnored: boolean) {
        this.hideIgnoredDiff = hideIgnored;
        this.settingsService.hideIgnoredDiff = hideIgnored;
        this.showTrial(this.trial);
    }

    changeHideCheckedAlreadyDiff(hideCheckedAlready: boolean) {
        this.hideCheckedAlreadyDiff = hideCheckedAlready;
        this.settingsService.hideCheckedAlreadyDiff = hideCheckedAlready;
        this.showTrial(this.trial);
    }

    afterChangeTab(index: number): void {
        if (index === 0 && this.diffView) {
            this.diffView.updateView();
        }

        if (index === 2 && this.editor) {
            this.editor.updateView();
        }
    }

    updateEditorConfig() {
        this.checkedAlready = toCheckedAlready(this.editor.getValue());
        this.settingsService.checkList = this.editor.getValue();
        this.propertyDiffsByCognition = createPropertyDiffs(
            this.trial, this.ignores, this.checkedAlready
        );
    }

    createActiveTrialLink() {
        return `${location.origin}${location.pathname}#/report/${this.reportKey}/${this.reportKey}/${this.trial.seq}`;
    }

}
