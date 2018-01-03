import {Component, EventEmitter, HostListener, Input, Output} from '@angular/core';
import {Change} from 'app/models/models';
import {hasContents} from "../../utils/regexp";

@Component({
    selector: 'app-inline-editor',
    styleUrls: [
        '../../../../node_modules/hover.css/css/hover.css'
    ],
    template: `
        <div *ngIf="!editing" class="action-icon hvr-glow" (click)="onTextClick()">
            <div *ngIf="value | hasContents; then view else emptyView;"></div>

            <ng-template #view>
                <span>{{value}}</span>
            </ng-template>

            <ng-template #emptyView>
                <mat-icon class="icon-small">edit</mat-icon>
            </ng-template>
        </div>
        <mat-form-field *ngIf="editing">
            <input id="edit-field" matInput required [(ngModel)]="value">
            <span class="error-message-small" *ngIf="value | emptyContents">
                <mat-icon>warning</mat-icon> Required!!
            </span>
        </mat-form-field>
    `
})
export class InlineEditorComponent {

    @Input() value: string;
    @Output() onUpdate = new EventEmitter<Change<string>>();

    editing = false;
    previousValue: string;

    //noinspection JSUnusedLocalSymbols
    @HostListener('focusout')
    private onFocusOut() {
        this.editing = false;
        if (!hasContents(this.value)) {
            this.value = this.previousValue;
            return;
        }

        if (this.onUpdate !== null && this.previousValue !== this.value) {
            this.onUpdate.emit({
                previous: this.previousValue,
                current: this.value
            });
        }
    }

    onTextClick() {
        this.previousValue = this.value;
        this.editing = true;
        setTimeout(() => {
            document.getElementById('edit-field').focus();
        }, 1);
    }
}
