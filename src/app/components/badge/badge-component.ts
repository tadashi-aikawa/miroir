import {Component, Input} from '@angular/core';

type BadgeKind = "fine" | "warning" | "danger" | "disabled";
type BadgeSize = "normal" | "small" | "minimum";

@Component({
    selector: 'app-badge',
    styleUrls: ['badge-component.css'],
    template: `
        <span [ngClass]="calculateClasses()">
            <ng-content></ng-content>
        </span>
    `
})
export class BadgeComponent {
    @Input() kind: BadgeKind = "disabled";
    @Input() size: BadgeSize = "normal";

    calculateClasses() {
        return [
            "badge",
            `badge-${this.kind}`,
            `badge-${this.size}`
        ]
    }
}

@Component({
    selector: 'app-badge-list',
    styleUrls: ['badge-component.css'],
    template: `
        <div class="badge-list">
            <ng-content></ng-content>
        </div>
    `
})
export class BadgeListComponent {}
