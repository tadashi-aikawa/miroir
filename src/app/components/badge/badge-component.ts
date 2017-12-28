import {Component, Input} from '@angular/core';

type BadgeKind = "fine" | "warning" | "danger" | "disabled";

@Component({
    selector: 'app-badge',
    styleUrls: ['badge-component.css'],
    template: `
        <span [ngClass]="{'badge': true, 'badge-compact': compact}">
            <ng-content></ng-content>
        </span>
    `
})
export class BadgeComponent {
    @Input() kind: BadgeKind;
    @Input() compact: boolean = false;
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
