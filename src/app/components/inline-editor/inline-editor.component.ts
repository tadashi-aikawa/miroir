import {Component, Input, ViewChild, HostListener, EventEmitter, Output} from '@angular/core';
import {MdInputDirective, MdTextareaAutosize} from '@angular/material';

@Component({
    selector: 'app-inline-editor',
    styleUrls: ['../../../../node_modules/hover.css/css/hover.css'],
    template: `
        <div *ngIf="!editing" class="action-icon hvr-glow" (click)="onTextClick()">
            <span class="multi-line">{{value}}</span>
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
    @Output() onUpdate = new EventEmitter<string>();

    editing: boolean = false;
    iconVisibility: boolean = false;
    previousValue: string;

    @ViewChild(MdInputDirective) input;
    @ViewChild(MdTextareaAutosize) autosize;

    @HostListener('mouseover') private onMouseOver() {
        this.iconVisibility = true;
    }

    @HostListener('mouseleave') private onMouseLeave() {
        this.iconVisibility = false;
    }

    @HostListener('focusout') private onFocusOut() {
        this.editing = false;
        if (this.onUpdate !== null && this.previousValue !== this.value) {
            this.onUpdate.emit(this.value);
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
