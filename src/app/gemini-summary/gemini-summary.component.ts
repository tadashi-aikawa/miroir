import {AwsConfig, DynamoResult, DynamoRow, Report, Trial} from '../models/models';
import {AwsService} from '../services/aws-service';
import {Component, Input, OnInit, Optional} from '@angular/core';
import {ObjectList} from 'aws-sdk/clients/s3';
import {LocalDataSource, ViewCell} from 'ng2-smart-table';
import {MdDialog, MdDialogRef} from '@angular/material';
import * as fileSaver from 'file-saver';
import {DetailDialogComponent} from '../detail-dialog/detail-dialog.component';

const filterFunction = (v, q) => q.split(' and ').every(x => v.includes(x));

interface RowData {
    trial: Trial;
    name: string;
    path: string;
    queries: Object;
    status: string;
    oneByte: number;
    otherByte: number;
    oneSec: number;
    otherSec: number;
    oneStatus: number;
    otherStatus: number;
    requestTime: string;
}

@Component({
    selector: 'app-gemini-summary',
    templateUrl: './gemini-summary.component.html',
    styleUrls: [
        './gemini-summary.css',
        '../../../node_modules/hover.css/css/hover.css'
    ],
    providers: [
        AwsService
    ]
})
export class GeminiSummaryComponent {
    @Input() awsConfig: AwsConfig;

    searchingSummary: boolean;
    searchErrorMessage: string;
    rows: DynamoRow[];
    settings: any;
    errorMessage: string;

    activeReport: Report;
    loadingReportKey: string;
    tableSource = new LocalDataSource();

    constructor(private service: AwsService, private _dialog: MdDialog) {
    }

    searchReport(keyWord: string) {
        this.searchErrorMessage = undefined;
        this.searchingSummary = true;

        this.service.searchReport(keyWord, this.awsConfig)
            .then((r: DynamoResult) => {
                this.searchingSummary = false;
                this.rows = r.Items.sort(
                    (a, b) => b.begin_time > a.begin_time ? 1 : -1
                );
            })
            .catch(err => {
                this.searchingSummary = false;
                this.searchErrorMessage = err;
            });
    }

    showReport(key: string) {
        this.loadingReportKey = key;
        this.service.fetchReport(`${key}/report.json`, this.awsConfig)
            .then((r: Report) => {
                this.loadingReportKey = undefined;

                this.activeReport = r;
                this.settings = {
                    columns: {
                        seq: {title: 'Seq'},
                        name: {title: 'Name', filterFunction},
                        path: {title: 'Path', filterFunction},
                        status: {title: 'Status', type: 'custom', renderComponent: StatusComponent, filterFunction},
                        queries: {title: 'Queries', type: 'custom', renderComponent: HoverComponent, filterFunction},
                        oneByte: {title: '<- Byte'},
                        otherByte: {title: 'Byte ->'},
                        oneSec: {title: '<- Sec'},
                        otherSec: {title: 'Sec ->'},
                        oneStatus: {title: '<- Status', type: 'custom', renderComponent: StatusCodeComponent},
                        otherStatus: {title: 'Status ->', type: 'custom', renderComponent: StatusCodeComponent},
                        requestTime: {title: 'Request time'}
                    },
                    actions: false
                };
                this.tableSource.load(r.trials.map(t => (<RowData>{
                    trial: Object.assign(new Trial(), t),
                    seq: t.seq,
                    name: t.name,
                    path: t.path,
                    status: t.status,
                    queries: Object.keys(t.queries).map(k => `${k}: ${t.queries[k]}`).join('&'),
                    oneByte: t.one.byte,
                    otherByte: t.other.byte,
                    oneSec: t.one.response_sec,
                    otherSec: t.other.response_sec,
                    oneStatus: t.one.status_code,
                    otherStatus: t.other.status_code,
                    requestTime: t.request_time
                })));
            })
            .catch(err => {
                this.loadingReportKey = undefined;
                this.errorMessage = err;
            });
    }

    downloadArchive(key: string, event) {
        const row: DynamoRow = this.rows.find((r: DynamoRow) => r.hashkey === key);
        const zipName = `${key.substring(0, 6)}.zip`;

        row.downloading = true;
        this.service.fetchArchive(`${key}/${zipName}`, this.awsConfig)
            .then(x => {
                row.downloading = false;
                fileSaver.saveAs(x, `${row.title}-${zipName}`);
            })
            .catch(err => {
                row.downloading = false;
                row.downloadErrorMessage = err;
            });

        event.stopPropagation();
    }

    removeDetail(key: string, event) {
        const dialogRef = this._dialog.open(DeleteConfirmDialogComponent);
        dialogRef.componentInstance.isLoading = true;

        const row: DynamoRow = this.rows.find((r: DynamoRow) => r.hashkey === key);

        this.service.fetchList(key, this.awsConfig)
            .then((oList: ObjectList) => {
                dialogRef.componentInstance.isLoading = false;
                dialogRef.componentInstance.keys = oList.map(x => x.Key);
                dialogRef.afterClosed().subscribe((keysToRemove: string[]) => {
                    if (keysToRemove) {
                        row.deleting = true;

                        this.service.removeDetails(keysToRemove, this.awsConfig)
                            .then(p => this.service.removeReport(key, this.awsConfig))
                            .then(p => {
                                this.rows = this.rows.filter((r: DynamoRow) => r.hashkey !== key);
                                if (key === this.activeReport.key) {
                                    // TODO: abnormal
                                    this.showReport(this.rows[0].hashkey);
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
                this.errorMessage = err;
            });
        event.stopPropagation();
    }

    onSelectRow(event: any) {
        event.source.getFilteredAndSorted().then(es => {
            this.showDetail(es.map(x => x.trial), es.findIndex(e => e === event.data));
        });
    }

    showDetail(trials: Trial[], index: number) {
        const dialogRef = this._dialog.open(DetailDialogComponent, {
            width: '80vw',
            height: '97%'
        });
        dialogRef.componentInstance.reportKey = this.activeReport.key;
        dialogRef.componentInstance.oneAccessPoint = this.activeReport.summary.one;
        dialogRef.componentInstance.otherAccessPoint = this.activeReport.summary.other;
        dialogRef.componentInstance.awsConfig = this.awsConfig;
        dialogRef.componentInstance.activeIndex = String(index);
        dialogRef.componentInstance.trials = trials;
    }

}


@Component({
    template: `    
    <h2 md-dialog-title>Remove following items... is it really O.K.?</h2>

    <md-dialog-content>
        <div *ngIf="isLoading" class="center">
            <md-spinner></md-spinner>
        </div>
        <div *ngIf="!isLoading">
            <ul>
                <li *ngFor="let key of keys">{{key}}</li>
            </ul>
        </div>
    </md-dialog-content>
    
    <md-dialog-actions>
        <div class="smart-padding-without-bottom">
            <button md-raised-button
                    color="primary"
                    (click)="onClickRemove()">
                Remove
            </button>
            <button md-raised-button
                    color="secondary"
                    md-dialog-close>
                Cancel
            </button>
        </div>
    </md-dialog-actions>
  `,
})
export class DeleteConfirmDialogComponent {
    @Input() keys: string[];
    @Input() isLoading: boolean;

    constructor(@Optional() public dialogRef: MdDialogRef<DeleteConfirmDialogComponent>) {
    }

    onClickRemove() {
        this.dialogRef.close(this.keys);
    }
}

@Component({
    template: `
    <span [class]="status">{{renderValue}}</span>
    `,
    styles: [
        '.server-error { color: red; font-weight: bold;}',
        '.client-error { color: blue; font-weight: bold;}',
        '.success { color: green; }'
    ],
})
export class StatusCodeComponent implements ViewCell, OnInit {
    renderValue: string;
    status: string;
    @Input() value: string|number;

    ngOnInit(): void {
        const v = String(this.value);
        this.renderValue = v;
        this.status = v[0] === '5' ? 'server-error' :
            v[0] === '4' ? 'client-error' : 'success';
    }
}

@Component({
    template: `
    <span [mdTooltip]="hoverValue">{{renderValue}}</span>
    `
})
export class HoverComponent implements ViewCell, OnInit {
    renderValue: string;
    hoverValue: string;
    @Input() value: string|number;

    ngOnInit(): void {
        this.renderValue = `${String(this.value).split('&').length} queries`;
        this.hoverValue = String(this.value).split('&').join('\n');
    }
}

@Component({
    template: `
    <md-chip-list>
        <md-chip [color]="kind" selected="true">{{renderValue}}</md-chip>
    </md-chip-list>
    `
})
export class StatusComponent implements ViewCell, OnInit {
    renderValue: string;
    kind: string;
    @Input() value: string|number;

    ngOnInit(): void {
        const v = String(this.value);
        this.renderValue = v;
        this.kind = v === 'same' ? 'primary' :
            v === 'different' ? 'accent' :
                v === 'failure' ? 'warn' : '';
    }
}
