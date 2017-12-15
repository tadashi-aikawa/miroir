import {Component, EventEmitter, HostListener, Input, Output, ViewChild} from '@angular/core';
import {MatFormField} from '@angular/material';
import {Change} from 'app/models/models';

@Component({
    selector: 'app-inline-editor',
    styleUrls: [
        '../../../../node_modules/hover.css/css/hover.css'
    ],
    template: `
        <div *ngIf="!editing" class="action-icon hvr-glow" (click)="onTextClick()">
            <div *ngIf="value; then view else emptyView;"></div>

            <ng-template #view>
                <span>{{value}}</span>
            </ng-template>

            <ng-template #emptyView>
                <mat-icon class="icon-small">edit</mat-icon>
            </ng-template>
        </div>
        <mat-form-field *ngIf="editing" style="flex-grow: 1;">
            <input mdInput [(ngModel)]="value">
        </mat-form-field>
    `
})
export class InlineEditorComponent {

    @Input() value: string;
    @Output() onUpdate = new EventEmitter<Change<string>>();

    editing = false;
    previousValue: string;

    @ViewChild(MatFormField) input;

    //noinspection JSUnusedLocalSymbols
    @HostListener('focusout')
    private onFocusOut() {
        this.editing = false;
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
            this.input.focus();
        }, 1);
    }
}
