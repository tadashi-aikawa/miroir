import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {animate, style, transition, trigger} from '@angular/animations';
import {MatDialog, MatTextareaAutosize} from '@angular/material';
import {Change} from 'app/models/models';
import {Hotkey, HotkeysService} from 'angular2-hotkeys';
import {ConfirmDialogComponent} from 'app/components/dialogs/confirm-dialog/confirm-dialog.component';

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
                    <mat-icon class="icon-small">edit</mat-icon>
                </ng-template>
            </div>

            <markdown *ngIf="value && editing" [data]="value"></markdown>

            <mat-form-field *ngIf="editing" [@feed] class="balloon-right" style="flex: 1">
                <div class="smart-padding-xsmall">
                    <textarea id="edit-area" matInput matTextareaAutosize [(ngModel)]="value"></textarea>
                </div>
                <hr/>
                <div class="smart-padding-left-small">
                    <mat-icon class="action-icon-large hvr-buzz-out"
                             style="font-size: 22px; margin-left: 10px;"
                             title="Save (Ctrl+Enter)"
                             (click)="update()">
                        check
                    </mat-icon>
                    <mat-icon class="action-icon-large hvr-buzz-out"
                             style="font-size: 22px; margin-left: 10px;"
                             title="Cancel (ESC)"
                             (click)="cancel()">
                        cancel
                    </mat-icon>
                </div>
            </mat-form-field>
        </div>
    `
})
export class MarkdownInlineEditorComponent {

    @Input() value: string;
    @Output() onUpdate = new EventEmitter<Change<string>>();

    editing = false;
    previousValue: string;

    @ViewChild(MatTextareaAutosize) autosize;

    constructor(private _hotkeysService: HotkeysService,
                private _dialog: MatDialog) {
        // XXX: _hotkeysService.remove(Hotkey[]) is not worked (maybe issues)
        _hotkeysService.hotkeys.splice(0).forEach(x => _hotkeysService.remove(x));

        _hotkeysService.add([
            new Hotkey('ctrl+enter', () => {
                this.update();
                return false;
            }, ['TEXTAREA'], 'Update.'),
            new Hotkey('esc', () => {
                this.cancel();
                return false;
            }, ['TEXTAREA'], 'Update.')
        ]);
    }

    update() {
        this.editing = false;
        if (this.onUpdate !== null && this.previousValue !== this.value) {
            this.onUpdate.emit({
                previous: this.previousValue,
                current: this.value
            });
        }
    }

    cancel() {
        if (this.previousValue !== this.value) {
            const dialogRef = this._dialog.open(ConfirmDialogComponent);
            dialogRef.componentInstance.message = 'Your changes will be broken.. OK?';
            dialogRef.afterClosed().subscribe((cancel: boolean) => {
                if (cancel) {
                    this.editing = false;
                    this.value = this.previousValue;
                }
            });
        } else {
            this.editing = false;
            this.value = this.previousValue;
        }
    }

    onTextClick() {
        this.previousValue = this.value;
        this.editing = true;
        setTimeout(() => {
            this.autosize.resizeToFitContent();
            document.getElementById('edit-area').focus();
        }, 1);
    }
}
