import {Component, Input, Optional} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    template: `
        <h2 mat-dialog-title>{{title}}</h2>
        <mat-dialog-content>{{message}}</mat-dialog-content>
        <mat-dialog-actions>
            <div class="smart-padding-without-bottom">
                <button mat-raised-button (click)="onClickOk()">OK</button>
                <button mat-raised-button mat-dialog-close>Cancel</button>
            </div>
        </mat-dialog-actions>
    `,
})
export class ConfirmDialogComponent {
    @Input() title = 'Confirm';
    @Input() message: string;

    constructor(@Optional() public dialogRef: MatDialogRef<ConfirmDialogComponent>) {
    }

    onClickOk() {
        this.dialogRef.close(true);
    }
}
