import {AfterViewInit, Component} from '@angular/core';
import {AwsService} from '../../services/aws-service';
import {ToasterConfig} from "angular2-toaster";
import {SettingsService} from "../../services/settings-service";

const {version} = require('../../../../package.json');

@Component({
    selector: 'app-root',
    templateUrl: './root.component.html',
    styleUrls: ['./root.component.css']
})
export class RootComponent implements AfterViewInit {
    REGIONS = [
        "ap-northeast-1",
        "ap-northeast-2",
        "ap-southeast-1",
        "ap-southeast-2",
        "ap-south-1",
        "us-east-1",
        "us-east-2",
        "us-west-1",
        "us-west-2",
        "eu-central-1",
        "eu-west-1",
        "eu-west-2",
        "sa-east-1",
        "ca-central-1",
    ];

    version: string = version;
    region: string = this.awsService.region;

    table: string = this.awsService.table;
    connectingTable: boolean;
    tableError: string;

    bucket: string = this.awsService.bucket;
    connectingBucket: boolean;
    bucketError: string;

    prefix: string = this.awsService.prefix;
    connectingPrefix: boolean;
    prefixError: string;

    useLocalStack: boolean = this.awsService.useLocalStack;
    alwaysIntelligentAnalytics: boolean = this.settingsService.alwaysIntelligentAnalytics;

    public toasterConfig : ToasterConfig = new ToasterConfig({
        animation: 'flyRight',
        newestOnTop: false,
        mouseoverTimerStop: true,
    });

    constructor(private awsService: AwsService, private settingsService: SettingsService) {
        // DO NOTHING
    }

    ngAfterViewInit(): void {
        this.pingAll();
    }

    pingTable() {
        this.connectingTable = true;
        this.awsService.pingTable()
            .then(_ => {
                this.tableError = undefined;
                this.connectingTable = false;
            })
            .catch((err: string) => {
                this.tableError = err;
                this.connectingTable = false;
            });
    }

    pingBucket() {
        this.connectingBucket = true;
        this.awsService.pingBucket()
            .then(_ => {
                this.bucketError = undefined;
                this.connectingBucket = false;
            })
            .catch((err: string) => {
                this.bucketError = err;
                this.connectingBucket = false;
            });
    }

    pingPrefix() {
        this.connectingPrefix = true;
        this.awsService.pingBucketWithPrefix()
            .then(_ => {
                this.prefixError = undefined;
                this.connectingPrefix = false;
            })
            .catch((err: string) => {
                this.prefixError = err;
                this.connectingPrefix = false;
            });
    }

    pingAll() {
        this.pingTable();
        this.pingBucket();
        this.pingPrefix();
    }

    hasErrorSettings() {
        return this.tableError || this.bucketError || this.prefixError;
    }

    update() {
        this.awsService.updateRegion(this.region);
        this.awsService.updateTable(this.table);
        this.awsService.updateBucket(this.bucket);
        this.awsService.updatePrefix(this.prefix);

        this.settingsService.alwaysIntelligentAnalytics = this.alwaysIntelligentAnalytics;
    }

}
