import {Component, EventEmitter, HostListener, Input, Output, ViewChild} from '@angular/core';
import {MdInputDirective, MdTextareaAutosize} from '@angular/material';
import {Change} from 'app/models/models';

@Component({
    selector: 'app-inline-editor',
    styleUrls: [
        './inline-editor.css',
        '../../../../node_modules/hover.css/css/hover.css'
    ],
    template: `
        <div *ngIf="!editing" class="action-icon hvr-glow" (click)="onTextClick()">
            <md-icon *ngIf="!value" class="icon-small">edit</md-icon>
            <span *ngIf="!markdown" class="multi-line">{{value}}</span>
            <markdown *ngIf="markdown" [data]="value"></markdown>
        </div>
        <md-input-container *ngIf="editing && type === 'single-line'">
            <input mdInput [(ngModel)]="value">
        </md-input-container>
        <md-input-container *ngIf="editing && type === 'multi-line'" style="width: 50%;">
            <textarea mdInput mdTextareaAutosize [(ngModel)]="value"></textarea>
        </md-input-container>
    `
})
export class InlineEditorComponent {

    @Input() value: string;
    @Input() type: 'single-line' | 'multi-line' = 'single-line';
    @Input() markdown: boolean = false;
    @Output() onUpdate = new EventEmitter<Change<string>>();

    editing: boolean = false;
    iconVisibility: boolean = false;
    previousValue: string;

    @ViewChild(MdInputDirective) input;
    @ViewChild(MdTextareaAutosize) autosize;

    //noinspection JSUnusedLocalSymbols
    @HostListener('mouseover')
    private onMouseOver() {
        this.iconVisibility = true;
    }

    //noinspection JSUnusedLocalSymbols
    @HostListener('mouseleave')
    private onMouseLeave() {
        this.iconVisibility = false;
    }

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
            if (this.type === 'multi-line') {
                this.autosize.resizeToFitContent();
            }
            this.input.focus();
        }, 1);
    }
}
