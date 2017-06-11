import {Component, Input, Optional} from '@angular/core';
import {MdDialogRef} from '@angular/material';

@Component({
    template: `
        <h2 md-dialog-title>{{title}}</h2>
        <md-dialog-content>{{message}}</md-dialog-content>
        <md-dialog-actions>
            <div class="smart-padding-without-bottom">
                <button md-raised-button (click)="onClickOk()">OK</button>
                <button md-raised-button md-dialog-close>Cancel</button>
            </div>
        </md-dialog-actions>
    `,
})
export class ConfirmDialogComponent {
    @Input() title: string = 'Confirm';
    @Input() message: string;

    constructor(@Optional() public dialogRef: MdDialogRef<ConfirmDialogComponent>) {
    }

    onClickOk() {
        this.dialogRef.close(true);
    }
}
