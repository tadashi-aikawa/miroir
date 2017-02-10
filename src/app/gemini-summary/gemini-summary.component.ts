import {Summary, ReportRow} from './gemini-summary';
import {SummaryService} from './gemini-summary.service';
import {Component} from '@angular/core';
import {LocalDataSource} from 'ng2-smart-table';
import {AngularTools} from '@angular/platform-browser/src/browser/tools/common_tools';

@Component({
    selector: 'gemini-summary',
    templateUrl: './gemini-summary.component.html',
    providers: [
        SummaryService
    ]
})
export class GeminiSummaryComponent {
    keyWord: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;

    errorMessage: string;
    names: string[];
    report: string;
    tableSource: LocalDataSource;

    settings = {
        columns: {
            hashKey: {title: 'Hash'},
            title: {title: 'Title'},
            sameCount: {title: 'Same'},
            differentCount: {title: 'Different'},
            oneHost: {title: 'One host'},
            otherHost: {title: 'Other host'},
            start: {title: 'Start time'},
            end: {title: 'End time'},
        },
        actions: {
            add: false,
            edit: false,
            "delete": false
        }
    };

    constructor(private service: SummaryService) {
        this.tableSource = new LocalDataSource();
    }

    fetchReport(keyWord: string, region: string, accessKeyId: string, secretAccessKey: string) {
        this.keyWord = keyWord;
        this.region = region;
        this.accessKeyId = accessKeyId;
        this.secretAccessKey = secretAccessKey;
        this.service.fetchReport(keyWord, region, accessKeyId, secretAccessKey)
            .then(r => {
                this.report =  JSON.stringify(r, null, "  ");
                const reportRows: ReportRow[] = r.Items.map(x => ({
                    hashKey: x.hashkey,
                    title: x.title,
                    sameCount: x.same_count,
                    differentCount: x.different_count,
                    oneHost: x.one_host,
                    otherHost: x.other_host,
                    start: x.start,
                    end: x.end
                }));
                this.tableSource.load(reportRows);
            })
            .catch(err => this.errorMessage = err);
    }

}
