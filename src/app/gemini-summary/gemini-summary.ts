export class ReportRow {
    hashKey: string;
    title: string;
    sameCount: number;
    differentCount: number;
    oneHost: string;
    otherHost: string;
    start: string;
    end: string;
}

export class Summary {
  one: AccessPoint;
  other: AccessPoint;
  time: Time;
}

class AccessPoint {
  host: string;
  proxy?: String;
}

class Time {
  elapsed_sec: number;
  start: string;
  end: string;
}


