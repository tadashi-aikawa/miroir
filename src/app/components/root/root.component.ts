import {Component} from '@angular/core';
import {AwsService} from '../../services/aws-service';
import {ToasterConfig, ToasterService} from "angular2-toaster";
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
    bucket: string = this.awsService.bucket;
    prefix: string = this.awsService.prefix;
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

    update() {
        this.awsService.updateRegion(this.region);
        this.awsService.updateTable(this.table);
        this.awsService.updateBucket(this.bucket);
        this.awsService.updatePrefix(this.prefix);

        this.settingsService.alwaysIntelligentAnalytics = this.alwaysIntelligentAnalytics;
    }
}
