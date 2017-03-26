import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {MaterialModule} from '@angular/material';
import {Ng2SmartTableModule} from 'ng2-smart-table/ng2-smart-table';
import {LocalStorageModule} from 'angular-2-local-storage';
import {SelectModule} from 'ng-select';
import {HotkeyModule} from 'angular2-hotkeys';
import 'hammerjs';

import {AppComponent} from './app.component';
import {
    GeminiSummaryComponent, DetailDialogComponent, HoverComponent, StatusCodeComponent,
    StatusComponent, DeleteConfirmDialogComponent
} from './gemini-summary/gemini-summary.component';
import {MergeViewerComponent} from './merge-viewer/merge-viewer.component';
import {CommonModule} from '@angular/common';

@NgModule({
    declarations: [
        AppComponent,
        GeminiSummaryComponent,
        MergeViewerComponent,
        DetailDialogComponent,
        DeleteConfirmDialogComponent,
        HoverComponent,
        StatusCodeComponent,
        StatusComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        MaterialModule,
        Ng2SmartTableModule,
        SelectModule,
        CommonModule,
        HotkeyModule.forRoot(),
        LocalStorageModule.withConfig({
            prefix: 'gemini-viewer',
            storageType: 'localStorage'
        })
    ],
    entryComponents: [
        DetailDialogComponent,
        DeleteConfirmDialogComponent,
        HoverComponent,
        StatusCodeComponent,
        StatusComponent
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
