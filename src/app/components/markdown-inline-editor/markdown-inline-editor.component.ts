import {Component, EventEmitter, HostListener, Input, Output, ViewChild} from '@angular/core';
import {trigger, transition, style, animate} from '@angular/animations';
import {MdDialog, MdInputDirective, MdTextareaAutosize} from '@angular/material';
import {Change} from 'app/models/models';
import {Hotkey, HotkeysService} from 'angular2-hotkeys';
import {ConfirmDialogComponent} from "app/components/dialogs/confirm-dialog/confirm-dialog.component";

@Component({
    selector: 'app-markdown-inline-editor',
    styleUrls: [
        './markdown-inline-editor.css',
        '../../../../node_modules/hover.css/css/hover.css'
    ],
    animations: [
        trigger(
            'feed',
            [
                transition(':enter', [
                    style({opacity: 0}),
                    animate('250ms', style({opacity: 1}))
                ]),
                transition(':leave', [
                    style({opacity: 1}),
                    animate('250ms', style({opacity: 0}))
                ])
            ]
        )
    ],
    template: `        
        <div style="display: flex;">
            <div *ngIf="!editing" class="action-icon hvr-glow" (click)="onTextClick()">
                <div *ngIf="value; then view else emptyView;"></div>

                <ng-template #view>
                    <markdown [data]="value"></markdown>
                </ng-template>

                <ng-template #emptyView>
                    <md-icon class="icon-small">edit</md-icon>
                </ng-template>
            </div>
            
            <markdown *ngIf="value && editing" [data]="value"></markdown>

            <md-input-container *ngIf="editing" [@feed] class="balloon-right" style="flex: 1">
                <div class="smart-padding-xsmall">
                    <textarea mdInput mdTextareaAutosize [(ngModel)]="value"></textarea>
                </div>
                <hr/>
                <div class="smart-padding-left-small">
                    <md-icon class="action-icon-large hvr-buzz-out"
                             style="font-size: 22px; margin-left: 10px;"
                             mdTooltip="Save (Ctrl+Enter)"
                             (click)="update()">
                        check
                    </md-icon>
                    <md-icon class="action-icon-large hvr-buzz-out"
                             style="font-size: 22px; margin-left: 10px;"
                             mdTooltip="Cancel (ESC)"
                             (click)="cancel()">
                        cancel
                    </md-icon>
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

    constructor(private _hotkeysService: HotkeysService,
                private _dialog: MdDialog) {
        // XXX: _hotkeysService.remove(Hotkey[]) is not worked (maybe issues)
        _hotkeysService.hotkeys.splice(0).forEach(x => _hotkeysService.remove(x));

        _hotkeysService.add([
            new Hotkey('ctrl+enter', () => {this.update(); return false; }, ['TEXTAREA'], 'Update.'),
            new Hotkey('esc', () => {this.cancel(); return false; }, ['TEXTAREA'], 'Update.')
        ]);
    }

    private update() {
        this.editing = false;
        if (this.onUpdate !== null && this.previousValue !== this.value) {
            this.onUpdate.emit({
                previous: this.previousValue,
                current: this.value
            });
        }
    }

    private cancel() {
        if (this.previousValue !== this.value) {
            const dialogRef = this._dialog.open(ConfirmDialogComponent);
            dialogRef.componentInstance.message = 'Your changes will be broken.. OK?';
            dialogRef.afterClosed().subscribe((cancel: boolean) => {
                if (cancel) {
                    this.editing = false;
                    this.value = this.previousValue;
                }
            })
        } else {
            this.editing = false;
            this.value = this.previousValue;
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
