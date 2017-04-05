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

export class RegExpMatcher {
    pattern: string;
    note?: string;
}

// TODO define needed parameters
export class Ignore {
    path: {
        pattern: string;
        added?: RegExpMatcher[];
        changed?: RegExpMatcher[];
        removed?: RegExpMatcher[];
    };
}

// TODO define needed parameters
export class Addons {
    judgement: {
        config: {
            ignores: Ignore[]
        }
    };
}

export class Report {
    key: string;
    title: string;
    summary: Summary;
    trials: Trial[];
    addons?: Addons;
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

class DiffKeys {
    added: string[];
    changed: string[];
    removed: string[];
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
    diff_keys: DiffKeys;

    hasResponse(): boolean {
        return this.one.file !== undefined && this.other.file !== undefined;
    }
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
