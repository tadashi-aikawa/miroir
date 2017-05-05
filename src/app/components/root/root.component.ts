import {Component} from '@angular/core';
import {LocalStorageService} from 'angular-2-local-storage';

@Component({
    selector: 'app-root',
    templateUrl: './root.component.html',
    styleUrls: ['./root.component.css']
})
export class RootComponent {
    region = 'ap-northeast-1';
    accessKeyId;
    secretAccessKey;
    table: string = this.localStorageService.get<string>('table');
    bucket: string = this.localStorageService.get<string>('bucket');

    constructor(private localStorageService: LocalStorageService) {
        // DO NOTHING
    }

    updateLocalStorage() {
        this.localStorageService.set('table', this.table);
        this.localStorageService.set('bucket', this.bucket);
    }
}
