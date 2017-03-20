import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {MaterialModule} from '@angular/material';
import {Ng2SmartTableModule} from 'ng2-smart-table';
import {LocalStorageModule} from 'angular-2-local-storage';
import 'hammerjs';

import {AppComponent} from './app.component';
import {
    GeminiSummaryComponent, DetailDialogContent, HoverComponent, StatusCodeComponent,
    StatusComponent, DeleteConfirmDialogContent
} from './gemini-summary/gemini-summary.component';
import {MergeViewerComponent} from './merge-viewer/merge-viewer.component';

@NgModule({
    declarations: [
        AppComponent,
        GeminiSummaryComponent,
        MergeViewerComponent,
        DetailDialogContent,
        DeleteConfirmDialogContent,
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
        LocalStorageModule.withConfig({
            prefix: 'gemini-viewer',
            storageType: 'localStorage'
        })
    ],
    entryComponents: [
        DetailDialogContent,
        DeleteConfirmDialogContent,
        HoverComponent,
        StatusCodeComponent,
        StatusComponent
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
