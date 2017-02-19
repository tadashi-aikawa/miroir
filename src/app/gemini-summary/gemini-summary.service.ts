import {Injectable} from '@angular/core';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import {S3, DynamoDB} from 'aws-sdk'
import {DynamoResult} from './gemini-summary';

@Injectable()
export class SummaryService {

    fetchDetail(key: string, accessKeyId: string, secretAccessKey: string): Promise<Object> {
        return new Promise((resolve, reject) => {
            const s3 = new S3({apiVersion: '2006-03-01', accessKeyId, secretAccessKey});

            s3.getObject(
                {Key: key, Bucket: "mamansoft-gemini-test"},
                (err, data) => err ? reject(err.message) : resolve(data.Body.toString())
            );
        });
    }

    fetchReport(keyWord: string, region: string, accessKeyId: string, secretAccessKey: string): Promise<DynamoResult> {
        return new Promise((resolve, reject) => {
            const db = new DynamoDB.DocumentClient({
                service: new DynamoDB({region, accessKeyId, secretAccessKey})
            });

            const params = {
                TableName: "gemini-report",
                FilterExpression: [
                    "contains(hashkey, :hashkey)",
                    "contains(title, :title)",
                    "contains(one_host, :one_host)",
                    "contains(other_host, :other_host)",
                ].join(" OR "),
                ExpressionAttributeValues: {
                    ":hashkey": keyWord,
                    ":title": keyWord,
                    ":one_host": keyWord,
                    ":other_host": keyWord
                }
            };

            db.scan(params, (err, data) => {
                return err ? reject(err.message) : resolve(data)
            });
        });
    }

}
