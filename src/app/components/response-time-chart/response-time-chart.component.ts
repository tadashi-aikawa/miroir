import {Summary, Trial} from '../../models/models';
import {AfterViewInit, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import * as _ from 'lodash';
import {Marker, Options} from 'highcharts';
import * as Maths from '../../utils/maths';


const statusToMarker = (status: number): Marker => {
    const statusHead: number = Math.floor(status / 100);
    const createMarker = (color: string): Marker =>
        ({enabled: true, fillColor: color, lineColor: 'gray', lineWidth: 1, radius: 4});

    return statusHead === 5 ? createMarker('red') :
        statusHead === 4 ? createMarker('yellow') :
            ({enabled: false});
};

const trialToTitle = (x: Trial): string =>
  `${x.seq}. ${x.name} (${x.path}) [${x.status}] <br/><span style="font-size: 75%">${x.request_time}</span>`


@Component({
    selector: 'app-response-time-chart',
    template: `
        <div [ng2-highcharts]="chartOptions"></div>
    `
})
export class ResponseTimeChartComponent implements OnChanges, AfterViewInit {
    @Input() summary: Summary;
    @Input() trials: Trial[];

    @Output() onPointClick = new EventEmitter<number>();

    chartOptions: Options;

    ngOnChanges(changes: SimpleChanges): void {
        if (!_.isEqual(changes.trials.previousValue, changes.trials.currentValue)) {
            this.chartOptions = this.createChartOptions(this.summary, changes.trials.currentValue);
        }
    }

    ngAfterViewInit(): void {
        this.chartOptions = this.createChartOptions(this.summary, this.trials);
    }

    private createChartOptions(summary: Summary, trials: Trial[]): Options {
        const oneAverage: number = _.meanBy(trials, (x: Trial) => x.one.response_sec);
        const otherAverage: number = _.meanBy(trials, (x: Trial) => x.other.response_sec);

        return {
            chart: {
                zoomType: 'xy'
            },
            title: {
                text: 'Response time'
            },
            yAxis: {
                title: {
                    text: 'sec'
                },
                plotLines: [
                    {
                        dashStyle: 'dot',
                        color: 'rgba(100,100,255,0.5)',
                        value: oneAverage,
                        width: 2,
                        zIndex: 2,
                        label: {
                            text: `${summary.one.name} average ${Maths.round(oneAverage, 3)}`,
                            style: {
                                color: 'rgba(100,100,255,0.75)'
                            },
                            align: 'right'
                        }
                    },
                    {
                        dashStyle: 'dot',
                        color: 'rgba(255,100,100,0.5)',
                        value: otherAverage,
                        width: 2,
                        zIndex: 2,
                        label: {
                            text: `${summary.other.name} average ${Maths.round(otherAverage, 3)}`,
                            style: {
                                color: 'rgba(255,100,100,0.75)'
                            },
                            align: 'right'
                        }
                    }
                ]
            },
            tooltip: {
                shared: true
            },
            plotOptions: {
                spline: {
                    marker: {
                        symbol: 'circle'
                    },
                    lineWidth: 2,
                    pointStart: 1
                },
                area: {
                    marker: {
                        enabled: false
                    },
                    lineWidth: 1,
                    pointStart: 1
                },
                series: {
                    turboThreshold: 10000
                }
            },
            series: [
                {
                    name: summary.one.name,
                    color: 'rgba(100,100,255,0.5)',
                    type: 'spline',
                    data: trials.map(x => ({
                        y: x.one.response_sec,
                        name: trialToTitle(x),
                        marker: statusToMarker(x.one.status_code),
                        events: {
                            click: e => {
                                this.onPointClick.emit(e.point.index);
                                return false;
                            }
                        }
                    }))
                },
                {
                    name: summary.other.name,
                    color: 'rgba(255,100,100,0.5)',
                    type: 'spline',
                    data: trials.map(x => ({
                        y: x.other.response_sec,
                        name: trialToTitle(x),
                        marker: statusToMarker(x.other.status_code),
                        events: {
                            click: e => {
                                this.onPointClick.emit(e.point.index);
                                return false;
                            }
                        }
                    }))
                },
                {
                    name: 'Numerical difference',
                    color: 'rgba(100,255,100,0.5)',
                    type: 'area',
                    data: trials.map(x => ({
                        y: x.responseSecDiff,
                        name: trialToTitle(x),
                        events: {
                            click: e => {
                                this.onPointClick.emit(e.point.index);
                                return false;
                            }
                        }
                    }))
                }
            ]
        };
    }

}
