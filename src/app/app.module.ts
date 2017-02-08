import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {MaterialModule} from '@angular/material';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import 'hammerjs';

import {AppComponent} from './app.component';
import {GeminiSummaryComponent} from './gemini-summary/gemini-summary.component';

@NgModule({
    declarations: [
        AppComponent,
        GeminiSummaryComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        MaterialModule.forRoot(),
        Ng2SmartTableModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
