import {Injectable} from '@angular/core';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import {S3, DynamoDB, TemporaryCredentials, Credentials} from 'aws-sdk';
import {ObjectList} from 'aws-sdk/clients/s3';
import {DynamoResult, Report} from '../models/models';
import * as Encoding from 'encoding-japanese';
import {LocalStorageService} from 'angular-2-local-storage';

@Injectable()
export class AwsService {
    region = this.localStorageService.get<string>('region') || 'ap-northeast-1';
    table: string = this.localStorageService.get<string>('table');
    bucket: string = this.localStorageService.get<string>('bucket');
    tmpAccessKeyId: string = this.localStorageService.get<string>('tmpAccessKeyId');
    tmpSecretAccessKey: string = this.localStorageService.get<string>('tmpSecretAccessKey');
    tmpSessionToken: string = this.localStorageService.get<string>('tmpSessionToken');

    constructor(
        private localStorageService: LocalStorageService
    ) {
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
        return new Promise((resolve, reject) => {
            const tmpCredentials: TemporaryCredentials = new TemporaryCredentials({DurationSeconds: 900}, <Credentials>{
                accessKeyId: accessKeyId,
                secretAccessKey: secretAccessKey
            });

            tmpCredentials.refresh(err => {
                if (err) {
                    reject(err);
                }

                this.tmpAccessKeyId = tmpCredentials.accessKeyId;
                this.tmpSecretAccessKey = tmpCredentials.secretAccessKey;
                this.tmpSessionToken = tmpCredentials.sessionToken;

                this.localStorageService.set('tmpAccessKeyId', this.tmpAccessKeyId);
                this.localStorageService.set('tmpSecretAccessKey', this.tmpSecretAccessKey);
                this.localStorageService.set('tmpSessionToken', this.tmpSessionToken);

                resolve()
            })
        });
    }

    logout() {
        this.localStorageService.remove(
            'tmpAccessKeyId',
            'tmpSecretAccessKey',
            'tmpSessionToken'
        )
    }

    fetchDetail(key: string): Promise<{encoding: string, body: string}> {
        return new Promise((resolve, reject) => {
            const s3 = new S3({
                apiVersion: '2006-03-01',
                accessKeyId: this.tmpAccessKeyId,
                secretAccessKey: this.tmpSecretAccessKey,
                sessionToken: this.tmpSessionToken
            });

            s3.getObject(
                {Key: key, Bucket: this.bucket},
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

    fetchReport(key: string): Promise<Report> {
        return new Promise((resolve, reject) => {
            const s3 = new S3({
                apiVersion: '2006-03-01',
                accessKeyId: this.tmpAccessKeyId,
                secretAccessKey: this.tmpSecretAccessKey,
                sessionToken: this.tmpSessionToken
            });

            s3.getObject(
                {Key: key, Bucket: this.bucket},
                (err, data) => err ? reject(err.message) : resolve(JSON.parse(data.Body.toString()))
            );
        });
    }

    fetchArchive(key: string): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const s3 = new S3({
                apiVersion: '2006-03-01',
                accessKeyId: this.tmpAccessKeyId,
                secretAccessKey: this.tmpSecretAccessKey,
                sessionToken: this.tmpSessionToken
            });

            s3.getObject(
                {Key: key, Bucket: this.bucket},
                (err, data) => err ? reject(err.message) : resolve(new Blob([data.Body]))
            );
        });
    }

    fetchList(key: string): Promise<ObjectList> {
        const s3 = new S3({
            apiVersion: '2006-03-01',
            accessKeyId: this.tmpAccessKeyId,
            secretAccessKey: this.tmpSecretAccessKey,
            sessionToken: this.tmpSessionToken
        });

        return new Promise((resolve, reject) => {
            s3.listObjectsV2(
                {Bucket: this.bucket, Prefix: key},
                (err, data) => err ? reject(err.message) : resolve(data.Contents)
            );
        });
    }

    removeDetails(keys: string[]): Promise<any> {
        // WARNING: this method is alpha
        if (keys.length === 0) {
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
                {Bucket: this.bucket, Delete: {Objects: keys.map(k => ({Key: k}))}},
                (err, data) => err ? reject(err.message) : resolve(data)
            );
        });
    }

    removeReport(key: string): Promise<any> {
        // WARNING: this method is alpha
        return new Promise((resolve, reject) => {
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

            db.delete(params, (err, data) => {
                return err ? reject(err.message) : resolve(data);
            });
        });
    }

    searchReport(keyWord: string): Promise<DynamoResult> {
        return new Promise((resolve, reject) => {
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

            db.scan(params, (err, data) => {
                return err ? reject(err.message) : resolve(data);
            });
        });
    }

}
