import {PropertyDiffs, Summary, Trial} from '../../models/models';
import {Component, Input, Pipe, PipeTransform} from '@angular/core';
import * as _ from 'lodash';

@Component({
    selector: 'app-analystic',
    template: `
        <div>
            <h2>Checked Already</h2>
            <md-list>
                <md-list-item *ngFor="let c of (this.trials | toCheckedAlreadyDiffSummary)">
                    {{c.title}}
                    <md-chip color="primary" selected="true">{{c.trials.length}}</md-chip>
                </md-list-item>
            </md-list>
            <h2>Ignored</h2>
            <md-list>
                <md-list-item *ngFor="let c of (this.trials | toIgnoredDiffSummary)">
                    {{c.title}}
                    <md-chip color="primary" selected="true">{{c.trials.length}}</md-chip>
                </md-list-item>
            </md-list>
        </div>
    `
})
export class AnalyticsComponent {
    @Input() summary: Summary;
    @Input() trials: Trial[];
}


interface DiffSummary {
    title: string,
    image: string,
    trials: Trial[]
}

@Pipe({name: 'toCheckedAlreadyDiffSummary'})
export class ToCheckedAlreadyDiffSummaryPipe implements PipeTransform {
    transform(trials: Trial[]): DiffSummary[] {
        return _(trials)
            .filter((t: Trial) =>
                t.propertyDiffsByCognition &&
                t.propertyDiffsByCognition.getNonEmptyCheckedAlready().length > 0
            )
            .flatMap((t: Trial) => _.map(
                t.propertyDiffsByCognition.checkedAlready,
                (pd: PropertyDiffs) => ({
                    title: pd.title,
                    image: pd.image,
                    link: pd.link,
                    trial: t
                })
            ))
            .groupBy((pd: PropertyDiffs) => pd.title)
            .map(xs => ({
                title: xs[0].title,
                image: xs[0].image,
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
            .flatMap((t: Trial) => _.map(
                t.propertyDiffsByCognition.ignored,
                (pd: PropertyDiffs) => ({
                    title: pd.title,
                    image: pd.image,
                    link: pd.link,
                    trial: t
                })
            ))
            .groupBy(xs => xs.title)
            .map(xs => ({
                title: xs[0].title,
                image: xs[0].image,
                trials: xs.map(x => x.trial)
            }))
            .value();
    }
}