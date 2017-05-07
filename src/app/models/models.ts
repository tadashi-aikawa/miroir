import DiffType from '../constants/DiffType';
import DiffCognition from '../constants/DiffCognition';

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
    retry_hash?: string;

    deleting?: boolean;
    deleteErrorMessage?: string;
    downloading?: boolean;
    downloadErrorMessage?: string;
}

export class RegExpMatcher {
    pattern: string;
    note?: string;
}

export class PropertyDiff {
    pattern: string;
    type: DiffType;
    cognition: DiffCognition;
    note: string;
}

// TODO define needed parameters
export class Condition {
    path: {
        pattern: string;
        added?: RegExpMatcher[];
        changed?: RegExpMatcher[];
        removed?: RegExpMatcher[];
    };
}

export class JudgementAddon {
    config: object;
}

// TODO define needed parameters
export class Addons {
    judgement: JudgementAddon[];
}

export class Report {
    key: string;
    title: string;
    summary: Summary;
    trials: Trial[];
    addons?: Addons;
    retry_hash?: string;
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

    get responseSecDiff(): number {
        return Math.round((this.other.response_sec - this.one.response_sec) * 100) / 100;
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
