import {Injectable} from '@angular/core';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import {S3, DynamoDB} from 'aws-sdk';
import {ObjectList} from 'aws-sdk/clients/s3';
import {DynamoResult, Report} from './gemini-summary';
import {AwsConfig} from '../models';

@Injectable()
export class SummaryService {

    fetchDetail(key: string, awsConfig: AwsConfig): Promise<Object> {
        return new Promise((resolve, reject) => {
            const s3 = new S3({
                apiVersion: '2006-03-01',
                accessKeyId: awsConfig.accessKeyId,
                secretAccessKey: awsConfig.secretAccessKey
            });

            s3.getObject(
                {Key: key, Bucket: awsConfig.bucket},
                (err, data) => err ? reject(err.message) : resolve(data.Body.toString())
            );
        });
    }

    fetchReport(key: string, awsConfig: AwsConfig): Promise<Report> {
        return new Promise((resolve, reject) => {
            const s3 = new S3({
                apiVersion: '2006-03-01',
                accessKeyId: awsConfig.accessKeyId,
                secretAccessKey: awsConfig.secretAccessKey
            });

            s3.getObject(
                {Key: key, Bucket: awsConfig.bucket},
                (err, data) => err ? reject(err.message) : resolve(JSON.parse(data.Body.toString()))
            );
        });
    }

    fetchList(key: string, awsConfig: AwsConfig): Promise<ObjectList> {
        const s3 = new S3({
            apiVersion: '2006-03-01',
            accessKeyId: awsConfig.accessKeyId,
            secretAccessKey: awsConfig.secretAccessKey
        });

        return new Promise((resolve, reject) => {
            s3.listObjectsV2(
                {Bucket: awsConfig.bucket, Prefix: key},
                (err, data) => err ? reject(err.message) : resolve(data.Contents)
            );
        });
    }

    removeDetails(keys: string[], awsConfig: AwsConfig): Promise<any> {
        // WARNING: this method is alpha
        if (keys.length === 0) {
            return Promise.resolve('ok');
        }

        const s3 = new S3({
            apiVersion: '2006-03-01',
            accessKeyId: awsConfig.accessKeyId,
            secretAccessKey: awsConfig.secretAccessKey
        });
        return new Promise((resolve, reject) => {
            s3.deleteObjects(
                {Bucket: awsConfig.bucket, Delete: {Objects: keys.map(k => ({Key: k}))}},
                (err, data) => err ? reject(err.message) : resolve(data)
            );
        });
    }

    removeReport(key: string, awsConfig: AwsConfig): Promise<any> {
        // WARNING: this method is alpha
        return new Promise((resolve, reject) => {
            const db = new DynamoDB.DocumentClient({
                service: new DynamoDB({
                    region: awsConfig.region,
                    accessKeyId: awsConfig.accessKeyId,
                    secretAccessKey: awsConfig.secretAccessKey
                })
            });

            const params = {
                TableName: awsConfig.table,
                Key: {
                    hashkey: key
                }
            };

            db.delete(params, (err, data) => {
                return err ? reject(err.message) : resolve(data);
            });
        });
    }

    searchReport(keyWord: string, awsConfig: AwsConfig): Promise<DynamoResult> {
        return new Promise((resolve, reject) => {
            const db = new DynamoDB.DocumentClient({
                service: new DynamoDB({
                    region: awsConfig.region,
                    accessKeyId: awsConfig.accessKeyId,
                    secretAccessKey: awsConfig.secretAccessKey
                })
            });

            const params = {
                TableName: awsConfig.table,
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
