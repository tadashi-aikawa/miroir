import {DynamoResult, DynamoRow, Report, ResponseSummary, Trial} from './gemini-summary';
import {SummaryService} from './gemini-summary.service';
import {Component, Input, Optional, AfterViewInit, OnInit} from '@angular/core';
import {ObjectList} from 'aws-sdk/clients/s3'
import {LocalDataSource, ViewCell} from 'ng2-smart-table';
import * as CodeMirror from 'codemirror';
import {MdDialogRef, MdDialog, MdSnackBar, MdSnackBarRef, SimpleSnackBar} from '@angular/material';
import {AwsConfig} from '../models';

const filterFunction = (v, q) => q.split(" and ").every(x => v.includes(x));

interface RowData {
    trial: Trial;
    name: string;
    path: string;
    queries: Object;
    status: string;
    oneByte: number,
    otherByte: number,
    oneSec: number,
    otherSec: number,
    oneStatus: number,
    otherStatus: number,
    requestTime: string
}

@Component({
    selector: 'gemini-summary',
    templateUrl: './gemini-summary.component.html',
    styleUrls: [
        './gemini-summary.css',
        '../../../node_modules/hover.css/css/hover.css'
    ],
    providers: [
        SummaryService
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

    constructor(private service: SummaryService, private _dialog: MdDialog, public snackBar: MdSnackBar) {
    }

    searchReport(keyWord: string) {
        this.searchErrorMessage = undefined;
        this.searchingSummary = true;

        this.service.searchReport(keyWord, this.awsConfig)
            .then((r: DynamoResult) => {
                this.searchingSummary = false;
                this.rows = r.Items;
            })
            .catch(err => {
                this.searchingSummary = false;
                this.searchErrorMessage = err
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
                    actions: {
                        add: false,
                        edit: false,
                        "delete": false
                    }
                };
                this.tableSource.load(r.trials.map(t => (<RowData>{
                    trial: t,
                    name: t.name,
                    path: t.path,
                    status: t.status,
                    queries: Object.keys(t.queries).map(k => `${k}: ${t.queries[k]}`).join("&"),
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

    removeDetail(key: string, event) {
        const dialogRef = this._dialog.open(DeleteConfirmDialogContent);
        dialogRef.componentInstance.isLoading = true;

        const row: DynamoRow = this.rows.find((r: DynamoRow) => r.hashkey == key);

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
                                this.rows = this.rows.filter((r: DynamoRow) => r.hashkey != key);
                                if (key == this.activeReport.key) {
                                    // TODO: abnormal
                                    this.showReport(this.rows[0].hashkey);
                                }
                            })
                            .catch(err => {
                                row.deleting = false;
                                row.deleteErrorMessage = err
                            });
                    }
                })
            })
            .catch(err => {
                dialogRef.componentInstance.isLoading = false;
                this.errorMessage = err;
            });
        event.stopPropagation();
    }

    onSelectRow(data: RowData) {
        data.status == "different" ?
            this.showDetail(data) :
            this.snackBar.open("There are no stored responsies.", "Close", {duration: 3000});
    }

    showDetail(data: RowData) {
        const fetchFile = (file: string) =>
            this.service.fetchDetail(`${this.activeReport.key}/${file}`, this.awsConfig);

        const dialogRef = this._dialog.open(DetailDialogContent, {
            width: '80vw',
            height: '95%'
        });
        dialogRef.componentInstance.isLoading = true;
        dialogRef.componentInstance.title = `${data.name} (${data.path})`;
        dialogRef.componentInstance.trial = data.trial;

        // viewportMaring <==> search
        Promise.all([fetchFile(data.trial.one.file), fetchFile(data.trial.other.file)])
            .then((rs: string[]) => {
                dialogRef.componentInstance.isLoading = false;
                dialogRef.componentInstance.errorMessage = undefined;
                dialogRef.componentInstance.mergeViewConfig = {
                    value: rs[1],
                    orig: undefined,
                    origLeft: rs[0],
                    lineNumbers: true,
                    lineWrapping: true,
                    viewportMargin: 10,
                    collapseIdentical: 30,
                    readOnly: true
                };
            })
            .catch(err => {
                dialogRef.componentInstance.isLoading = false;
                dialogRef.componentInstance.errorMessage = err;
            });
    }

}

@Component({
    template: `
    <h2>{{title}}</h2>
    <div class="smart-padding-without-top">
        <small>
            <md-chip>Left</md-chip>
            <div class="ellipsis-text" style="width: 30vw">{{trial.one.url}}</div>
        </small>
        <small>
            <md-chip>Right</md-chip>
            <div class="ellipsis-text" style="width: 30vw">{{trial.other.url}}</div>
        </small>
    </div>
    <div *ngIf="isLoading" class="center" style="height: 50vh;">
        <md-spinner style="width: 50vh; height: 50vh;"></md-spinner>
    </div>
    <div *ngIf="!isLoading">
        <merge-viewer [config]="mergeViewConfig"></merge-viewer>
    </div>
    <div *ngIf="errorMessage">
        {{errorMessage}}
    </div>
  `,
})
export class DetailDialogContent {
    @Input() title: string;
    @Input() trial: Trial;
    @Input() isLoading: boolean;
    @Input() mergeViewConfig: CodeMirror.MergeView.MergeViewEditorConfiguration;
    @Input() errorMessage: string;

    constructor(@Optional() public dialogRef: MdDialogRef<DetailDialogContent>) {
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
export class DeleteConfirmDialogContent {
    @Input() keys: string[];
    @Input() isLoading: boolean;

    constructor(@Optional() public dialogRef: MdDialogRef<DeleteConfirmDialogContent>) {
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
        this.status = v[0] == '5' ? "server-error" :
            v[0] == '4' ? "client-error" : "success"
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
        this.renderValue = `${String(this.value).split("&").length} queries`;
        this.hoverValue = String(this.value).split("&").join("\n");
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
        this.kind = v == "same" ? "primary" :
            v == "different" ? "accent" :
                v == "failure" ? "warn" : "";
    }
}
