import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {MaterialModule} from '@angular/material';
import {Ng2SmartTableModule} from 'ng2-smart-table';
import {LocalStorageModule} from 'angular-2-local-storage';
import {SelectModule} from 'ng-select';
import {HotkeyModule} from 'angular2-hotkeys';
import {Ng2HighchartsModule} from 'ng2-highcharts';
import {ExpansionPanelsModule} from 'ng2-expansion-panels';

import 'hammerjs';

import {AppComponent} from './app.component';
import {RootComponent} from './components/root/root.component';
import {
    DeleteConfirmDialogComponent,
    EditorDialogComponent,
    HoverComponent,
    StatusCodeComponent,
    StatusComponent,
    SummaryComponent
} from './components/summary/summary.component';
import {MergeViewerComponent} from './components/merge-viewer/merge-viewer.component';
import {ResponseTimeChartComponent} from './components/response-time-chart/response-time-chart.component';
import {CommonModule, HashLocationStrategy, LocationStrategy} from '@angular/common';
import {DetailDialogComponent} from './components/detail-dialog/detail-dialog.component';
import {EditorComponent} from './components/editor/editor.component';
import {AwsService} from './services/aws-service';
import {AuthGuard} from './components/guard/auth.guard';
import {LoginComponent} from './components/login/login.component';

const appRoutes: Routes = [
    {path: 'login', component: LoginComponent},
    {path: '', component: RootComponent, canActivate: [AuthGuard]},
    {path: 'report/:searchWord', component: RootComponent, canActivate: [AuthGuard]},
    {path: 'report/:searchWord/:hashKey', component: RootComponent, canActivate: [AuthGuard]},
    {path: 'report/:searchWord/:hashKey/:seq', component: RootComponent, canActivate: [AuthGuard]}
];

@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
        RootComponent,
        SummaryComponent,
        MergeViewerComponent,
        DetailDialogComponent,
        DeleteConfirmDialogComponent,
        EditorDialogComponent,
        EditorComponent,
        HoverComponent,
        StatusCodeComponent,
        StatusComponent,
        ResponseTimeChartComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        RouterModule.forRoot(appRoutes),
        FormsModule,
        HttpModule,
        MaterialModule,
        Ng2SmartTableModule,
        SelectModule,
        CommonModule,
        Ng2HighchartsModule,
        ExpansionPanelsModule,
        HotkeyModule.forRoot({disableCheatSheet: true}),
        LocalStorageModule.withConfig({
            prefix: 'jumeaux-viewer',
            storageType: 'localStorage'
        })
    ],
    entryComponents: [
        DetailDialogComponent,
        EditorComponent,
        DeleteConfirmDialogComponent,
        EditorDialogComponent,
        HoverComponent,
        StatusCodeComponent,
        StatusComponent
    ],
    providers: [
        AwsService,
        AuthGuard,
        {provide: LocationStrategy, useClass: HashLocationStrategy}
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
