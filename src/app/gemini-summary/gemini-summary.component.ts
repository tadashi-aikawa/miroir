import {DynamoResult, DynamoRow, Report, ResponseSummary, Trial} from './gemini-summary';
import {SummaryService} from './gemini-summary.service';
import {Component, Input, Optional, AfterViewInit, OnInit} from '@angular/core';
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
    styleUrls: ['./gemini-summary.css'],
    providers: [
        SummaryService
    ]
})
export class GeminiSummaryComponent {
    @Input() awsConfig: AwsConfig;

    rows: DynamoRow[];
    settings: any;
    errorMessage: string;

    activeReport: Report;
    tableSource = new LocalDataSource();

    constructor(private service: SummaryService, private _dialog: MdDialog, public snackBar: MdSnackBar) {
    }

    searchReport(keyWord: string) {
        this.service.searchReport(keyWord, this.awsConfig)
            .then((r: DynamoResult) => this.rows = r.Items)
            .catch(err => this.errorMessage = err);
    }

    showReport(key: string) {
        this.service.fetchReport(`${key}/report.json`, this.awsConfig)
            .then((r: Report) => {
                this.activeReport = r;
                this.settings = {
                    columns: {
                        name: {title: 'Name', filterFunction},
                        path: {title: 'Path', filterFunction},
                        status: {title: 'Status', filterFunction},
                        queries: {title: 'Queries', type: 'custom', renderComponent: HoverComponent, filterFunction},
                        oneByte: {title: '<- Byte'},
                        otherByte: {title: 'Byte ->'},
                        oneSec: {title: '<- Sec'},
                        otherSec: {title: 'Sec ->'},
                        oneStatus: {title: '<- Status'},
                        otherStatus: {title: 'Status ->'},
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
            .catch(err => this.errorMessage = err);
    }

    showDetail(data: RowData) {
        const fetchFile = (file: string) =>
            this.service.fetchDetail(`${this.activeReport.key}/${file}`, this.awsConfig);

        const snack: MdSnackBarRef<SimpleSnackBar> = this.snackBar.open('Now Loading');

        // viewportMaring <==> search
        Promise.all([fetchFile(data.trial.one.file), fetchFile(data.trial.other.file)])
            .then((rs: string[]) => {
                snack.dismiss();
                const dialogRef = this._dialog.open(DialogContent, {
                    width: '80vw',
                    height: '95%'
                });
                dialogRef.componentInstance.title = data.path;
                dialogRef.componentInstance.mergeViewConfig = {
                    value: rs[0],
                    orig: rs[1],
                    lineNumbers: true,
                    lineWrapping: true,
                    viewportMargin: 10,
                    collapseIdentical: 30,
                    readOnly: true
                };
            })
            .catch(err => {
                this.errorMessage = err;
                this.snackBar.open('Not found files', undefined, {duration: 2000});
            });
    }

}

@Component({
    template: `
    <p>{{title}}</p>
    <merge-viewer [config]="mergeViewConfig"></merge-viewer>
  `,
})
export class DialogContent {
    @Input() title: string;
    @Input() mergeViewConfig: CodeMirror.MergeView.MergeViewEditorConfiguration;

    constructor(@Optional() public dialogRef: MdDialogRef<DialogContent>) {
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
