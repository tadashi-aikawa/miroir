import {Injectable} from '@angular/core';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import {Credentials, DynamoDB, S3, TemporaryCredentials} from 'aws-sdk';
import {ObjectList} from 'aws-sdk/clients/s3';
import {DynamoResult, Report, Trial} from '../models/models';
import * as Encoding from 'encoding-japanese';
import {Router} from '@angular/router';
import CheckStatus from '../constants/check-status';
import {SettingsService} from './settings-service';
import DocumentClient = DynamoDB.DocumentClient;

const DURATION_SECONDS: number = 86400;
const JUMEAUX_RESULTS_PREFIX = 'jumeaux-results';


function fetchObject<T>(s3: S3, bucket: string, objectKey: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        s3.getObject(
            {Key: objectKey, Bucket: bucket},
            (err, data) => err ? reject(err.message) : resolve(JSON.parse(data.Body.toString()))
        );
    })
}

function putObject<T>(s3: S3, bucket: string, objectKey: string, body: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        s3.putObject(
            {Key: objectKey, Bucket: bucket, Body: body},
            (err, data) => err ? reject(err.message) : resolve()
        );
    });
}

function deleteObjects(s3: S3, bucket: string, objectKeys: string[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        s3.deleteObjects(
            {Bucket: bucket, Delete: {Objects: objectKeys.map(k => ({Key: k}))}},
            (err, data) => err ? reject(err.message) : resolve()
        );
    });
}

@Injectable()
export class AwsService {
    region = this.settingsService.region || 'ap-northeast-1';
    table: string = this.settingsService.table;
    bucket: string = this.settingsService.bucket;
    tmpCredentials: TemporaryCredentials;
    tmpAccessKeyId: string = this.settingsService.tmpAccessKeyId;
    tmpSecretAccessKey: string = this.settingsService.tmpSecretAccessKey;
    tmpSessionToken: string = this.settingsService.tmpSessionToken;
    tmpExpireTime: Date = this.settingsService.tmpExpireTime;

    s3: S3;
    db: DynamoDB.DocumentClient;

    constructor(private settingsService: SettingsService,
                private router: Router) {
        this.assignClients();
    }

    private assignClients(): void {
        this.s3 = new S3({
            apiVersion: '2006-03-01',
            accessKeyId: this.tmpAccessKeyId,
            secretAccessKey: this.tmpSecretAccessKey,
            sessionToken: this.tmpSessionToken
        });
        this.db = new DynamoDB.DocumentClient({
            service: new DynamoDB({
                region: this.region,
                accessKeyId: this.tmpAccessKeyId,
                secretAccessKey: this.tmpSecretAccessKey,
                sessionToken: this.tmpSessionToken
            })
        });
    }

    updateRegion(region: string) {
        this.region = region;
        this.settingsService.region = region;
        this.assignClients();
    }

    updateTable(table: string) {
        this.table = table;
        this.settingsService.table = table;
    }

    updateBucket(bucket: string) {
        this.bucket = bucket;
        this.settingsService.bucket = bucket
    }

    login(accessKeyId: string, secretAccessKey: string): Promise<any> {
        this.tmpCredentials = new TemporaryCredentials({DurationSeconds: DURATION_SECONDS}, <Credentials>{
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey
        });

        return this.refresh();
    }

    logout() {
        this.settingsService.removeTmpAccessKeyId();
        this.settingsService.removeTmpSecretAccessKeyId();
        this.settingsService.removeTmpSessionToken();
        this.settingsService.removeTmpExpireTime();
    }

    async fetchTrial(key: string, name: string): Promise<{ encoding: string, body: string }> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        return new Promise<{ encoding: string, body: string }>((resolve, reject) => {
            this.s3.getObject(
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

        const [report, trials]: [Report, Trial[]] = await Promise.all<Report, Trial[]>([
            fetchObject<Report>(this.s3, this.bucket, `${JUMEAUX_RESULTS_PREFIX}/${key}/report-without-trials.json`),
            fetchObject<Trial[]>(this.s3, this.bucket, `${JUMEAUX_RESULTS_PREFIX}/${key}/trials.json`)
        ]);

        return Object.assign(report, {trials});
    }

    async updateReportTitle(key: string, title: string): Promise<void> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        const target = `${JUMEAUX_RESULTS_PREFIX}/${key}/report-without-trials.json`;
        const withoutTrials: Report = await fetchObject<Report>(this.s3, this.bucket, target);
        const after = Object.assign(withoutTrials, {title});

        return await putObject(this.s3, this.bucket, target, JSON.stringify(after));
    }

    async updateReportDescription(key: string, description: string): Promise<any> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        const target = `${JUMEAUX_RESULTS_PREFIX}/${key}/report-without-trials.json`;
        const withoutTrials: Report = await fetchObject<Report>(this.s3, this.bucket, target);
        const after = Object.assign(withoutTrials, {description});

        return await putObject(this.s3, this.bucket, target, JSON.stringify(after));
    }

    // TODO: Remove this function if jumeaux( < 0.9.0) become not be used
    async convertReport(key: string): Promise<void> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        const oldPath = `${JUMEAUX_RESULTS_PREFIX}/${key}/report.json`;
        const old: Report = await fetchObject<Report>(this.s3, this.bucket, oldPath);

        await putObject(
            this.s3,
            this.bucket,
            `${JUMEAUX_RESULTS_PREFIX}/${key}/trials.json`,
            JSON.stringify(old.trials)
        );

        delete old.trials;
        await putObject(
            this.s3,
            this.bucket,
            `${JUMEAUX_RESULTS_PREFIX}/${key}/report-without-trials.json`,
            JSON.stringify(old)
        );

        await deleteObjects(this.s3, this.bucket, [oldPath]);
    }

    async fetchArchive(key: string): Promise<{name: string, body: Blob}> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        const zipName = `${key.substring(0, 7)}.zip`;
        return new Promise<{name: string, body: Blob}>((resolve, reject) => {
            this.s3.getObject(
                {Key: `${JUMEAUX_RESULTS_PREFIX}/${key}/${zipName}`, Bucket: this.bucket},
                (err, data) => err ? reject(err.message) : resolve({
                    name: zipName,
                    body: new Blob([data.Body])
                })
            );
        });
    }

    async removeTrials(s3Keys: string[]): Promise<void> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        // WARNING: this method is alpha
        if (s3Keys.length === 0) {
            return;
        }

        await deleteObjects(this.s3, this.bucket, s3Keys);
    }

    async fetchList(key: string): Promise<ObjectList> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        return new Promise<ObjectList>((resolve, reject) => {
            this.s3.listObjectsV2(
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
        const params = {
            TableName: this.table,
            Key: {
                hashkey: key
            }
        };

        return new Promise((resolve, reject) => {
            this.db.delete(params, (err, data) => {
                return err ? reject(err.message) : resolve(data);
            });
        });
    }

    async updateSummaryTitle(key: string, title: string): Promise<any> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        // WARNING: this method is alpha
        const params = {
            TableName: this.table,
            Key: {
                hashkey: key
            },
            UpdateExpression: 'set #a = :title',
            ExpressionAttributeNames: {'#a' : 'title'},
            ExpressionAttributeValues: {':title' : title}
        };

        return new Promise((resolve, reject) => {
            this.db.update(params, (err, data) => {
                return err ? reject(err.message) : resolve(data);
            });
        });
    }

    async updateSummaryDescription(key: string, description: string): Promise<any> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        // WARNING: this method is alpha
        const params = {
            TableName: this.table,
            Key: {
                hashkey: key
            },
            UpdateExpression: 'set #a = :description',
            ExpressionAttributeNames: {'#a' : 'description'},
            ExpressionAttributeValues: {':description' : description}
        };

        return new Promise((resolve, reject) => {
            this.db.update(params, (err, data) => {
                return err ? reject(err.message) : resolve(data);
            });
        });
    }

    async updateStatus(key: string, status: CheckStatus): Promise<any> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        // WARNING: this method is alpha
        const params = {
            TableName: this.table,
            Key: {
                hashkey: key
            },
            UpdateExpression: 'set #a = :check_status',
            ExpressionAttributeNames: {'#a' : 'check_status'},
            ExpressionAttributeValues: {':check_status' : status}
        };

        return new Promise((resolve, reject) => {
            this.db.update(params, (err, data) => {
                return err ? reject(err.message) : resolve(data);
            });
        });
    }

    async findSummary(keyWord: string): Promise<DynamoResult> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        const params = {
            TableName: this.table,
            FilterExpression: [
                'contains(hashkey, :hashkey)',
                'contains(title, :title)',
                'contains(description, :description)',
                'contains(one_host, :one_host)',
                'contains(other_host, :other_host)',
                'contains(begin_time, :begin_time)',
                'contains(paths, :paths)'
            ].join(' OR '),
            ExpressionAttributeValues: {
                ':hashkey': keyWord,
                ':title': keyWord,
                ':description': keyWord,
                ':one_host': keyWord,
                ':other_host': keyWord,
                ':begin_time': keyWord,
                ':paths': keyWord
            }
        };

        return new Promise<DynamoResult>((resolve, reject) => {
            this.db.scan(params, (err, data: DocumentClient.ScanOutput) => {
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

                this.settingsService.tmpAccessKeyId = this.tmpAccessKeyId;
                this.settingsService.tmpSecretAccessKey = this.tmpSecretAccessKey;
                this.settingsService.tmpSessionToken = this.tmpSessionToken;
                this.settingsService.tmpExpireTime = this.tmpExpireTime;

                this.assignClients();
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
