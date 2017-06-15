import {Injectable} from '@angular/core';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import {DynamoDB} from 'aws-sdk';
import {LocalStorageService} from 'angular-2-local-storage';
import DocumentClient = DynamoDB.DocumentClient;


@Injectable()
export class SettingsService {

    constructor(private localStorageService: LocalStorageService) {
    }

    get region(): string {
        return this.localStorageService.get<string>('region');
    }

    set region(value: string) {
        this.localStorageService.set('region', value);
    }

    get table(): string {
        return this.localStorageService.get<string>('table');
    }

    set table(value: string) {
        this.localStorageService.set('table', value);
    }

    get bucket(): string {
        return this.localStorageService.get<string>('bucket');
    }

    set bucket(value: string) {
        this.localStorageService.set('bucket', value);
    }

    get tmpAccessKeyId(): string {
        return this.localStorageService.get<string>('tmpAccessKeyId');
    }

    set tmpAccessKeyId(value: string) {
        this.localStorageService.set('tmpAccessKeyId', value);
    }

    removeTmpAccessKeyId() {
        this.localStorageService.remove('tmpAccessKeyId')
    }

    get tmpSecretAccessKey(): string {
        return this.localStorageService.get<string>('tmpSecretAccessKey');
    }

    set tmpSecretAccessKey(value: string) {
        this.localStorageService.set('tmpSecretAccessKey', value);
    }

    removeTmpSecretAccessKeyId() {
        this.localStorageService.remove('tmpSecretAccessKeyId')
    }

    get tmpSessionToken(): string {
        return this.localStorageService.get<string>('tmpSessionToken');
    }

    set tmpSessionToken(value: string) {
        this.localStorageService.set('tmpSessionToken', value);
    }

    removeTmpSessionToken() {
        this.localStorageService.remove('tmpSessionToken')
    }

    get tmpExpireTime(): Date {
        return new Date(this.localStorageService.get<Date>('tmpExpireTime'));
    }

    set tmpExpireTime(value: Date) {
        this.localStorageService.set('tmpExpireTime', value);
    }

    removeTmpExpireTime() {
        this.localStorageService.remove('tmpExpireTime')
    }

    get unifiedDiff(): boolean {
        return this.localStorageService.get<boolean>('unifiedDiff');
    }

    set unifiedDiff(value: boolean) {
        this.localStorageService.set('unifiedDiff', value);
    }

    get selectedColumnNames(): string[] {
        return this.localStorageService.get<string[]>('selectedColumnNames');
    }

    set selectedColumnNames(value: string[]) {
        this.localStorageService.set('selectedColumnNames', value);
    }

}
