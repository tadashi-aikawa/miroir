import {Component} from '@angular/core';
import {AwsService} from '../../services/aws-service';

@Component({
    selector: 'app-root',
    templateUrl: './root.component.html',
    styleUrls: ['./root.component.css']
})
export class RootComponent {
    region: string = this.awsService.region;
    table: string = this.awsService.table;
    bucket: string = this.awsService.bucket;

    constructor(private awsService: AwsService) {
        // DO NOTHING
    }

    update() {
        this.awsService.updateRegion(this.region);
        this.awsService.updateTable(this.table);
        this.awsService.updateBucket(this.bucket);
    }
}
