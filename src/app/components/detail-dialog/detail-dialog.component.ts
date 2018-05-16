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
import {MatDialogRef} from '@angular/material';
import {IOption} from 'ng-select';
import {Hotkey, HotkeysService} from 'angular2-hotkeys';
import {LocalDataSource} from 'ng2-smart-table';
import * as _ from 'lodash';
import {Dictionary} from 'lodash';
import {Clipboard} from 'ts-clipboard';
import {SettingsService} from '../../services/settings-service';
import {createPropertyDiffs, toCheckedAlready} from '../../utils/diffs';
import {ToasterConfig, ToasterService} from 'angular2-toaster';
import {matchRegExp} from "../../utils/regexp";


interface KeyBindings {
    toggle_fullscreen: string;
    move_to_next_diff: string;
    move_to_previous_diff: string;
    show_next_trail: string;
    show_previous_trail: string;
    move_diff_viewer_tab: string;
    move_query_parameters_tab: string;
    move_property_diffs_tab: string;
    copy_trial_url: string;
    copy_path: string;
    copy_one_url: string;
    copy_other_url: string;
    open_trial_list: string;
    close_this_dialog: string;
    open_cheat_sheet: string;
    close_cheat_sheet: string;
}

const KEY_BINDINGS_BY: Dictionary<KeyBindings> = {
    default: {
        toggle_fullscreen: 'f',
        move_to_next_diff: 'k',
        move_to_previous_diff: 'i',
        show_next_trail: 'l',
        show_previous_trail: 'j',
        move_diff_viewer_tab: 'd',
        move_query_parameters_tab: 'q',
        move_property_diffs_tab: 'p',
        copy_trial_url: 'C',
        copy_path: 'P',
        copy_one_url: 'J',
        copy_other_url: 'L',
        open_trial_list: '/',
        close_this_dialog: 'w',
        open_cheat_sheet: '?',
        close_cheat_sheet: 'esc',
    },
    vim: {
        toggle_fullscreen: 'f',
        move_to_next_diff: 'j',
        move_to_previous_diff: 'k',
        show_next_trail: 'l',
        show_previous_trail: 'h',
        move_diff_viewer_tab: 'd',
        move_query_parameters_tab: 'q',
        move_property_diffs_tab: 'p',
        copy_trial_url: 'Y',
        copy_path: 'P',
        copy_one_url: 'H',
        copy_other_url: 'L',
        open_trial_list: 'i',
        close_this_dialog: 'x',
        open_cheat_sheet: '?',
        close_cheat_sheet: 'esc',
    }
};

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

    const titleAndPaths = (f: Function): { title, path }[] => _.flatMap(
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
            (none, v) => (!(v instanceof Array || v === null) && typeof v === 'object') ?
                Object.keys(v).sort().reduce((r, k) => {
                    r[k] = v[k];
                    return r;
                }, {}) : v,
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
    @Input() fullscreen = false;
    @Input() unifiedDiff: boolean = this.settingsService.unifiedDiff;
    @Input() hideIgnoredDiff: boolean = this.settingsService.hideIgnoredDiff;
    @Input() hideCheckedAlreadyDiff: boolean = this.settingsService.hideCheckedAlreadyDiff;
    @Input() filteredWordNot: boolean = true;
    @Input() cheatSheet: boolean = false;

    @ViewChild('selector') selector;
    @ViewChild('diffView') diffView;
    @ViewChild('editor') editor;

    queryTableSettings: any;
    queryTableSource = new LocalDataSource();
    propertyDiffsByCognition: PropertyDiffsByCognition;
    oneExpectedEncoding: string;
    otherExpectedEncoding: string;

    activeIndex: string;
    originalEditorBody: Pair<string>;
    options: IOption[];
    isLoading: boolean;
    errorMessage: string;
    diffViewConfig: DiffViewConfig;
    editorConfig: EditorConfig;
    displayedQueries: { key: string, value: string }[];
    filteredWord: string;

    get activeIndexNum(): number {
        return Number(this.activeIndex);
    }

    get trial(): Trial {
        return this.trials[this.activeIndex];
    }

    constructor(private service: AwsService,
                @Optional() public dialogRef: MatDialogRef<DetailDialogComponent>,
                private _hotkeysService: HotkeysService,
                private settingsService: SettingsService,
                private toasterService: ToasterService) {
    }

    ngOnInit(): void {
        const keyMode: KeyBindings = KEY_BINDINGS_BY[this.settingsService.keyMode];
        // XXX: _hotkeysService.remove(Hotkey[]) is not worked (maybe issues)
        this._hotkeysService.hotkeys.splice(0).forEach(x => this._hotkeysService.remove(x));

        this._hotkeysService.add([
            new Hotkey(keyMode.toggle_fullscreen, () => {
                this.changeFullscreen(!this.fullscreen);
                return false;
            }, null, 'Toggle fullscreen'),
            new Hotkey(keyMode.move_to_next_diff, () => {
                this.diffView.moveToNextDiff(true);
                return false;
            }, null, 'Move to next diff.'),
            new Hotkey(keyMode.move_to_previous_diff, () => {
                this.diffView.moveToPreviousDiff(true);
                return false;
            }, null, 'Move to previous diff.'),
            new Hotkey(keyMode.show_next_trail, () => {
                this.showNextTrial();
                return false;
            }, null, 'Show next trial.'),
            new Hotkey(keyMode.show_previous_trail, () => {
                this.showPreviousTrial();
                return false;
            }, null, 'Show previous trial.'),
            new Hotkey(keyMode.move_diff_viewer_tab, () => {
                this.changeTab(0);
                return false;
            }, null, 'Move `Diff viewer` tab.'),
            new Hotkey(keyMode.move_query_parameters_tab, () => {
                this.changeTab(1);
                return false;
            }, null, 'Move `Query parameters` tab.'),
            new Hotkey(keyMode.move_property_diffs_tab, () => {
                this.changeTab(2);
                return false;
            }, null, 'Move `Property diffs` tab.'),
            new Hotkey(keyMode.copy_trial_url, () => {
                this.copyActiveTrialLink();
                return false;
            }, null, 'Copy trial url.'),
            new Hotkey(keyMode.copy_path, () => {
                Clipboard.copy(this.trial.path);
                this.toasterService.pop('success', `Copied this trial path`, this.trial.path);
                return false;
            }, null, 'Copy path.'),
            new Hotkey(keyMode.copy_one_url, () => {
                Clipboard.copy(this.trial.one.url);
                this.toasterService.pop('success', `Copied ${this.oneAccessPoint.name} url`, this.trial.one.url);
                return false;
            }, null, 'Copy one url.'),
            new Hotkey(keyMode.copy_other_url, () => {
                Clipboard.copy(this.trial.other.url);
                this.toasterService.pop('success', `Copied ${this.otherAccessPoint.name} url`, this.trial.other.url);
                return false;
            }, null, 'Copy other url.'),
            new Hotkey(keyMode.open_trial_list, () => {
                this.openSelector();
                return false;
            }, null, 'Open trial list'),
            new Hotkey(keyMode.close_this_dialog, () => {
                this.closeDialog();
                return false;
            }, null, 'Close this dialog'),
            new Hotkey(keyMode.open_cheat_sheet, () => {
                this.cheatSheet = true;
                return false;
            }, null, 'Open cheat sheet'),
            new Hotkey(keyMode.close_cheat_sheet, () => {
                this.cheatSheet = false;
                return false;
            }, null, 'Close cheat sheet'),
        ]);

        // FIXME
        this.editorConfig = {
            content: this.settingsService.checkList,
            contentType: 'yaml',
            readOnly: false,
            theme: 'vs',
            minimap: {
                enabled: false
            }
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
            if (trial.one.content_type.match(/octet-stream/) || trial.other.content_type.match(/octet-stream/)) {
                this.errorMessage = undefined;
                // We must initialize diffView after set config.
                // Changing `this.isLoading` and sleep a bit time causes onInit event so I wrote ...
                setTimeout(() => {
                    this.isLoading = false;
                    this.originalEditorBody = {
                        one: 'Binary is not supported to show',
                        other: 'Binary is not supported to show',
                    };
                    this.diffViewConfig = createConfig(
                        this.originalEditorBody.one,
                        this.originalEditorBody.other,
                        'text',
                        'text',
                        !this.unifiedDiff
                    );
                    this.oneExpectedEncoding = 'None';
                    this.otherExpectedEncoding = 'None';
                }, 100);
            } else {
                const fetchFile = (file: string) => this.service.fetchTrial(this.reportKey, file);
                Promise.all([fetchFile(trial.one.file), fetchFile(trial.other.file)])
                    .then((rs: { encoding: string, body: string }[]) => {
                        this.isLoading = false;
                        this.errorMessage = undefined;

                        const languagePair: Pair<string> = {
                            one: toLanguage(trial.one.content_type),
                            other: toLanguage(trial.other.content_type)
                        };
                        const bodyPair = this.maskIgnores({one: rs[0].body, other: rs[1].body}, languagePair);
                        this.originalEditorBody = {
                            one: bodyPair.one,
                            other: bodyPair.other,
                        };

                        this.diffViewConfig = createConfig(
                            bodyPair.one,
                            bodyPair.other,
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
            }
        } else {
            this.errorMessage = undefined;
            // We must initialize diffView after set config.
            // Changing `this.isLoading` and sleep a bit time causes onInit event so I wrote ...
            setTimeout(() => {
                this.isLoading = false;
                this.diffViewConfig = createConfig('No file', 'No file', 'text', 'text', !this.unifiedDiff);
                this.oneExpectedEncoding = 'None';
                this.otherExpectedEncoding = 'None';
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

    private maskIgnores(bodyPair: Pair<string>, languagePair: Pair<string>): Pair<string> {
        const bodyApplyIgnoredPair: Pair<string> = this.hideIgnoredDiff && this.propertyDiffsByCognition ?
            applyIgnores(bodyPair, languagePair, this.propertyDiffsByCognition.ignored, 'IGNORED') :
            {one: bodyPair.one, other: bodyPair.other};

        return this.hideCheckedAlreadyDiff && this.propertyDiffsByCognition ?
            applyIgnores(bodyApplyIgnoredPair, languagePair, this.propertyDiffsByCognition.checkedAlready, 'CHECKD_ALREADY') :
            {one: bodyApplyIgnoredPair.one, other: bodyApplyIgnoredPair.other};
    }

    changeTab(index: number): void {
        this.activeTabIndex = String(index);
    }

    changeFullscreen(fullscreen: boolean) {
        this.fullscreen = fullscreen;
    }

    // TODO: UUUUUUUUUUUUUUUUUUUUUUUUUUUUSEEEEEEEEEEEEEEEEEEEEEEE
    updateEditorBodies() {
        const filtered = (body: string): string =>
            body.split('\n')
                .filter(x => this.filteredWordNot !== matchRegExp(x, this.filteredWord))
                .join('\n');

        this.diffViewConfig = Object.assign({}, this.diffViewConfig, {
            leftContent: this.filteredWord ? filtered(this.originalEditorBody.one) : this.originalEditorBody.one,
            rightContent: this.filteredWord ? filtered(this.originalEditorBody.other) : this.originalEditorBody.other,
        });
    }

    changeFilteredWord() {
        this.updateEditorBodies();
    }

    changeFilteredWordNot(filteredWordNot: boolean) {
        this.filteredWordNot = filteredWordNot;
        this.updateEditorBodies();
    }

    changeDiffType(unifiedDiff: boolean) {
        this.unifiedDiff = unifiedDiff;
        this.settingsService.unifiedDiff = unifiedDiff;
        this.diffViewConfig = Object.assign({}, this.diffViewConfig, {sideBySide: !unifiedDiff});
    }

    changeHideIgnoredDiff(hideIgnored: boolean) {
        this.hideIgnoredDiff = hideIgnored;
        this.settingsService.hideIgnoredDiff = hideIgnored;
        // TODO: Repalce to maskIgnores()
        this.showTrial(this.trial);
    }

    changeHideCheckedAlreadyDiff(hideCheckedAlready: boolean) {
        this.hideCheckedAlreadyDiff = hideCheckedAlready;
        this.settingsService.hideCheckedAlreadyDiff = hideCheckedAlready;
        // TODO: Repalce to maskIgnores()
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

    copyActiveTrialLink() {
        const url = `${location.origin}${location.pathname}#/report/${this.reportKey}/${this.reportKey}/${this.trial.seq}?region=${this.service.region}&table=${this.service.table}&bucket=${this.service.bucket}&prefix=${this.service.prefix}`;
        Clipboard.copy(url);
        this.toasterService.pop('success', `Copied this trial url`, url);
    }
}
