import {Component, EventEmitter, HostListener, Input, Output, ViewChild} from '@angular/core';
import {MdInputDirective, MdTextareaAutosize} from '@angular/material';
import {Change} from 'app/models/models';

@Component({
    selector: 'app-markdown-inline-editor',
    styleUrls: [
        './markdown-inline-editor.css',
        '../../../../node_modules/hover.css/css/hover.css'
    ],
    template: `
        <div *ngIf="!editing" class="action-icon hvr-glow" (click)="onTextClick()">
            <div *ngIf="value; then view else emptyView;"></div>

            <ng-template #view>
                <markdown [data]="value"></markdown>
            </ng-template>

            <ng-template #emptyView>
                <md-icon class="icon-small">edit</md-icon>
            </ng-template>
        </div>
        <div *ngIf="editing" style="display: flex;">
            <markdown [data]="value"></markdown>
            <md-input-container class="balloon-right" style="flex: 1">
                <div class="smart-padding">
                    <textarea mdInput mdTextareaAutosize [(ngModel)]="value"></textarea>
                </div>
            </md-input-container>
        </div>
    `
})
export class MarkdownInlineEditorComponent {

    @Input() value: string;
    @Output() onUpdate = new EventEmitter<Change<string>>();

    editing: boolean = false;
    previousValue: string;

    @ViewChild(MdInputDirective) input;
    @ViewChild(MdTextareaAutosize) autosize;

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

    private onTextClick() {
        this.previousValue = this.value;
        this.editing = true;
        setTimeout(() => {
            this.autosize.resizeToFitContent();
            this.input.focus();
        }, 1);
    }
}
