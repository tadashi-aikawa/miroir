import {Injectable} from '@angular/core';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import {Credentials, DynamoDB, S3, TemporaryCredentials} from 'aws-sdk';
import {ListObjectsV2Output} from 'aws-sdk/clients/s3';
import {DynamoResult, Report, Trial, AwsConfiguration} from '../models/models';
import * as Encoding from 'encoding-japanese';
import * as _ from 'lodash';
import {Router} from '@angular/router';
import CheckStatus from '../constants/check-status';
import {SettingsService} from './settings-service';
import {ConditionExpression, ExpressionAttributeValueMap} from 'aws-sdk/clients/dynamodb';
import DocumentClient = DynamoDB.DocumentClient;

const DURATION_SECONDS = 86400;
const S3_MAX_PER_PAGE = 1000;


function fetchObject<T>(s3: S3, bucket: string, objectKey: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        s3.getObject(
            {Key: objectKey, Bucket: bucket},
            (err, data) => err ? reject(err.message) : resolve(JSON.parse(data.Body.toString()))
        );
    });
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
    prefix: string = this.settingsService.prefix;
    tmpCredentials: TemporaryCredentials;
    tmpAccessKeyId: string = this.settingsService.tmpAccessKeyId;
    tmpSecretAccessKey: string = this.settingsService.tmpSecretAccessKey;
    tmpSessionToken: string = this.settingsService.tmpSessionToken;
    tmpExpireTime: Date = this.settingsService.tmpExpireTime;
    useLocalStack: boolean = this.settingsService.useLocalStack || false;
    localStackEndpoint: string = this.settingsService.localStackEndpoint || 'http://localhost';

    private sharedAwsConfiguration = new Subject<AwsConfiguration>();
    public sharedAwsConfiguration$ = this.sharedAwsConfiguration.asObservable();

    s3: S3;
    db: DynamoDB.DocumentClient;

    constructor(private settingsService: SettingsService,
                private router: Router) {
        this.assignClients();
    }

    private get dataPrefix(): string {
        return this.prefix ? `${this.prefix}/results` : 'results';
    }

    private assignClients(): void {
        this.s3 = new S3({
            apiVersion: '2006-03-01',
            region: this.region,
            accessKeyId: this.tmpAccessKeyId,
            secretAccessKey: this.tmpSecretAccessKey,
            sessionToken: this.tmpSessionToken,
            endpoint: this.useLocalStack ? `${this.localStackEndpoint}:4572` : undefined,
            maxRetries: 1,
        });
        this.db = new DynamoDB.DocumentClient({
            convertEmptyValues: true,
            service: new DynamoDB({
                region: this.region,
                accessKeyId: this.tmpAccessKeyId,
                secretAccessKey: this.tmpSecretAccessKey,
                sessionToken: this.tmpSessionToken,
                endpoint: this.useLocalStack ? `${this.localStackEndpoint}:4569` : undefined
            })
        });
    }

    update(region: string, table: string, bucket: string, prefix: string) {
        // Empty string and undefined are different as meaning
        if (region !== undefined) {
            this.region = region;
            this.settingsService.region = region;
            this.assignClients();
        }

        if (table !== undefined) {
            this.table = table;
            this.settingsService.table = table;
        }
        if (bucket !== undefined) {
            this.bucket = bucket;
            this.settingsService.bucket = bucket;
        }
        if (prefix !== undefined) {
            this.prefix = prefix;
            this.settingsService.prefix = prefix;
        }

        this.sharedAwsConfiguration.next({region, table, bucket, prefix});
    }

    login(accessKeyId: string, secretAccessKey: string,
          useLocalStack: boolean = false, localStackEndpoint?: string): Promise<any> {
        this.tmpCredentials = new TemporaryCredentials({DurationSeconds: DURATION_SECONDS}, <Credentials>{
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey
        });
        this.useLocalStack = useLocalStack;
        this.settingsService.useLocalStack = useLocalStack;
        if (useLocalStack) {
            this.localStackEndpoint = localStackEndpoint;
            this.settingsService.localStackEndpoint = localStackEndpoint;
        }
        return this.refresh();
    }

    logout() {
        this.settingsService.removeTmpAccessKeyId();
        this.settingsService.removeTmpSecretAccessKeyId();
        this.settingsService.removeTmpSessionToken();
        this.settingsService.removeTmpExpireTime();
    }

    async pingTable(): Promise<void | string> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        return new Promise<void | string>((resolve, reject) => {
            this.db.query(Object.assign({
                    TableName: this.table,
                    Limit: 1,
                    KeyConditionExpression: 'hashkey = :hash',
                    ExpressionAttributeValues: {':hash': 'something'},
                }, {}
                ), err => err ?
                reject(err.code === 'ResourceNotFoundException' ? `Invalid table name` : 'Unexpected error') :
                resolve()
            );
        });
    }

    async pingBucket(): Promise<void | string> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        return new Promise<void | string>((resolve, reject) => {
            this.s3.headBucket(
                {Bucket: this.bucket},
                err => err ?
                    reject(err.code === 'NetworkingError' ? `Invalid bucket name` : 'Unexpected error') :
                    resolve()
            );
        });
    }

    async pingBucketWithPrefix(): Promise<void | string> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        return new Promise<void | string>((resolve, reject) => {
            this.s3.listObjectsV2(
                {Bucket: this.bucket, Prefix: this.prefix && `${this.prefix}/`, MaxKeys: 1},
                (err, data) => err ?
                    reject('Unexpected error') :
                    data.KeyCount > 0 ? resolve() : reject(`${this.bucket}/${this.prefix} is not existed or empty`)
            );
        });
    }

    async fetchFile(key: string, name: string): Promise<{ encoding: string, body: string }> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        return new Promise<{ encoding: string, body: string }>((resolve, reject) => {
            this.s3.getObject(
                {Key: `${this.dataPrefix}/${key}/${name}`, Bucket: this.bucket},
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
            fetchObject<Report>(this.s3, this.bucket, `${this.dataPrefix}/${key}/report-without-trials.json`),
            fetchObject<Trial[]>(this.s3, this.bucket, `${this.dataPrefix}/${key}/trials.json`)
        ]);

        return Object.assign(report, {trials});
    }

    async updateReportTitle(key: string, title: string): Promise<void> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        const target = `${this.dataPrefix}/${key}/report-without-trials.json`;
        const withoutTrials: Report = await fetchObject<Report>(this.s3, this.bucket, target);
        const after = Object.assign(withoutTrials, {title});

        return await putObject(this.s3, this.bucket, target, JSON.stringify(after));
    }

    async updateReportDescription(key: string, description: string): Promise<any> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        const target = `${this.dataPrefix}/${key}/report-without-trials.json`;
        const withoutTrials: Report = await fetchObject<Report>(this.s3, this.bucket, target);
        const after = Object.assign(withoutTrials, {description});

        return await putObject(this.s3, this.bucket, target, JSON.stringify(after));
    }

    async fetchArchive(key: string): Promise<{ name: string, body: Blob }> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        const zipName = `${key.substring(0, 7)}.zip`;
        return new Promise<{ name: string, body: Blob }>((resolve, reject) => {
            this.s3.getObject(
                {Key: `${this.dataPrefix}/${key}/${zipName}`, Bucket: this.bucket},
                (err, data) => err ? reject(err.message) : resolve({
                    name: zipName,
                    body: new Blob([data.Body as BlobPart]),
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

        for (const ks of _.chunk(s3Keys, S3_MAX_PER_PAGE)) {
            await deleteObjects(this.s3, this.bucket, ks);
        }
    }

    async fetchList(key: string): Promise<string[]> {
        if (!await this.checkCredentialsExpiredAndTreat()) {
            return Promise.reject('Temporary credentials is expired!!');
        }

        const recursiveFetchList = async (accumulator?: ListObjectsV2Output): Promise<ListObjectsV2Output> => {
            if (!accumulator) {
                accumulator = {KeyCount: 0, Contents: []}
            }

            const current = await new Promise<ListObjectsV2Output>((resolve, reject) => {
                this.s3.listObjectsV2(
                    {
                        Bucket: this.bucket,
                        Prefix: `${this.dataPrefix}/${key}`,
                        ContinuationToken: accumulator.NextContinuationToken,
                        MaxKeys: S3_MAX_PER_PAGE,
                    },
                    (err, data) => err ? reject(err.message) : resolve(data)
                );
            });

            const accumulated: ListObjectsV2Output = {
                KeyCount: accumulator.KeyCount + current.KeyCount,
                Contents: [...accumulator.Contents, ...current.Contents],
                NextContinuationToken: current.NextContinuationToken,
            };

            return current.NextContinuationToken ? recursiveFetchList(accumulated) : accumulated;
        };

        return (await recursiveFetchList()).Contents.map(x => x.Key);
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
            ExpressionAttributeNames: {'#a': 'title'},
            ExpressionAttributeValues: {':title': title}
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
            ExpressionAttributeNames: {'#a': 'description'},
            ExpressionAttributeValues: {':description': description}
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
            ExpressionAttributeNames: {'#a': 'check_status'},
            ExpressionAttributeValues: {':check_status': status}
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

        const not = keyWord.slice(0, 1) === '!';

        const toFilterExpression = key => `contains(${key}, :${key})`;
        const toExpressionAttributePair = key => [`:${key}`, not ? keyWord.slice(1) : keyWord];
        const keys = [
            'hashkey',
            'title',
            'description',
            'one_host',
            'other_host',
            'begin_time',
            'check_status',
            'tags',
        ];

        const recursiveFetchSummary = async (accumurator?: DynamoResult) => {
            if (!accumurator) {
                accumurator = {Count: 0, ScannedCount: 0, Items: []}
            }

            const toLastEvaluatedHashkey = (r: DynamoResult): string => r && r.LastEvaluatedKey && r.LastEvaluatedKey.hashkey;

            const current = await this.fetchSummary(
                `${not ? 'NOT ' : ''}(${keys.map(toFilterExpression).join(' OR ')})`,
                _(keys).map(toExpressionAttributePair).fromPairs().value(),
                toLastEvaluatedHashkey(accumurator),
            );

            const accumurated: DynamoResult = {
                Count: accumurator.Count + current.Count,
                ScannedCount: accumurator.ScannedCount + current.ScannedCount,
                Items: [...accumurator.Items, ...current.Items],
                LastEvaluatedKey: {
                    hashkey: toLastEvaluatedHashkey(current)
                }
            };

            return toLastEvaluatedHashkey(current) ? recursiveFetchSummary(accumurated) : accumurated;
        };

        return recursiveFetchSummary();
    }

    private fetchSummary(filterExpression: ConditionExpression,
                         expressionAttributeValues: ExpressionAttributeValueMap,
                         exclusiveStartHash: string): Promise<DynamoResult> {
        return new Promise((resolve, reject) => {
            this.db.scan(Object.assign({
                    TableName: this.table,
                    FilterExpression: filterExpression,
                    ExpressionAttributeValues: expressionAttributeValues,
                }, exclusiveStartHash ? {ExclusiveStartKey: {hashkey: exclusiveStartHash}} : {}
            ), (err, data: DocumentClient.ScanOutput) => {
                return err ? reject(err.message) : resolve(data as DynamoResult);
            });
        });
    }

    private refresh(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.tmpCredentials.refresh(err => {
                if (this.useLocalStack) {
                    // TODO: Remove if LocalStack implements STS whose endpoint url can be changed
                    console.log('Ignore status 403 from STS because of LocalStack mode.');
                    this.tmpAccessKeyId = 'hoge';
                    this.tmpSecretAccessKey = 'hoge';
                    this.tmpSessionToken = 'hoge';
                    this.tmpExpireTime = new Date(9999, 1, 1, 0, 0, 0);
                } else {
                    if (err) {
                        reject(err);
                    }

                    this.tmpAccessKeyId = this.tmpCredentials.accessKeyId;
                    this.tmpSecretAccessKey = this.tmpCredentials.secretAccessKey;
                    this.tmpSessionToken = this.tmpCredentials.sessionToken;
                    this.tmpExpireTime = this.tmpCredentials.expireTime;
                }

                this.settingsService.tmpAccessKeyId = this.tmpAccessKeyId;
                this.settingsService.tmpSecretAccessKey = this.tmpSecretAccessKey;
                this.settingsService.tmpSessionToken = this.tmpSessionToken;
                this.settingsService.tmpExpireTime = this.tmpExpireTime;

                this.assignClients();
                resolve();
            });
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
        this.router.navigate(['/login'], {
            skipLocationChange: true,
        });
        return false;
    }
}
