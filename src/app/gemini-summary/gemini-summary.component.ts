import {DynamoResult, DynamoRow, Report, ResponseSummary, Trial} from './gemini-summary';
import {SummaryService} from './gemini-summary.service';
import {Component, Input, Optional, AfterViewInit} from '@angular/core';
import {LocalDataSource} from 'ng2-smart-table';
import * as CodeMirror from 'codemirror';
import {MdDialogRef, MdDialog} from '@angular/material';
import {AwsConfig} from '../models';

const filterFunction = (v, q) => q.split(" and ").every(x => v.includes(x));

interface RowData {
    trial: Trial;
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

    constructor(private service: SummaryService, private _dialog: MdDialog) {
    }

    fetchReport(keyWord: string) {
        this.service.fetchReport(keyWord, this.awsConfig)
            .then((r: DynamoResult) => this.rows = r.Items)
            .catch(err => this.errorMessage = err);
    }

    showReport(r: Report) {
        this.activeReport = r;
        this.settings = {
            columns: {
                path: {title: 'Path', filterFunction},
                status: {title: 'Status', filterFunction},
                queries: {title: 'Queries', type: 'html', filterFunction},
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
            path: t.path,
            status: t.status,
            queries: Object.keys(t.queries).map(k => `${k}: ${t.queries[k]}`).join("<br/>"),
            oneByte: t.one.byte,
            otherByte: t.other.byte,
            oneSec: t.one.response_sec,
            otherSec: t.other.response_sec,
            oneStatus: t.one.status_code,
            otherStatus: t.other.status_code,
            requestTime: t.request_time
        })));
    }

    showDetail(data: RowData) {
        const fetchFile = (file: string) =>
            this.service.fetchDetail(`${this.activeReport.key}/${file}`, this.awsConfig);

        const dialogRef = this._dialog.open(DialogContent, {
            width: '80vw',
            height: '95%'
        });
        dialogRef.componentInstance.title = data.path;

        // viewportMaring <==> search
        Promise.all([fetchFile(data.trial.one.file), fetchFile(data.trial.other.file)])
            .then((rs: string[]) => {
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
            .catch(err => this.errorMessage = err);
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
