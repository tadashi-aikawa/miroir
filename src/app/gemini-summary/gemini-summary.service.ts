import {Injectable} from '@angular/core';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import {S3, DynamoDB} from 'aws-sdk'
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
                    "contains(hashkey, :hashkey)",
                    "contains(title, :title)",
                    "contains(one_host, :one_host)",
                    "contains(other_host, :other_host)",
                    "contains(begin_time, :begin_time)"
                ].join(" OR "),
                ExpressionAttributeValues: {
                    ":hashkey": keyWord,
                    ":title": keyWord,
                    ":one_host": keyWord,
                    ":other_host": keyWord,
                    ":begin_time": keyWord
                }
            };

            db.scan(params, (err, data) => {
                return err ? reject(err.message) : resolve(data)
            });
        });
    }

}
