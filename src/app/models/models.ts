export class AwsConfig {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    table: string;
    bucket: string;
}

export class DynamoResult {
    Count: number;
    ScannedCount: number;
    Items: DynamoRow[];
}

export class DynamoRow {
    hashkey: string;
    title: string;
    same_count: number;
    different_count: number;
    failure_count: number;
    one_host: string;
    other_host: string;
    begin_time: string;
    end_time: string;
    with_zip: boolean;

    deleting?: boolean;
    deleteErrorMessage?: string;
    downloading?: boolean;
    downloadErrorMessage?: string;
}

export class Report {
    key: string;
    title: string;
    summary: Summary;
    trials: Trial[];
}

export class Summary {
    one: AccessPoint;
    other: AccessPoint;
    time: Time;
    status: {
        same: number;
        different: number;
    };
}

export class AccessPoint {
    name: string;
    host: string;
    proxy?: String;
}

class Time {
    elapsed_sec: number;
    start: string;
    end: string;
}

export class Trial {
    seq: number;
    name: string;
    headers: any;
    queries: any;
    one: ResponseSummary;
    other: ResponseSummary;
    path: string;
    request_time: string;
    status: string;
}

export class ResponseSummary {
    status_code: number;
    byte: number;
    response_sec: number;
    url: string;
    file?: string;
}

export class Pair<T> {
    one: T;
    other: T;
}
