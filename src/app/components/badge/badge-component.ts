import {Component, Input} from '@angular/core';

type BadgeKind = "fine" | "warning" | "danger" | "disabled";

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
    @Input() kind: BadgeKind;
    @Input() compact: boolean = false;

    calculateClasses() {
        return [
            "badge",
            `badge-${this.kind || "disabled"}`,
            `badge-${this.compact ? "compact" : "normal"}`
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
