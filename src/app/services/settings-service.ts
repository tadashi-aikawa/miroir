import {Injectable} from '@angular/core';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import {DynamoDB} from 'aws-sdk';
import {LocalStorageService} from 'angular-2-local-storage';
import DocumentClient = DynamoDB.DocumentClient;

export type KeyMode = 'default' | 'vim';
const KEY_MODE_DEFAULT: KeyMode = 'default';

const CHECKLIST_DEFAULT = `
vars:
  mimizou: https://avatars0.githubusercontent.com/u/9500018?v=3&s=460
cases:
  - title: something
    image: '{{ mimizou }}'
    conditions:
      - added:
          # regexp
          - root<'items'><[0-9]><'hogehoge-added'>
      - changed:
          # regexp
          - .+
      - removed:
          # regexp
          - root<'items'><[0-9]><'hogehoge-removed'>
`;

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

    get prefix(): string {
        return this.localStorageService.get<string>('prefix');
    }

    set prefix(value: string) {
        this.localStorageService.set('prefix', value);
    }

    get tmpAccessKeyId(): string {
        return this.localStorageService.get<string>('tmpAccessKeyId');
    }

    set tmpAccessKeyId(value: string) {
        this.localStorageService.set('tmpAccessKeyId', value);
    }

    removeTmpAccessKeyId() {
        this.localStorageService.remove('tmpAccessKeyId');
    }

    get tmpSecretAccessKey(): string {
        return this.localStorageService.get<string>('tmpSecretAccessKey');
    }

    set tmpSecretAccessKey(value: string) {
        this.localStorageService.set('tmpSecretAccessKey', value);
    }

    removeTmpSecretAccessKeyId() {
        this.localStorageService.remove('tmpSecretAccessKeyId');
    }

    get tmpSessionToken(): string {
        return this.localStorageService.get<string>('tmpSessionToken');
    }

    set tmpSessionToken(value: string) {
        this.localStorageService.set('tmpSessionToken', value);
    }

    removeTmpSessionToken() {
        this.localStorageService.remove('tmpSessionToken');
    }

    get tmpExpireTime(): Date {
        return new Date(this.localStorageService.get<Date>('tmpExpireTime'));
    }

    set tmpExpireTime(value: Date) {
        this.localStorageService.set('tmpExpireTime', value);
    }

    removeTmpExpireTime() {
        this.localStorageService.remove('tmpExpireTime');
    }

    get useLocalStack(): boolean {
        return this.localStorageService.get<boolean>('useLocalStack');
    }

    set useLocalStack(value: boolean) {
        this.localStorageService.set('useLocalStack', value);
    }

    get keyMode(): KeyMode {
        return this.localStorageService.get<KeyMode>('keyMode') || KEY_MODE_DEFAULT;
    }

    set keyMode(value: KeyMode) {
        this.localStorageService.set('keyMode', value);
    }

    get alwaysIntelligentAnalytics(): boolean {
        return this.localStorageService.get<boolean>('alwaysIntelligentAnalytics');
    }

    set alwaysIntelligentAnalytics(value: boolean) {
        this.localStorageService.set('alwaysIntelligentAnalytics', value);
    }

    get localStackEndpoint(): string {
        return this.localStorageService.get<string>('localStackEndpoint');
    }

    set localStackEndpoint(value: string) {
        this.localStorageService.set('localStackEndpoint', value);
    }

    get unifiedDiff(): boolean {
        return this.localStorageService.get<boolean>('unifiedDiff');
    }

    set unifiedDiff(value: boolean) {
        this.localStorageService.set('unifiedDiff', value);
    }

    get hideIgnoredDiff(): boolean {
        return this.localStorageService.get<boolean>('hideIgnoredDiff');
    }

    set hideIgnoredDiff(value: boolean) {
        this.localStorageService.set('hideIgnoredDiff', value);
    }

    get hideCheckedAlreadyDiff(): boolean {
        return this.localStorageService.get<boolean>('hideCheckedAlreadyDiff');
    }

    set hideCheckedAlreadyDiff(value: boolean) {
        this.localStorageService.set('hideCheckedAlreadyDiff', value);
    }

    get selectedColumnNames(): string[] {
        return this.localStorageService.get<string[]>('selectedColumnNames');
    }

    set selectedColumnNames(value: string[]) {
        this.localStorageService.set('selectedColumnNames', value);
    }

    get checkList(): string {
        return this.localStorageService.get<string>('checkList') || CHECKLIST_DEFAULT;
    }

    set checkList(value: string) {
        this.localStorageService.set('checkList', value);
    }

}
