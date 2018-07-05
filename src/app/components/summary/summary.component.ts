import {ActivatedRoute, Params} from '@angular/router';
import {animate, style, transition, trigger} from '@angular/animations';
import {
    Change,
    DynamoResult,
    DynamoRow,
    EditorConfig,
    IgnoreCase,
    Report,
    Row,
    Summary,
    Trial
} from '../../models/models';
import {AwsService} from '../../services/aws-service';
import {Component, ElementRef, Input, OnInit, Optional, ViewChild} from '@angular/core';
import {
    MatAutocompleteSelectedEvent,
    MatDialog,
    MatDialogRef,
    MatSidenav,
    MatSnackBar,
    PageEvent
} from '@angular/material';
import * as fileSaver from 'file-saver';
import * as _ from 'lodash';
import { Debounce } from 'lodash-decorators';
import {Dictionary} from 'lodash';
import {DetailDialogComponent} from '../detail-dialog/detail-dialog.component';
import CheckStatus, {CheckStatuses} from '../../constants/check-status';
import {SettingsService} from '../../services/settings-service';
import {createPropertyDiffs, toCheckedAlready} from '../../utils/diffs';
import {Clipboard} from 'ts-clipboard';
import {BodyOutputType, ToasterService} from 'angular2-toaster';
import {RowData, TrialsTableComponent} from "../trials-table/trials-table.component";
import {AnalyticsComponent} from "../analystic/analytics.component";
import {Hotkey, HotkeysService} from 'angular2-hotkeys';
import {matchRegExp} from "../../utils/regexp";
import {FormControl} from "@angular/forms";
import {Observable} from "rxjs/Observable";

interface KeyBindings {
    reformat_table: string;
    visible_all: string;
    clear_all_filters: string;
    toggle_summary_cards: string
    open_cheat_sheet: string;
    close_cheat_sheet: string;
    change_status_to_closed: string;
}

const KEY_BINDINGS_BY: Dictionary<KeyBindings> = {
    default: {
        reformat_table: 'r',
        visible_all: 'v',
        clear_all_filters: 'c',
        toggle_summary_cards: 'w',
        open_cheat_sheet: '?',
        close_cheat_sheet: 'esc',
        change_status_to_closed: 'C',
    },
    vim: {
        reformat_table: 'r',
        visible_all: 'v',
        clear_all_filters: 'c',
        toggle_summary_cards: 'w',
        open_cheat_sheet: '?',
        close_cheat_sheet: 'esc',
        change_status_to_closed: 'C',
    }
};


const toAttention = (t: Trial): string => {
    if ((!t.diff_keys) && t.status === 'different') {
        return 'No diff keys!!';
    }
    if (t.propertyDiffsByCognition && !t.propertyDiffsByCognition.unknown.isEmpty()) {
        return 'Appears unknown!!';
    }
    if (t.one.status_code >= 400 && t.other.status_code >= 400) {
        return 'Both failure!!';
    }
    return '';
};


const formulaMappings: Dictionary<(target: number, value: number) => boolean> = {
    '>': (target: number, value: number): boolean => target > value,
    '<': (target: number, value: number): boolean => target < value,
    '=': (target: number, value: number): boolean => target === value,
};

const statusFilter = (x: string, row: DynamoRow): boolean => matchRegExp(row.check_status, x, false, true);
const dateFilter = (x: string, row: DynamoRow): boolean => matchRegExp(row.begin_time, x);
const titleFilter = (x: string, row: DynamoRow): boolean => matchRegExp(row.title, x, false, false);
const sameFilter = (x: string, row: DynamoRow) : boolean => formulaMappings[x[0]](row.same_count, Number(x.slice(1)));
const differentFilter = (x: string, row: DynamoRow) : boolean => formulaMappings[x[0]](row.different_count, Number(x.slice(1)));
const failureFilter = (x: string, row: DynamoRow) : boolean => formulaMappings[x[0]](row.failure_count, Number(x.slice(1)));

class CardFilter {
    name: string;
    description: string;
    filter: (x: string, row: DynamoRow) => boolean;
}

const CARD_FILTER_MAPPINGS: Dictionary<CardFilter> = {
    'status': {name: 'status:', filter: statusFilter, description: 'status:todo'},
    'st': {name: 'st:', filter: statusFilter, description: 'st:!closed'},
    'date': {name: 'date:', filter: dateFilter, description: 'date:2018-06'},
    'dt': {name: 'dt:', filter: dateFilter, description: 'dt:10:[0-2].'},
    'title': {name: 'title:', filter: titleFilter, description: 'title:Test'},
    't': {name: 't:', filter: titleFilter, description: 't:hoge'},
    'same': {name: 'same:', filter: sameFilter, description: 'same:>1000'},
    'diff': {name: 'diff:', filter: differentFilter, description: 'diff:!=0'},
    'fail': {name: 'fail:', filter: failureFilter, description: 'fail:<5'},
};

const cardFilter = (word: string, row: DynamoRow): boolean => {
    let target: string = word.split(':')[0];
    let token: string = word.split(':').slice(1).join(':');
    if (!token) {
        token = target;
        target = 'title';
    }

    const not: boolean = token[0] === '!';
    const s: string = token.replace('!', '');

    const filter = CARD_FILTER_MAPPINGS[target] ? CARD_FILTER_MAPPINGS[target].filter : titleFilter;
    return not !== filter(s, row);
};

@Component({
    selector: 'app-summary',
    templateUrl: './summary.component.html',
    styleUrls: [
        './summary.css',
        '../../../../node_modules/hover.css/css/hover.css'
    ],
    animations: [
        trigger(
            'feed',
            [
                transition(':enter', [
                    style({opacity: 0}),
                    animate('250ms', style({opacity: 1}))
                ]),
                transition(':leave', [
                    style({opacity: 1}),
                    animate('250ms', style({opacity: 0}))
                ])
            ]
        ),
        trigger(
            'card-feed',
            [
                transition(':enter', [
                    style({opacity: 0}),
                    animate('500ms', style({opacity: 1}))
                ]),
                transition(':leave', [
                    style({opacity: 1}),
                    animate('250ms', style({opacity: 0})),
                    animate('100ms', style({opacity: 0})),
                    animate('250ms', style({height: 0})),
                ])
            ]
        )
    ],
})
export class SummaryComponent implements OnInit {

    @Input() cheatSheet: boolean = false;

    @ViewChild('sidenav') sideNav: MatSidenav;
    @ViewChild('keyWord') keyWord: ElementRef;
    @ViewChild('trialsTable') trialsTable: TrialsTableComponent;
    @ViewChild('analytics') analytics: AnalyticsComponent;

    word = '';
    filterWord = '';

    searchingSummary: boolean;
    searchErrorMessage: string;
    rows: DynamoRow[];
    filteredRows: DynamoRow[] = [];
    displayedRows: DynamoRow[];
    settings: any;
    errorMessages: string[];

    displayedCardNumber = 10;
    previousFilteredRowsCount = 0;


    mqlCompletions: Observable<CardFilter[]>;
    mqlControl = new FormControl();

    activeReport: Report;
    tableRowData: RowData[];
    displayedTrials: Trial[];
    filteredMessage: string;
    checkedAlready: IgnoreCase[];
    ignores: IgnoreCase[];
    loadingReportKey: string;

    statuses: CheckStatus[] = CheckStatuses.values;
    toDisplay: (key: CheckStatus) => string = CheckStatuses.toDisplay;

    constructor(private service: AwsService,
                private _dialog: MatDialog,
                private route: ActivatedRoute,
                private settingsService: SettingsService,
                private _hotkeysService: HotkeysService,
                private snackBar: MatSnackBar,
                private toasterService: ToasterService) {
    }

    initKeyBindings() {
        const keyMode: KeyBindings = KEY_BINDINGS_BY[this.settingsService.keyMode];
        // XXX: _hotkeysService.remove(Hotkey[]) is not worked (maybe issues)
        this._hotkeysService.hotkeys.splice(0).forEach(x => this._hotkeysService.remove(x));

        this._hotkeysService.add([
            new Hotkey(keyMode.reformat_table, () => {
                this.trialsTable.fitColumnWidths();
                return false;
            }, null, 'Reformat table'),
            new Hotkey(keyMode.visible_all, () => {
                this.trialsTable.setAllColumnsVisible();
                return false;
            }, null, 'Set all column visible'),
            new Hotkey(keyMode.clear_all_filters, () => {
                this.trialsTable.clearAllFilters();
                return false;
            }, null, 'Clear all filters'),
            new Hotkey(keyMode.toggle_summary_cards, () => {
                this.sideNav.opened ? this.sideNav.close() : this.sideNav.open();
                return false;
            }, null, 'Toggle summary cards'),
            new Hotkey(keyMode.open_cheat_sheet, () => {
                this.cheatSheet = true;
                return false;
            }, null, 'Open cheat sheet'),
            new Hotkey(keyMode.close_cheat_sheet, () => {
                this.cheatSheet = false;
                return false;
            }, null, 'Close cheat sheet'),
            new Hotkey(keyMode.change_status_to_closed, () => {
                // TODO: refactoring to be nice
                this.rows.find(x => x.hashkey === this.activeReport.key).check_status = 'closed';
                this.onSelectCheckStatus(this.activeReport.key, 'closed');
                return false;
            }, null, 'Change status to closed'),
        ]);
    }

    ngOnInit(): void {
        this.initKeyBindings();
        setTimeout(() => {
            this.sideNav.open().then(() => {
                setTimeout(() => this.keyWord.nativeElement.click(), 100);
            });
        }, 0);

        this.route.queryParams.subscribe(qs => {
            this.service.update(qs.region, qs.table, qs.bucket, qs.prefix);

            this.route.params.subscribe(ps => {
                if (ps.searchWord) {
                    this.word = ps.searchWord;
                    this.searchReport(ps.searchWord)
                        .then(_ => {
                            if (ps.hashKey) {
                                this.showReport(ps.hashKey, this.settingsService.alwaysIntelligentAnalytics)
                                    .then((r: Report) => {
                                        if (ps.seq) {
                                            this.showDetail(ps.seq - 1, r.trials);
                                        }
                                    });
                            }
                        });
                }
            });
        });

        this.mqlCompletions = this.mqlControl
            .valueChanges
            .map(query => _(CARD_FILTER_MAPPINGS)
                .keys()
                .filter(k => query.split(' ').some(q => _.includes(`${k}:`, q)))
                .map(k => CARD_FILTER_MAPPINGS[k])
                .value()
            );
    }

    onSearchReports(keyword: string) {
        this.searchReport(keyword);
    }

    searchReport(keyword: string): Promise<DynamoRow[]> {
        return new Promise((resolve, reject) => {
            this.searchErrorMessage = undefined;
            this.searchingSummary = true;

            this.service.findSummary(keyword)
                .then((r: DynamoResult) => {
                    this.searchingSummary = false;
                    // TODO
                    // FIXME: remove `.replace(/\//g, '-')` after a while (May?)
                    this.rows = r.Items.sort(
                        (a, b) => b.begin_time.replace(/\//g, '-') > a.begin_time.replace(/\//g, '-') ? 1 : -1
                    );
                    this.updateDisplayedAndFilteredRows(10);
                    resolve(this.rows);
                })
                .catch(err => {
                    this.searchingSummary = false;
                    this.searchErrorMessage = err;
                    reject(err);
                });
        });
    }

    onClickNextButton() {
        this.updateDisplayedAndFilteredRows(
            _.min([this.displayedRows.length + 10, this.filteredRows.length])
        );
    }

    @Debounce(300)
    onReportFilterUpdated() {
        this.updateDisplayedAndFilteredRows(10);
    }

    updateDisplayedAndFilteredRows(displayedNumber: number) {
        this.previousFilteredRowsCount = this.filteredRows.length;
        this.filteredRows = this.rows.filter(
            x => this.filterWord.split(' ').every(t => !t || cardFilter(t, x))
        );
        this.displayedRows =  _.take(
            this.filteredRows,
            _.min([displayedNumber, this.filteredRows.length])
        );
    }

    onClickCard(row: DynamoRow, event) {
        this.showReport(row.hashkey, this.settingsService.alwaysIntelligentAnalytics);
        event.stopPropagation();
    }

    onClickRetryHash(retryHash: string, event) {
        this.showReport(retryHash, this.settingsService.alwaysIntelligentAnalytics);
        event.stopPropagation();
    }

    onSelectCheckStatus(key: string, value: CheckStatus) {
        const row: DynamoRow = this.rows.find((r: DynamoRow) => r.hashkey === key);

        row.updatingErrorMessage = undefined;
        this.service.updateStatus(key, value)
            .then(_ => {
                this.toasterService.pop('success', `Succeeded to update status to '${value}'`);
            })
            .catch(err => {
                row.updatingErrorMessage = err;
            });
    }

    onUpdateTitle(title: Change<string>) {
        this.service.fetchReport(this.activeReport.key)
            .then((r: Report) => {
                if (r.title !== title.previous) {
                    return Promise.reject('Conflict?? Please reload and update again.');
                }

                this.activeReport.title = title.current;
                // TODO: rollback since abnormal
                return Promise.all([
                    this.service.updateSummaryTitle(this.activeReport.key, title.current),
                    this.service.updateReportTitle(this.activeReport.key, title.current)
                ]);
            })
            .then(none => {
                this.rows.find((r: DynamoRow) => r.hashkey === this.activeReport.key).title = title.current;
                this.toasterService.pop('success', `Succeeded to update title`);
            })
            .catch(err => {
                this.toasterService.pop('error', 'Failed to update title');
            });
    }

    onUpdateDescription(description: Change<string>) {
        this.service.fetchReport(this.activeReport.key)
            .then((r: Report) => {
                if (r.description !== description.previous) {
                    return Promise.reject(`
                    <h4>Maybe conflict ??</h4>
                    <h4>You need to operate as following to resolve conflict.</h4>
                    <ol>
                        <li>Copy your description not to be discarded</li>
                        <li>Reload this report to update description</li>
                        <li>Merge 2 and your description(1)</li>
                    </ol>
                    `);
                }

                this.activeReport.description = description.current;
                // TODO: rollback since abnormal
                return Promise.all([
                    this.service.updateSummaryDescription(this.activeReport.key, description.current),
                    this.service.updateReportDescription(this.activeReport.key, description.current)
                ]).catch(err => Promise.reject('Unexpected error occured'));
            })
            .then(none => {
                this.rows.find((r: DynamoRow) => r.hashkey === this.activeReport.key).description = description.current;
                this.toasterService.pop('success', `Succeeded to update description`);
            })
            .catch(err => {
                this.toasterService.pop({
                    type: 'error',
                    title: 'Failed to update description',
                    body: err,
                    bodyOutputType: BodyOutputType.TrustedHtml,
                    timeout: 0,
                });
            });
    }

    showReport(key: string, analysis = false): Promise<Report> {
        return new Promise<Report>((resolve, reject) => {
            this.loadingReportKey = key;
            this.errorMessages = undefined;
            this.service.fetchReport(key)
                .then((r: Report) => {
                    this.loadingReportKey = undefined;

                    this.checkedAlready = toCheckedAlready(this.settingsService.checkList);
                    this.ignores = r.ignores;

                    r.trials = _(r.trials)
                        .map(t => Object.assign(new Trial(), t, {
                            propertyDiffsByCognition: analysis ? createPropertyDiffs(t, this.ignores, this.checkedAlready) : undefined
                        }))
                        .map(t => Object.assign(new Trial(), t, {
                            attention: toAttention(t)
                        }))
                        .value();
                    this.activeReport = r;

                    this.tableRowData = r.trials.map(t => {
                        const c = t.propertyDiffsByCognition;

                        return <RowData>{
                            trial: t,
                            seq: t.seq,
                            name: t.name,
                            path: t.path,
                            status: t.status,
                            queriesNum: Object.keys(t.queries).length,
                            queries: t.queryString,
                            encodedQueries: t.originQueryString,
                            oneByte: t.one.byte,
                            otherByte: t.other.byte,
                            oneSec: t.one.response_sec,
                            otherSec: t.other.response_sec,
                            oneStatus: t.one.status_code,
                            otherStatus: t.other.status_code,
                            oneType: t.one.type,
                            otherType: t.other.type,
                            oneContentType: t.one.content_type,
                            otherContentType: t.other.content_type,
                            requestTime: t.request_time,
                            attention: analysis ? toAttention(t) : '???',
                            checkedAlready: analysis ?
                                (c ? _(c.checkedAlready).reject(x => x.isEmpty()).map(x => x.title).value() : []) :
                                ['???'],
                            ignored: analysis ?
                                (c ? _(c.ignored).reject(x => x.isEmpty()).map(x => x.title).value() : []) :
                                ['???'],
                        };
                    });

                    resolve(r);
                });
        });
    }

    downloadReport(key: string, filtered: boolean, event) {
        const row: DynamoRow = this.rows.find((r: DynamoRow) => r.hashkey === key);

        row.downloading = true;
        this.errorMessages = undefined;
        this.service.fetchReport(key)
            .then((x: Report) => {
                row.downloading = false;
                const reportName = `${row.title}-${key.substring(0, 7)}.json`;

                const obj: object = !filtered ? x :
                    Object.assign({}, x, {
                        trials: this.displayedTrials
                    });
                fileSaver.saveAs(new Blob([JSON.stringify(obj)]), reportName);
            })
            .catch(err => {
                row.downloading = false;
                row.downloadErrorMessage = err;
            });

        event.stopPropagation();
    }

    downloadArchive(key: string, event) {
        const row: DynamoRow = this.rows.find((r: DynamoRow) => r.hashkey === key);

        row.downloading = true;
        this.errorMessages = undefined;
        this.service.fetchArchive(key)
            .then(({name, body}) => {
                row.downloading = false;
                fileSaver.saveAs(body, `${row.title}-${name}`);
            })
            .catch(err => {
                row.downloading = false;
                row.downloadErrorMessage = err;
            });

        event.stopPropagation();
    }

    removeDetail(key: string, event) {
        const dialogRef = this._dialog.open(DeleteConfirmDialogComponent);
        this.errorMessages = undefined;
        dialogRef.componentInstance.isLoading = true;

        const row: DynamoRow = this.rows.find((r: DynamoRow) => r.hashkey === key);

        this.service.fetchList(key)
            .then((keys: string[]) => {
                dialogRef.componentInstance.isLoading = false;
                dialogRef.componentInstance.keys = keys;
                dialogRef.afterClosed().subscribe((s3KeysToRemove: string[]) => {
                    if (s3KeysToRemove) {
                        row.deleting = true;

                        this.service.removeTrials(s3KeysToRemove)
                            .then(p => this.service.removeSummary(key))
                            .then(() => {
                                // HACK: OOOOOOOOHHHHNOOOOOOOO
                                this.rows = this.rows.filter((r: DynamoRow) => r.hashkey !== key);
                                this.updateDisplayedAndFilteredRows(
                                    _.min([this.displayedRows.length, this.filteredRows.length - 1])
                                );

                                if (key === this.activeReport.key) {
                                    // TODO: abnormal
                                    if (this.rows.length > 0) {
                                        this.showReport(this.displayedRows[0].hashkey, this.settingsService.alwaysIntelligentAnalytics);
                                    }
                                }
                            })
                            .catch(err => {
                                row.deleting = false;
                                row.deleteErrorMessage = err;
                            });
                    }
                });
            })
            .catch(err => {
                dialogRef.componentInstance.isLoading = false;
                this.errorMessages = [err];
            });
        event.stopPropagation();
    }

    handleRowClicked(row: Row<RowData>) {
        this.showDetail(row.rowIndex, this.displayedTrials);
    }

    handleDisplayedTrialsUpdated(trials: Trial[]) {
        this.displayedTrials = trials;
    }

    handleFilteredRowsNumUpdated(filteredAndAll: string) {
        this.filteredMessage = filteredAndAll;
    }


    showDetail(index: number, trials?: Trial[]) {
        const dialogRef = this._dialog.open(DetailDialogComponent, {
            width: '95vw',
            maxWidth: '95vw',
            height: '97%',
            disableClose: true
        });
        dialogRef.componentInstance.reportKey = this.activeReport.key;
        dialogRef.componentInstance.reportTitle = this.activeReport.title;
        dialogRef.componentInstance.oneAccessPoint = this.activeReport.summary.one;
        dialogRef.componentInstance.otherAccessPoint = this.activeReport.summary.other;
        dialogRef.componentInstance.activeIndex = String(index);
        dialogRef.componentInstance.trials = trials || this.displayedTrials;
        dialogRef.componentInstance.ignores = this.ignores;
        dialogRef.afterClosed().subscribe(_ => this.initKeyBindings());
    }

    afterChangeTab(index: number): void {
        switch (index) {
            case 0:
                this.trialsTable.fitColumnWidths();
                break;
            case 2:
                this.analytics.fitColumnWidths();
                break;
        }
    }

    showRequestsAsJson() {
        const dialogRef = this._dialog.open(EditorDialogComponent, {
            width: '80vw',
            height: '97%'
        });
        dialogRef.componentInstance.mode = 'json';
        dialogRef.componentInstance.title = 'Requests which can used on jumeaux';
        dialogRef.componentInstance.value = JSON.stringify(
            this.displayedTrials.map((x: Trial) => ({
                name: x.name,
                path: x.path,
                qs: x.queries,
                headers: x.headers
            })),
            null,
            4
        );
    }

    showSummaryAsJson() {
        const dialogRef = this._dialog.open(EditorDialogComponent, {
            width: '80vw',
            height: '97%'
        });
        dialogRef.componentInstance.mode = 'json';
        dialogRef.componentInstance.title = 'Summary';
        dialogRef.componentInstance.value = JSON.stringify(
            {
                version: this.activeReport.version,
                key: this.activeReport.key,
                title: this.activeReport.title,
                description: this.activeReport.description,
                summary: this.activeReport.summary,
                ignores: this.activeReport.ignores,
                addons: this.activeReport.addons,
                retry_hash: this.activeReport.retry_hash,
            },
            null,
            4
        );
    }

    copyActiveReportLink() {
        const url = `${location.origin}${location.pathname}#/report/${this.activeReport.key}/${this.activeReport.key}?region=${this.service.region}&table=${this.service.table}&bucket=${this.service.bucket}&prefix=${this.service.prefix}`;
        Clipboard.copy(url);
        this.toasterService.pop('success', `Copied this report url`, url);
    }

}


@Component({
    template: `
        <h2 mat-dialog-title>Remove following items... is it really O.K.?</h2>

        <mat-dialog-content>
            <div *ngIf="isLoading" class="center">
                <mat-spinner></mat-spinner>
            </div>
            <div *ngIf="!isLoading">
                <ul>
                    <li *ngFor="let key of keys">{{key}}</li>
                </ul>
            </div>
        </mat-dialog-content>

        <mat-dialog-actions>
            <div class="smart-padding-without-bottom">
                <button mat-raised-button
                        color="primary"
                        (click)="onClickRemove()">
                    Remove
                </button>
                <button mat-raised-button
                        color="secondary"
                        mat-dialog-close>
                    Cancel
                </button>
            </div>
        </mat-dialog-actions>
    `,
})
export class DeleteConfirmDialogComponent {
    @Input() keys: string[];
    @Input() isLoading: boolean;

    constructor(@Optional() public dialogRef: MatDialogRef<DeleteConfirmDialogComponent>) {
    }

    onClickRemove() {
        this.dialogRef.close(this.keys);
    }
}

@Component({
    template: `
        <h2 mat-dialog-title>{{title}}</h2>
        <app-editor #editor
                    [config]="editorConfig"
                    height="95vh"
        >
        </app-editor>
    `,
})
export class EditorDialogComponent implements OnInit {
    @Input() mode: string;
    @Input() title: string;
    @Input() value: string;
    editorConfig: EditorConfig;

    ngOnInit(): void {
        this.editorConfig = {
            content: this.value,
            contentType: this.mode,
            readOnly: true,
            theme: 'vs-dark',
            minimap: {
                enabled: true
            },
        };
    }
}
