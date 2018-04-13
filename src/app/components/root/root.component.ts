import {Component, OnInit, OnDestroy} from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import {AwsService} from '../../services/aws-service';
import {ToasterConfig} from 'angular2-toaster';
import {KeyMode, SettingsService} from '../../services/settings-service';

const {version} = require('../../../../package.json');

@Component({
    selector: 'app-root',
    templateUrl: './root.component.html',
    styleUrls: ['./root.component.css']
})
export class RootComponent implements OnInit, OnDestroy {
    REGIONS = [
        'ap-northeast-1',
        'ap-northeast-2',
        'ap-southeast-1',
        'ap-southeast-2',
        'ap-south-1',
        'us-east-1',
        'us-east-2',
        'us-west-1',
        'us-west-2',
        'eu-central-1',
        'eu-west-1',
        'eu-west-2',
        'sa-east-1',
        'ca-central-1',
    ];

    KEY_MODES: KeyMode[] = [
        'default',
        'vim'
    ];

    version: string = version;
    region: string;

    table: string;
    connectingTable: boolean;
    tableError: string;

    bucket: string;
    connectingBucket: boolean;
    bucketError: string;

    prefix: string;
    connectingPrefix: boolean;
    prefixError: string;

    useLocalStack: boolean;
    alwaysIntelligentAnalytics: boolean = this.settingsService.alwaysIntelligentAnalytics;
    keyMode: KeyMode = this.settingsService.keyMode;

    public toasterConfig: ToasterConfig = new ToasterConfig({
        animation: 'flyRight',
        newestOnTop: false,
        mouseoverTimerStop: true,
    });

    private awsConfigurationSubscription: Subscription;

    constructor(private awsService: AwsService, private settingsService: SettingsService) {
        // DO NOTHING
    }

    ngOnInit(): void {
        this.loadFromStorage();
        this.pingAll();
        this.awsConfigurationSubscription = this.awsService.sharedAwsConfiguration$.subscribe(conf => {
            this.loadFromStorage();
            this.pingAll();
        });
    }

    ngOnDestroy() {
        this.awsConfigurationSubscription.unsubscribe();
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
        this.awsService.update(this.region, this.table, this.bucket, this.prefix);

        this.settingsService.alwaysIntelligentAnalytics = this.alwaysIntelligentAnalytics;
        this.settingsService.keyMode = this.keyMode;
    }

    private loadFromStorage() {
        this.region = this.awsService.region;
        this.table = this.awsService.table;
        this.bucket = this.awsService.bucket;
        this.prefix = this.awsService.prefix;
        this.useLocalStack = this.awsService.useLocalStack;
    }

}
