import {Injectable} from '@angular/core';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import {S3, DynamoDB, TemporaryCredentials, Credentials} from 'aws-sdk';
import {ObjectList} from 'aws-sdk/clients/s3';
import {DynamoResult, Pair, Report} from '../models/models';
import * as Encoding from 'encoding-japanese';
import {LocalStorageService} from 'angular-2-local-storage';
import {Router} from '@angular/router';
import DocumentClient = DynamoDB.DocumentClient;

const DURATION_SECONDS: number = 86400;
const JUMEAUX_RESULTS_PREFIX = 'jumeaux-results';

@Injectable()
export class AwsService {
    region = this.localStorageService.get<string>('region') || 'ap-northeast-1';
    table: string = this.localStorageService.get<string>('table');
    bucket: string = this.localStorageService.get<string>('bucket');
    tmpCredentials: TemporaryCredentials;
    tmpAccessKeyId: string = this.localStorageService.get<string>('tmpAccessKeyId');
    tmpSecretAccessKey: string = this.localStorageService.get<string>('tmpSecretAccessKey');
    tmpSessionToken: string = this.localStorageService.get<string>('tmpSessionToken');
    tmpExpireTime: Date = new Date(this.localStorageService.get<Date>('tmpExpireTime'));

    constructor(private localStorageService: LocalStorageService,
                private router: Router) {
        // DO NOTHING
    }

    updateRegion(region: string) {
        this.region = region;
        this.localStorageService.set('region', this.region);
    }

    updateTable(table: string) {
        this.table = table;
        this.localStorageService.set('table', this.table);
    }

    updateBucket(bucket: string) {
        this.bucket = bucket;
        this.localStorageService.set('bucket', this.bucket);
    }

    login(accessKeyId: string, secretAccessKey: string): Promise<any> {
        this.tmpCredentials = new TemporaryCredentials({DurationSeconds: DURATION_SECONDS}, <Credentials>{
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey
        });

        return this.refresh();
    }

    logout() {
        this.localStorageService.remove(
            'tmpAccessKeyId',
            'tmpSecretAccessKey',
            'tmpSessionToken',
            'tmpExpireTime'
        )
    }

    async fetchTrial(key: string, name: string): Promise<{ encoding: string, body: string }> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        const s3 = new S3({
            apiVersion: '2006-03-01',
            accessKeyId: this.tmpAccessKeyId,
            secretAccessKey: this.tmpSecretAccessKey,
            sessionToken: this.tmpSessionToken
        });

        return new Promise<{ encoding: string, body: string }>((resolve, reject) => {
            s3.getObject(
                {Key: `${JUMEAUX_RESULTS_PREFIX}/${key}/${name}`, Bucket: this.bucket},
                (err, data) => {
                    if (err) {
                        return reject(err.message);
                    } else {
                        const encoding: string = Encoding.detect(data.Body);
                        const body: string = Encoding.codeToString(
                            Encoding.convert(data.Body, {from: encoding, to: 'UNICODE'})
                        );
                        return resolve({encoding, body});
                    }
                }
            );
        });
    }

    async fetchReport(key: string): Promise<Report> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        const s3 = new S3({
            apiVersion: '2006-03-01',
            accessKeyId: this.tmpAccessKeyId,
            secretAccessKey: this.tmpSecretAccessKey,
            sessionToken: this.tmpSessionToken
        });

        return new Promise<Report>((resolve, reject) => {
            s3.getObject(
                {Key: `${JUMEAUX_RESULTS_PREFIX}/${key}/report.json`, Bucket: this.bucket},
                (err, data) => err ? reject(err.message) : resolve(JSON.parse(data.Body.toString()))
            );
        });
    }

    async fetchArchive(key: string): Promise<{name: string, body: Blob}> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        const s3 = new S3({
            apiVersion: '2006-03-01',
            accessKeyId: this.tmpAccessKeyId,
            secretAccessKey: this.tmpSecretAccessKey,
            sessionToken: this.tmpSessionToken
        });

        const zipName = `${key.substring(0, 7)}.zip`;
        return new Promise<{name: string, body: Blob}>((resolve, reject) => {
            s3.getObject(
                {Key: `${JUMEAUX_RESULTS_PREFIX}/${key}/${zipName}`, Bucket: this.bucket},
                (err, data) => err ? reject(err.message) : resolve({
                    name: zipName,
                    body: new Blob([data.Body])
                })
            );
        });
    }

    async removeTrials(s3Keys: string[]): Promise<any> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        // WARNING: this method is alpha
        if (s3Keys.length === 0) {
            return Promise.resolve('ok');
        }

        const s3 = new S3({
            apiVersion: '2006-03-01',
            accessKeyId: this.tmpAccessKeyId,
            secretAccessKey: this.tmpSecretAccessKey,
            sessionToken: this.tmpSessionToken
        });

        return new Promise((resolve, reject) => {
            s3.deleteObjects(
                {Bucket: this.bucket, Delete: {Objects: s3Keys.map(k => ({Key: k}))}},
                (err, data) => err ? reject(err.message) : resolve(data)
            );
        });
    }

    async fetchList(key: string): Promise<ObjectList> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        const s3 = new S3({
            apiVersion: '2006-03-01',
            accessKeyId: this.tmpAccessKeyId,
            secretAccessKey: this.tmpSecretAccessKey,
            sessionToken: this.tmpSessionToken
        });

        return new Promise<ObjectList>((resolve, reject) => {
            s3.listObjectsV2(
                {Bucket: this.bucket, Prefix: `${JUMEAUX_RESULTS_PREFIX}/${key}`},
                (err, data) => err ? reject(err.message) : resolve(data.Contents)
            );
        });
    }

    async removeSummary(key: string): Promise<any> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        // WARNING: this method is alpha
        const db = new DynamoDB.DocumentClient({
            service: new DynamoDB({
                region: this.region,
                accessKeyId: this.tmpAccessKeyId,
                secretAccessKey: this.tmpSecretAccessKey,
                sessionToken: this.tmpSessionToken
            })
        });

        const params = {
            TableName: this.table,
            Key: {
                hashkey: key
            }
        };

        return new Promise((resolve, reject) => {
            db.delete(params, (err, data) => {
                return err ? reject(err.message) : resolve(data);
            });
        });
    }

    async findSummary(keyWord: string): Promise<DynamoResult> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        const db = new DynamoDB.DocumentClient({
            service: new DynamoDB({
                region: this.region,
                accessKeyId: this.tmpAccessKeyId,
                secretAccessKey: this.tmpSecretAccessKey,
                sessionToken: this.tmpSessionToken
            })
        });

        const params = {
            TableName: this.table,
            FilterExpression: [
                'contains(hashkey, :hashkey)',
                'contains(title, :title)',
                'contains(one_host, :one_host)',
                'contains(other_host, :other_host)',
                'contains(begin_time, :begin_time)',
                'contains(paths, :paths)'
            ].join(' OR '),
            ExpressionAttributeValues: {
                ':hashkey': keyWord,
                ':title': keyWord,
                ':one_host': keyWord,
                ':other_host': keyWord,
                ':begin_time': keyWord,
                ':paths': keyWord
            }
        };

        return new Promise<DynamoResult>((resolve, reject) => {
            db.scan(params, (err, data: DocumentClient.ScanOutput) => {
                return err ? reject(err.message) : resolve(data as DynamoResult);
            });
        });
    }

    private refresh(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.tmpCredentials.refresh(err => {
                if (err) {
                    reject(err);
                }

                this.tmpAccessKeyId = this.tmpCredentials.accessKeyId;
                this.tmpSecretAccessKey = this.tmpCredentials.secretAccessKey;
                this.tmpSessionToken = this.tmpCredentials.sessionToken;
                this.tmpExpireTime = this.tmpCredentials.expireTime;

                this.localStorageService.set('tmpAccessKeyId', this.tmpAccessKeyId);
                this.localStorageService.set('tmpSecretAccessKey', this.tmpSecretAccessKey);
                this.localStorageService.set('tmpSessionToken', this.tmpSessionToken);
                this.localStorageService.set('tmpExpireTime', this.tmpExpireTime);

                resolve()
            })
        });
    }

    /**
     *
     * @returns {Promise<boolean>} Should continue operation (ex. search)
     */
    private async checkCredentialsExpiredAndTreat(): Promise<boolean> {
        if (this.tmpExpireTime > new Date()) {
            return true;
        }

        // Temporary credentials is expired
        if (this.tmpCredentials) {
            await this.refresh();
            return true;
        }

        // Nothing to do without login again
        this.logout();
        this.router.navigate(['/login']);
        return false;
    }
}
