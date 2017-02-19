import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {MaterialModule} from '@angular/material';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import 'hammerjs';

import {AppComponent} from './app.component';
import {GeminiSummaryComponent, DialogContent} from './gemini-summary/gemini-summary.component';
import {MergeViewerComponent} from './merge-viewer/merge-viewer.component';

@NgModule({
    declarations: [
        AppComponent,
        GeminiSummaryComponent,
        MergeViewerComponent,
        DialogContent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        MaterialModule,
        Ng2SmartTableModule
    ],
    entryComponents: [DialogContent],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
