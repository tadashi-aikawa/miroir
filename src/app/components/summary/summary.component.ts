import {ActivatedRoute} from '@angular/router';
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
import {LocalDataSource, ViewCell} from 'ng2-smart-table';
import {MatDialog, MatDialogRef, MatSidenav, MatSnackBar} from '@angular/material';
import * as fileSaver from 'file-saver';
import * as _ from 'lodash';
import {DetailDialogComponent} from '../detail-dialog/detail-dialog.component';
import CheckStatus, {CheckStatuses} from '../../constants/check-status';
import {SettingsService} from '../../services/settings-service';
import {createPropertyDiffs, toCheckedAlready} from '../../utils/diffs';
import {Clipboard} from 'ts-clipboard';
import {BodyOutputType, ToasterService} from 'angular2-toaster';
import {Memoize} from "lodash-decorators";
import {regexpComparator} from "../../utils/filters";

function queriesSummaryRenderer(params) {
    return params.value.queries;
}

interface RowData {
    trial: Trial;
    seq: Number;
    name: string;
    path: string;
    queriesNum: number;
    queries: string;
    encodedQueries: string;
    status: string;
    oneByte: number;
    otherByte: number;
    oneSec: number;
    otherSec: number;
    oneStatus: number;
    otherStatus: number;
    requestTime: string;
    attention: string;
    checkedAlready: string[];
    ignored: string[];
}

@Component({
    selector: 'app-summary',
    templateUrl: './summary.component.html',
    styleUrls: [
        './summary.css',
        '../../../../node_modules/hover.css/css/hover.css'
    ],
})
export class SummaryComponent implements OnInit {

    @ViewChild('sidenav') sideNav: MatSidenav;
    @ViewChild('keyWord') keyWord: ElementRef;

    private gridApi;
    private gridColumnApi;

    word = '';

    searchingSummary: boolean;
    searchErrorMessage: string;
    rows: DynamoRow[];
    settings: any;
    errorMessages: string[];

    activeReport: Report;
    // filteredTrials: Trial[];
    checkedAlready: IgnoreCase[];
    ignores: IgnoreCase[];
    loadingReportKey: string;

    statuses: CheckStatus[] = CheckStatuses.values;
    toDisplay: (key: CheckStatus) => string = CheckStatuses.toDisplay;

    tableRows: RowData[];
    rowClassRules = {
        'report-table-record-different': 'data.status === "different"',
    };
    defaultColDef = {
        filterParams: {
            textCustomComparator: regexpComparator,
            debounceMs: 200
        },
        floatingFilterComponentParams: {
            debounceMs: 200
        }
    };
    columnDefs = [
        {
            headerName: "seq",
            field: "seq",
            pinned: 'left',
        },
        {
            headerName: "name",
            field: "name",
            pinned: 'left',
        },
        {
            headerName: "Result",
            pinned: 'left',
            children: [
                {
                    headerName: "status",
                    field: "status",
                },
                {
                    headerName: "Intelligent Analytics",
                    children: [
                        {headerName: "attention", field: "attention"},
                        {headerName: "checkedAlready", field: "checkedAlready", columnGroupShow: "open"},
                        {headerName: "ignored", field: "ignored", columnGroupShow: "open"},
                    ]
                },
            ]
        },
        {
            headerName: "Request",
            children: [
                {
                    headerName: "path",
                    field: "path",
                },
                {
                    headerName: "queries",
                    columnGroupShow: "open",
                    children: [
                        {
                            headerName: "number",
                            field: "queriesNum",
                            columnGroupShow: "closed",
                        },
                        {
                            headerName: "detail",
                            field: "queries",
                            columnGroupShow: "open",
                        },
                        {
                            headerName: "encoded",
                            field: "encodedQueries",
                            columnGroupShow: "open",
                            filterParams: {
                                textCustomComparator: null
                            }
                        },
                    ]
                },
            ]
        },
        {
            headerName: "Response",
            openByDefault: true,
            children: [
                {
                    headerName: "Status",
                    columnGroupShow: "everything else",
                    children: [
                        {headerName: "one", field: "oneStatus"},
                        {headerName: "other", field: "otherStatus"},
                    ]
                },
                {
                    headerName: "Sec",
                    columnGroupShow: "open",
                    children: [
                        {headerName: "one", field: "oneSec", filter: 'agNumberColumnFilter'},
                        {headerName: "other", field: "otherSec", filter: 'agNumberColumnFilter'},
                    ]
                },
                {
                    headerName: "Byte",
                    columnGroupShow: "open",
                    children: [
                        {headerName: "one", field: "oneByte", filter: 'agNumberColumnFilter'},
                        {headerName: "other", field: "otherByte", filter: 'agNumberColumnFilter'},
                    ]
                },
            ]
        },
        {
            headerName: "requestTime",
            field: "requestTime",
            pinned: 'right',
        },
    ];


    constructor(private service: AwsService,
                private _dialog: MatDialog,
                private route: ActivatedRoute,
                private settingsService: SettingsService,
                private snackBar: MatSnackBar,
                private toasterService: ToasterService) {
    }

    ngOnInit(): void {
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
                    this.searchReport(ps.searchWord);
                }
                if (ps.hashKey) {
                    this.showReport(ps.hashKey, this.settingsService.alwaysIntelligentAnalytics)
                        .then((r: Report) => {
                            if (ps.seq) {
                                this.showDetail(ps.seq - 1);
                            }
                        });
                }
            });
        });
    }

    get filteredTrials(): Trial[] {
        return this.gridApi ? this.gridApi.getModel().rowsToDisplay.map(x => x.data.trial) : this.activeReport.trials;
    }

    onGridReady(params) {
        console.log("ready")
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;
        this.fitColumnWidths();
    }

    fitColumnWidths() {
        // Not initialized case
        if (!this.gridColumnApi) {
            return
        }

        this.gridColumnApi.autoSizeColumns(
            this.gridColumnApi.getAllColumns().map(x => x.colId)
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
                    resolve(this.rows);
                })
                .catch(err => {
                    this.searchingSummary = false;
                    this.searchErrorMessage = err;
                    reject(err);
                });
        });
    }

    onClickCard(row: DynamoRow, event) {
        this.showReport(row.hashkey, this.settingsService.alwaysIntelligentAnalytics);
        event.stopPropagation();
    }

    onClickRetryHash(retryHash: string, event) {
        this.showReport(retryHash, this.settingsService.alwaysIntelligentAnalytics);
        event.stopPropagation();
    }

    onSelectCheckStatus(key: string, event) {
        const row: DynamoRow = this.rows.find((r: DynamoRow) => r.hashkey === key);

        row.updatingErrorMessage = undefined;
        this.service.updateStatus(key, event.value)
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

                    const toAttention = (t: Trial): string => {
                        if (!analysis) {
                            return '???';
                        }
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

                    r.trials = _(r.trials)
                        .map(t => Object.assign(new Trial(), t, {
                            propertyDiffsByCognition: analysis ? createPropertyDiffs(t, this.ignores, this.checkedAlready) : undefined
                        }))
                        .map(t => Object.assign(new Trial(), t, {
                            attention: toAttention(t)
                        }))
                        .value();
                    this.activeReport = r;

                    this.tableRows = r.trials.map(t => {
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
                            requestTime: t.request_time,
                            attention: t.attention,
                            checkedAlready: analysis ?
                                (c ? _(c.checkedAlready).reject(x => x.isEmpty()).map(x => x.title).value() : []) :
                                ['???'],
                            ignored: analysis ?
                                (c ? _(c.ignored).reject(x => x.isEmpty()).map(x => x.title).value() : []) :
                                ['???'],
                        };
                    });
                });
            this.fitColumnWidths();
        });
    }

    downloadReport(key: string, filtered: boolean, event) {
        // const row: DynamoRow = this.rows.find((r: DynamoRow) => r.hashkey === key);
        //
        // row.downloading = true;
        // this.errorMessages = undefined;
        // this.service.fetchReport(key)
        //     .then((x: Report) => {
        //         row.downloading = false;
        //         const reportName = `${row.title}-${key.substring(0, 7)}.json`;
        //
        //         return this.tableSource.getFilteredAndSorted().then((es: RowData[]) => {
        //             const filteredSeqs: number[] = es.map(e => e.trial.seq);
        //             const obj: object = !filtered ? x :
        //                 Object.assign({}, x, {
        //                     trials: x.trials.filter(t => _.includes(filteredSeqs, t.seq))
        //                 });
        //
        //             fileSaver.saveAs(new Blob([JSON.stringify(obj)]), reportName);
        //         });
        //     })
        //     .catch(err => {
        //         row.downloading = false;
        //         row.downloadErrorMessage = err;
        //     });
        //
        // event.stopPropagation();
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
                                this.rows = this.rows.filter((r: DynamoRow) => r.hashkey !== key);
                                if (key === this.activeReport.key) {
                                    // TODO: abnormal
                                    this.showReport(this.rows[0].hashkey, this.settingsService.alwaysIntelligentAnalytics);
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
        this.showDetail(row.rowIndex, this.filteredTrials);
    }

    showDetail(index: number, trials?: Trial[]) {
        console.log("showDetail")
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
        dialogRef.componentInstance.trials = trials || this.filteredTrials;
        dialogRef.componentInstance.ignores = this.ignores;
    }

    showRequestsAsJson() {
        // this.tableSource.getFilteredAndSorted().then((rs: RowData[]) => {
        //     const dialogRef = this._dialog.open(EditorDialogComponent, {
        //         width: '80vw',
        //         height: '97%'
        //     });
        //     dialogRef.componentInstance.mode = 'json';
        //     dialogRef.componentInstance.title = 'Requests which can used on jumeaux';
        //     dialogRef.componentInstance.value = JSON.stringify(
        //         rs.map((x: RowData) => ({
        //             name: x.trial.name,
        //             path: x.trial.path,
        //             qs: x.trial.queries,
        //             headers: x.trial.headers
        //         })),
        //         null,
        //         4
        //     );
        // });
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
