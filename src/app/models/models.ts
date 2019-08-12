import CheckStatus from '../constants/check-status';
import * as _ from 'lodash';
import { LazyGetter } from 'typescript-lazy-get-decorator';
import { DateTime } from 'luxon';

export type HttpMethod = 'GET' | 'POST';

export class DynamoResult {
  Count: number;
  ScannedCount: number;
  Items: DynamoRow[];
  LastEvaluatedKey?: {
    hashkey: string;
  };
}

export class DynamoRow {
  hashkey: string;
  title: string;
  description?: string;
  same_count: number;
  different_count: number;
  failure_count: number;
  one_host: string;
  other_host: string;
  begin_time: string;
  end_time: string;
  elapsed_sec: number;
  with_zip: boolean;
  retry_hash?: string;
  checklist?: string;
  check_status: CheckStatus;
  tags?: {
    values: string[];
  };
  deleting?: boolean;
  deleteErrorMessage?: string;
  downloading?: boolean;
  downloadErrorMessage?: string;
  updatingErrorMessage?: string;

  @LazyGetter()
  get localizedBeginTime(): DateTime {
    return DateTime.fromISO(this.begin_time);
  }
}

export class PropertyDiffs {
  title?: string;
  image?: string;
  link?: string;
  added: string[];
  changed: string[];
  removed: string[];

  isEmpty(): boolean {
    return this.added.length === 0 && this.changed.length === 0 && this.removed.length === 0;
  }
}

export class PropertyDiffsByCognition {
  unknown: PropertyDiffs;
  checkedAlready: PropertyDiffs[];
  ignored: PropertyDiffs[];

  getNonEmptyCheckedAlready(): PropertyDiffs[] {
    return this.checkedAlready.filter(x => !x.isEmpty());
  }

  getNonEmptyIgnored(): PropertyDiffs[] {
    return this.ignored.filter(x => !x.isEmpty());
  }
}

export class Condition {
  path?: string;
  name?: string;
  added?: string[];
  changed?: string[];
  removed?: string[];
}

// TODO define needed parameters
export class IgnoreCase {
  title: string;
  image?: string;
  link?: string;
  conditions: Condition[];
}

export class CheckPoint {
  vars: object;
  cases: IgnoreCase[];
}

export class Report {
  version: string;
  key: string;
  title: string;
  description?: string;
  summary: Summary;
  trials: Trial[];
  addons?: Object;
  retry_hash?: string;
  ignores: IgnoreCase[];
}

export class Summary {
  one: AccessPoint;
  other: AccessPoint;
  time: Time;
  tags: string[];
  status: {
    same: number;
    different: number;
    failure: number;
  };
}

export class PathReplace {
  before: string;
  after: string;
}

export class QueryCustomization {
  overwrite?: { [key: string]: string[] };
  remove?: string[];
}

export class AccessPoint {
  name: string;
  host: string;
  proxy?: String;
  path?: PathReplace;
  query?: QueryCustomization;

  @LazyGetter()
  get queriesOverwritten(): string[] {
    return this.query && this.query.overwrite ? _.map(this.query.overwrite, (v, k) => `${k}=${v}`) : [];
  }

  @LazyGetter()
  get queriesRemoved(): string[] {
    return (this.query && this.query.remove) || [];
  }
}

class Time {
  elapsed_sec: number;
  start: string;
  end: string;
}

export class DiffKeys {
  added: string[];
  changed: string[];
  removed: string[];
}

export class Trial {
  seq: number;
  name: string;
  headers: any;
  queries: any;
  form?: Object;
  json?: Object;
  one: ResponseSummary;
  other: ResponseSummary;
  method: HttpMethod;
  path: string;
  request_time: string;
  status: string;
  tags: string[];
  diff_keys?: DiffKeys;
  diffs_by_cognition?: { [key: string]: DiffKeys };

  propertyDiffsByCognition?: PropertyDiffsByCognition;
  attention?: string;

  hasResponse(): boolean {
    return this.one.file !== undefined && this.other.file !== undefined;
  }

  static toTsvHeader(): string {
    return [
      'Seq',
      'Name',
      'Status',
      'Path',
      'QueryString',
      'OriginQueryString',
      'tags',
      '[One] Status code',
      '[Other] Status code',
      '[One] Response sec',
      '[Other] Response sec',
      '[One] Byte',
      '[Other] Byte',
      '[One] Type',
      '[Other] Type',
      '[One] Content type',
      '[Other] Content type',
      'Request time',
    ].join('\t');
  }

  toTsvRecord(): string {
    return [
      this.seq,
      this.name,
      this.status,
      this.path,
      this.queryString,
      this.originQueryString,
      this.tags,
      this.one.status_code,
      this.other.status_code,
      this.one.response_sec,
      this.other.response_sec,
      this.one.byte,
      this.other.byte,
      this.one.type,
      this.other.type,
      this.one.content_type,
      this.other.content_type,
      this.localizedRequestTime.toISO({ includeOffset: false }),
    ].join('\t');
  }

  get originQueryString(): string {
    return this.one.url.split('?')[1];
  }

  get queryString(): string {
    return Object.keys(this.queries)
      .map(k => `${k}=${this.queries[k]}`)
      .join('&');
  }

  get responseSecDiff(): number {
    return Math.round((this.other.response_sec - this.one.response_sec) * 100) / 100;
  }

  get localizedRequestTime(): DateTime {
    return DateTime.fromISO(this.request_time);
  }
}

export class ResponseSummary {
  type: string;
  status_code: number;
  byte: number;
  response_sec: number;
  url: string;
  file?: string;
  prop_file?: string;
  content_type?: string;
}

export class Pair<T> {
  one: T;
  other: T;
}

export class Change<T> {
  previous: T;
  current: T;
}

export class EditorConfig {
  content: string;
  contentType: string;
  readOnly: boolean;
  theme?: string;
  minimap?: {
    enabled: boolean;
  };
}

export class DiffViewConfig {
  leftContent: string;
  leftContentType: string;
  rightContent: string;
  rightContentType: string;
  readOnly: boolean;
  sideBySide: boolean;
  theme?: string;
}

export class AwsConfiguration {
  region: string;
  bucket: string;
  table: string;
  prefix: string;
}

export class Row<T> {
  rowIndex: number;
  data: T;
}
