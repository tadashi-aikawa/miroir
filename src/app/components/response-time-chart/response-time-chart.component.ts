import {Summary, Trial} from '../../models/models';
import {AfterViewInit, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import * as _ from 'lodash';
import {Marker, Options} from 'highcharts';


const statusToMarker = (status: number): Marker => {
    const statusHead: number = Math.floor(status / 100);
    const createMarker = (color: string): Marker =>
        ({enabled: true, fillColor: color, lineColor: 'gray', lineWidth: 1, radius: 4});

    return statusHead === 5 ? createMarker('red') :
        statusHead === 4 ? createMarker('yellow') :
            ({enabled: false});
};

@Component({
    selector: 'app-response-time-chart',
    template: `<div [ng2-highcharts]="chartOptions"></div>`
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
        return {
            chart: {
                zoomType: 'x'
            },
            title: {
                text: 'Response time'
            },
            yAxis: {
                title: {
                    text: 'sec'
                }
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
                        name: `${x.seq}. ${x.name} (${x.path}) [${x.status}]`,
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
                        name: `${x.seq}. ${x.name} (${x.path}) [${x.status}]`,
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
                        name: `${x.seq}. ${x.name} (${x.path}) [${x.status}]`,
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
