import {Memoize} from 'lodash-decorators';
import {PropertyDiffs, Row, Summary, Trial} from '../../models/models';
import {Component, Input, Pipe, PipeTransform, Output, EventEmitter, SimpleChanges, OnChanges} from '@angular/core';
import * as _ from 'lodash';
import {Dictionary} from 'lodash';

@Component({
    selector: 'app-analytics',
    templateUrl: './analytics.component.html',
    styleUrls: [
        '../../../../node_modules/hover.css/css/hover.css',
    ],
})
export class AnalyticsComponent {
    @Input() summary: Summary;
    @Input() trials: Trial[];

    @Output() onClickTrials = new EventEmitter<Trial[]>();

    private gridColumnApi;

    handleGridReady(params) {
        this.gridColumnApi = params.columnApi;
        this.fitColumnWidths();
    }

    handleModelUpdated() {
        this.fitColumnWidths();
    }

    fitColumnWidths() {
        // Not initialized case
        if (!this.gridColumnApi) {
            return
        }

        this.gridColumnApi.autoSizeColumns(
            this.gridColumnApi.getAllColumns().map(x => x.colId)
        );
    }

    // attentionSummaries: AttentionSummary[];
    attentionColumnDefs = [
        {
            headerName: "Title",
            field: "title",
            width: 175,
        },
        {
            headerName: "Count",
            field: "count",
            width: 100,
        },
    ];

    checkedAlreadyColumnDefs = [
        {
            headerName: "Title",
            field: "title",
            width: 350,
        },
        {
            headerName: "Count",
            field: "count",
            width: 100,
        },
    ];

    ignoredColumnDefs = [
        {
            headerName: "Title",
            field: "title",
            width: 350,
        },
        {
            headerName: "Count",
            field: "count",
            width: 100,
        },
    ];

    ignoredPathDefs = [
        {
            headerName: "Path",
            field: "title",
        },
        {
            headerName: "Count",
            field: "count",
        },
        {
            headerName: "Same",
            field: "status.same",
        },
        {
            headerName: "Different",
            field: "status.different",
        },
        {
            headerName: "Failure",
            field: "status.failure",
        },
    ];

    get checkedAlreadyTrials(): Trial[] {
        return this.filterCheckedAlreadyTrials(this.trials);
    }

    @Memoize
    private filterCheckedAlreadyTrials(trials: Trial[]): Trial[] {
        return _(trials)
            .filter((t: Trial) =>
                t.propertyDiffsByCognition &&
                t.propertyDiffsByCognition.getNonEmptyCheckedAlready().length > 0
            )
            .value();
    }

    handleDiffRowClicked(row: Row<DiffSummary>) {
        this.onClickTrials.emit(row.data.trials);
    }

    handlePathRowClicked(row: Row<PathSummary>) {
        this.onClickTrials.emit(row.data.trials);
    }

    handleCheckedAlreadyBatchClicked(trials: Trial[]) {
        this.onClickTrials.emit(trials);
    }

    stopPropagation(event) {
        event.stopPropagation();
    }
}

interface PathSummary {
    title: string,
    count: number,
    status: {
        same: number,
        different: number,
        failure: number,
    }
    trials: Trial[]
}

interface DiffSummary {
    title: string,
    count: number,
    image?: string,
    link?: string,
    trials: Trial[]
}

type DiffSummaryWip = Partial<DiffSummary> & { trial: Trial }

@Pipe({name: 'toAttention'})
export class ToAttentionPipe implements PipeTransform {
    transform(trials: Trial[]): DiffSummary[] {
        return _(trials)
            .filter((t: Trial) => !!t.attention)
            .groupBy<Trial>((t: Trial) => t.attention)
            .mapValues<Dictionary<Trial[]>, DiffSummary>((xs: Trial[]) => ({
                title: xs[0].attention,
                count: xs.length,
                trials: xs,
            }))
            .values()
            .value();
    }
}

@Pipe({name: 'toCheckedAlreadyDiffSummary'})
export class ToCheckedAlreadyDiffSummaryPipe implements PipeTransform {
    transform(trials: Trial[]): DiffSummary[] {
        return _(trials)
            .filter((t: Trial) =>
                t.propertyDiffsByCognition &&
                t.propertyDiffsByCognition.getNonEmptyCheckedAlready().length > 0
            )
            .flatMap((t: Trial) =>
                t.propertyDiffsByCognition.checkedAlready.map<DiffSummaryWip>(
                    (pd: PropertyDiffs) => ({
                        title: pd.title,
                        image: pd.image,
                        link: pd.link,
                        trial: t
                    })
                )
            )
            .groupBy((pd: DiffSummaryWip) => pd.title)
            .mapValues<Dictionary<DiffSummaryWip[]>, DiffSummary>(xs => ({
                title: xs[0].title,
                image: xs[0].image,
                link: xs[0].link,
                count: xs.length,
                trials: xs.map(x => x.trial)
            }))
            .values()
            .value();
    }
}

@Pipe({name: 'toIgnoredDiffSummary'})
export class ToIgnoredDiffSummaryPipe implements PipeTransform {
    transform(trials: Trial[]): DiffSummary[] {
        return _(trials)
            .filter((t: Trial) =>
                t.propertyDiffsByCognition &&
                t.propertyDiffsByCognition.getNonEmptyIgnored().length > 0
            )
            .flatMap((t: Trial) => t.propertyDiffsByCognition.ignored.map<DiffSummaryWip>(
                (pd: PropertyDiffs) => ({
                    title: pd.title,
                    image: pd.image,
                    link: pd.link,
                    trial: t
                })
            ))
            .groupBy((xs: DiffSummaryWip) => xs.title)
            .mapValues<Dictionary<DiffSummaryWip[]>, DiffSummary>(xs => ({
                title: xs[0].title,
                image: xs[0].image,
                link: xs[0].link,
                count: xs.length,
                trials: xs.map(x => x.trial)
            }))
            .values()
            .value();
    }
}

@Pipe({name: 'toPath'})
export class ToPathPipe implements PipeTransform {
    transform(trials: Trial[]): PathSummary[] {
        return _(trials)
            .groupBy<Trial>((t: Trial) => t.path)
            .mapValues<Dictionary<Trial[]>, PathSummary>((xs: Trial[]) => ({
                title: xs[0].path,
                count: xs.length,
                status: _(xs)
                    .groupBy<Trial>((x: Trial) => x.status)
                    .mapValues<Dictionary<Trial[]>, number>((x: Trial[]) => x.length)
                    .value() as { same: number, different: number, failure: number },
                trials: xs,
            }))
            .values()
            .value();
    }
}
