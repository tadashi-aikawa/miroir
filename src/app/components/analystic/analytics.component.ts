import {PropertyDiffs, Summary, Trial} from '../../models/models';
import {Component, Input, Pipe, PipeTransform, Output, EventEmitter} from '@angular/core';
import * as _ from 'lodash';
import {Dictionary} from 'lodash';

@Component({
    selector: 'app-analytics',
    templateUrl: './analytics.component.html',
    styleUrls: [
        './analytics.css',
    ],
})
export class AnalyticsComponent {
    @Input() summary: Summary;
    @Input() trials: Trial[];

    @Output() onClickTrials = new EventEmitter<Trial[]>();

    onClickRow(trials: Trial[]) {
        this.onClickTrials.emit(trials);
    }

    stopPropagation(event) {
        event.stopPropagation();
    }
}

interface AttentionSummary {
    title: string,
    count: number,
    trials: Trial[]
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
    image: string,
    link: string,
    count: number,
    trials: Trial[]
}

type DiffSummaryWip = Partial<DiffSummary> & {trial: Trial}

@Pipe({name: 'toAttention'})
export class ToAttentionPipe implements PipeTransform {
    transform(trials: Trial[]): AttentionSummary[] {
        return _(trials)
            .filter<Trial>((t: Trial) => t.attention)
            .groupBy<Trial>((t: Trial) => t.attention)
            .map<Trial[], AttentionSummary>((xs: Trial[]) => ({
                title: xs[0].attention,
                count: xs.length,
                trials: xs,
            }))
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
            .map<(DiffSummaryWip)[], DiffSummary>(xs => ({
                title: xs[0].title,
                image: xs[0].image,
                link: xs[0].link,
                count: xs.length,
                trials: xs.map(x => x.trial)
            }))
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
            .map<(DiffSummaryWip)[], DiffSummary>(xs => ({
                title: xs[0].title,
                image: xs[0].image,
                link: xs[0].link,
                count: xs.length,
                trials: xs.map(x => x.trial)
            }))
            .value();
    }
}

@Pipe({name: 'toPath'})
export class ToPathPipe implements PipeTransform {
    transform(trials: Trial[]): PathSummary[] {
        return _(trials)
            .groupBy<Trial>((t: Trial) => t.path)
            .map<Trial[], PathSummary>((xs: Trial[]) => ({
                title: xs[0].path,
                count: xs.length,
                status: _(xs)
                    .groupBy<Trial>((x: Trial) => x.status)
                    .mapValues<Dictionary<Trial[]>, number>((x: Trial[]) => x.length)
                    .value() as {same: number, different: number, failure: number},
                trials: xs,
            }))
            .value();
    }
}
