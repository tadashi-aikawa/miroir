import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import {LocalStorageModule} from 'angular-2-local-storage';
import {NgSelectModule} from '@ng-select/ng-select';
import {HotkeyModule} from 'angular2-hotkeys';
import {Ng2HighchartsModule} from 'ng2-highcharts';
import {MarkdownModule} from 'angular2-markdown';
import {AgGridModule} from 'ag-grid-angular';
import {CountoModule} from 'angular2-counto';

import {AppComponent} from './app.component';
import {RootComponent} from './components/root/root.component';
import {DeleteConfirmDialogComponent, EditorDialogComponent, SummaryComponent,} from './components/summary/summary.component';
import {DiffViewerComponent} from './components/diff-viewer/diff-viewer.component';
import {ResponseTimeChartComponent} from './components/response-time-chart/response-time-chart.component';
import {CommonModule, HashLocationStrategy, LocationStrategy} from '@angular/common';
import {DetailDialogComponent} from './components/detail-dialog/detail-dialog.component';
import {EditorComponent} from './components/editor/editor.component';
import {AwsService} from './services/aws-service';
import {SettingsService} from './services/settings-service';
import {AuthGuard} from './components/guard/auth.guard';
import {LoginComponent} from './components/login/login.component';
import {InlineEditorComponent} from './components/inline-editor/inline-editor.component';
import {MarkdownInlineEditorComponent} from './components/markdown-inline-editor/markdown-inline-editor.component';
import {BadgeComponent, BadgeListComponent} from './components/badge/badge-component';
import {ConfirmDialogComponent} from './components/dialogs/confirm-dialog/confirm-dialog.component';
import {MonacoEditorLoader} from './services/monaco-editor-loader';
import {LogoLoadingComponent} from './components/guard/logo-loading.component';
import {
    AnalyticsComponent,
    ToAttentionPipe,
    ToCheckedAlreadyDiffSummaryPipe,
    ToIgnoredDiffSummaryPipe,
    ToPathPipe
} from './components/analystic/analytics.component';
import {ToasterModule} from 'angular2-toaster';
import {PanelComponent} from './components/panel/panel-component';
import {EmptyContentsPipe, HasContentsPipe} from './utils/regexp';
import {TrialsTableComponent} from './components/trials-table/trials-table.component';

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
        TrialsTableComponent,
        DiffViewerComponent,
        DetailDialogComponent,
        DeleteConfirmDialogComponent,
        ConfirmDialogComponent,
        EditorDialogComponent,
        EditorComponent,
        InlineEditorComponent,
        MarkdownInlineEditorComponent,
        BadgeComponent,
        BadgeListComponent,
        PanelComponent,
        ResponseTimeChartComponent,
        AnalyticsComponent,
        LogoLoadingComponent,
        ToCheckedAlreadyDiffSummaryPipe,
        ToIgnoredDiffSummaryPipe,
        ToAttentionPipe,
        ToPathPipe,
        HasContentsPipe,
        EmptyContentsPipe,
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        CountoModule,
        ToasterModule.forRoot(),
        RouterModule.forRoot(appRoutes),
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        NgSelectModule, FormsModule,
        CommonModule,
        Ng2HighchartsModule,
        HotkeyModule.forRoot({disableCheatSheet: true}),
        LocalStorageModule.forRoot({
            prefix: 'miroir',
            storageType: 'localStorage'
        }),
        MarkdownModule.forRoot(),
        MatAutocompleteModule,
        MatButtonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatSlideToggleModule,
        MatProgressBarModule,
        MatChipsModule,
        MatIconModule,
        MatToolbarModule,
        MatSidenavModule,
        MatProgressSpinnerModule,
        MatOptionModule,
        MatCardModule,
        MatSelectModule,
        MatMenuModule,
        MatTabsModule,
        MatButtonToggleModule,
        MatDialogModule,
        MatDividerModule,
        MatInputModule,
        MatSnackBarModule,
        AgGridModule.withComponents([]), MatExpansionModule,
    ],
    exports: [
        MatAutocompleteModule,
        MatButtonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatSlideToggleModule,
        MatProgressBarModule,
        MatChipsModule,
        MatIconModule,
        MatToolbarModule,
        MatSidenavModule,
        MatProgressSpinnerModule,
        MatOptionModule,
        MatCardModule,
        MatSelectModule,
        MatMenuModule,
        MatTabsModule,
        MatButtonToggleModule,
        MatDialogModule,
        MatDividerModule,
        MatInputModule,
        MatSnackBarModule,
    ],
    entryComponents: [
        DetailDialogComponent,
        EditorComponent,
        DeleteConfirmDialogComponent,
        ConfirmDialogComponent,
        EditorDialogComponent,
        LogoLoadingComponent
    ],
    providers: [
        AwsService,
        SettingsService,
        AuthGuard,
        MonacoEditorLoader,
        {provide: LocationStrategy, useClass: HashLocationStrategy}
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
