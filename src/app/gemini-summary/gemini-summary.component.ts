import {DynamoResult, DynamoRow, Report, ResponseSummary, Trial} from './gemini-summary';
import {SummaryService} from './gemini-summary.service';
import {Component, Input} from '@angular/core';
import {LocalDataSource} from 'ng2-smart-table';

const filterFunction = (v, q) => q.split(" and ").every(x => v.includes(x));

const toDisplayFormat = (r: ResponseSummary) => [
    `<a href='${r.url}' target="_blank">request</a>`,
    `size: ${r.byte}`,
    `response_sec: ${r.response_sec}`,
    `status_code: ${r.status_code}`
].join("<br/>");

@Component({
    selector: 'gemini-summary',
    templateUrl: './gemini-summary.component.html',
    styleUrls: ['./gemini-summary.css'],
    providers: [
        SummaryService
    ]
})
export class GeminiSummaryComponent {
    @Input() region: string;
    @Input() accessKeyId: string;
    @Input() secretAccessKey: string;

    rows: DynamoRow[];
    settings: any;
    errorMessage: string;

    activeReport: Report;
    tableSource = new LocalDataSource();

    jsjs: string;

    constructor(private service: SummaryService) {
    }

    fetchReport(keyWord: string) {
        this.service.fetchReport(keyWord, this.region, this.accessKeyId, this.secretAccessKey)
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
                oneUrl: {title: r.summary.one.host, type: 'html', filterFunction},
                otherUrl: {title: r.summary.other.host, type: 'html', filterFunction}
            },
            actions: {
                add: false,
                edit: false,
                "delete": false
            }
        };
        this.tableSource.load(r.trials.map(t => ({
            path: t.path,
            queries: Object.keys(t.queries).map(k => `${k}: ${t.queries[k]}`).join("<br/>"),
            status: t.status,
            oneUrl: toDisplayFormat(t.one),
            otherUrl: toDisplayFormat(t.other)
        })));
    }

    showDetail(row: any) {
        this.jsjs = JSON.stringify(row.queries, null, "  ");
    }
}
