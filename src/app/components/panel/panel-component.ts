import {Component, Input} from '@angular/core';

type PanelKind = "primary";
type PanelTitleFont =  "normal" | "small";

@Component({
    selector: 'app-panel',
    styleUrls: ['panel-component.css'],
    template: `        
        <div [ngClass]="calculateTitleClasses()">
            <div *ngIf="url; then ahref else text;"></div>
            <ng-template #ahref>
                <a [href]="url" target="_blank">{{title}}</a>
            </ng-template>
            <ng-template #text>
                {{title}}
            </ng-template>
        </div>
        <div [ngClass]="calculateBodyClasses()">
            <ng-content></ng-content>
        </div>
    `
})
export class PanelComponent {
    @Input() kind: PanelKind = "primary";
    @Input() titleFont: PanelTitleFont = "normal";
    @Input() url: string;
    @Input() title: string;

    calculateTitleClasses() {
        return [
            "panel-center",
            `panel-title-${this.titleFont}`,
            `panel-title-${this.kind}`,
        ]
    }

    calculateBodyClasses() {
        return [
            "panel-body",
            `panel-body-${this.kind}`,
        ]
    }
}
