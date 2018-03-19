import {Component, Input} from '@angular/core';

type BadgeKind = 'fine' | 'warning' | 'danger' | 'disabled' | 'primary';
type BadgeSize = 'normal' | 'small' | 'tiny' | 'minimum';
type BadgeCursor = 'default' | 'pointer';

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
    @Input() kind: BadgeKind = 'disabled';
    @Input() size: BadgeSize = 'normal';
    @Input() cursor: BadgeCursor = 'default';

    calculateClasses() {
        return [
            'badge',
            `badge-${this.kind}`,
            `badge-${this.size}`,
            `badge-cursor-${this.cursor}`
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
