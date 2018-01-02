import {Component} from '@angular/core';
import {AwsService} from '../../services/aws-service';
import {ToasterConfig} from "angular2-toaster";
import {SettingsService} from "../../services/settings-service";

const {version} = require('../../../../package.json');

@Component({
    selector: 'app-root',
    templateUrl: './root.component.html',
    styleUrls: ['./root.component.css']
})
export class RootComponent {
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
    localStackEndpoint: string = this.awsService.localStackEndpoint;
    alwaysIntelligentAnalytics: boolean = this.settingsService.alwaysIntelligentAnalytics;

    public toasterConfig : ToasterConfig = new ToasterConfig({
        animation: 'flyRight',
        newestOnTop: false,
        mouseoverTimerStop: true,
    });

    constructor(private awsService: AwsService, private settingsService: SettingsService) {
        // DO NOTHING
    }

    pingTable() {
        this.connectingTable = true;
        this.awsService.pingTable(this.table)
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
        this.awsService.pingBucket(this.bucket)
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
        this.awsService.pingBucketWithPrefix(this.bucket, this.prefix)
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

    update() {
        this.awsService.updateRegion(this.region);
        this.awsService.updateTable(this.table);
        this.awsService.updateBucket(this.bucket);
        this.awsService.updatePrefix(this.prefix);

        this.settingsService.alwaysIntelligentAnalytics = this.alwaysIntelligentAnalytics;
    }
}
