import {Memoize} from 'lodash-decorators';
import {PropertyDiffs, Row, Summary, Trial} from '../../models/models';
import {Component, EventEmitter, Input, Output, Pipe, PipeTransform} from '@angular/core';
import * as _ from 'lodash';

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
            sortable: true,
            resizable: true,
            width: 175,
        },
        {
            headerName: "Count",
            field: "count",
            sortable: true,
            resizable: true,
            width: 100,
        },
    ];

    checkedAlreadyColumnDefs = [
        {
            headerName: "Title",
            field: "title",
            sortable: true,
            resizable: true,
            width: 350,
        },
        {
            headerName: "Count",
            field: "count",
            sortable: true,
            resizable: true,
            width: 100,
        },
    ];

    ignoredColumnDefs = [
        {
            headerName: "Title",
            field: "title",
            sortable: true,
            resizable: true,
            width: 350,
        },
        {
            headerName: "Count",
            field: "count",
            sortable: true,
            resizable: true,
            width: 100,
        },
    ];

    ignoredPathDefs = [
        {
            headerName: "Path",
            field: "title",
            filter: true,
            sortable: true,
            resizable: true,
        },
        {
            headerName: "Count",
            field: "count",
            filter: true,
            sortable: true,
            resizable: true,
        },
        {
            headerName: "Same",
            field: "status.same",
            filter: true,
            sortable: true,
            resizable: true,
        },
        {
            headerName: "Different",
            field: "status.different",
            filter: true,
            sortable: true,
            resizable: true,
        },
        {
            headerName: "Failure",
            field: "status.failure",
            filter: true,
            sortable: true,
            resizable: true,
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
            .groupBy((t: Trial) => t.attention)
            .mapValues<DiffSummary>((xs: Trial[]) => ({
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
            .mapValues<DiffSummary>(xs => ({
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
            .mapValues<DiffSummary>(xs => ({
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
            .groupBy((t: Trial) => t.path)
            .mapValues<PathSummary>((xs: Trial[]) => ({
                title: xs[0].path,
                count: xs.length,
                status: _(xs)
                    .groupBy((x: Trial) => x.status)
                    .mapValues<number>((x: Trial[]) => x.length)
                    .value() as { same: number, different: number, failure: number },
                trials: xs,
            }))
            .values()
            .value();
    }
}
