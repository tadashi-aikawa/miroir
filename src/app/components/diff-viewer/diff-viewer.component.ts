import {
    AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges,
    ViewChild
} from '@angular/core';
import {DiffViewConfig} from '../../models/models';
import {MonacoEditorLoader} from '../../services/monaco-editor-loader';

declare const monaco: any;
declare const require: any;


function updateFromConfig(diffEditor?: any, config?: DiffViewConfig) {
    if (!diffEditor || !config) {
        return;
    }

    diffEditor.updateOptions({
        readOnly: config.readOnly,
        originalEditable: !config.readOnly,
        renderSideBySide: config.sideBySide,
        scrollBeyondLastLine: false,
    });

    diffEditor.setModel({
        original: monaco.editor.createModel(
            config.leftContent,
            config.leftContentType
        ),
        modified: monaco.editor.createModel(
            config.rightContent,
            config.rightContentType
        )
    });
}


@Component({
    selector: 'app-diff-viewer',
    template: `<div #view class="monaco-editor" style="height: 65vh;"></div>`,
})
export class DiffViewerComponent implements AfterViewInit, OnDestroy, OnChanges {
    @Input() config: DiffViewConfig;
    diffEditor: any;
    diffNavigator: any;

    @ViewChild('view') view: ElementRef;

    private _updateLayout: Function;

    constructor(private _monacoLoader: MonacoEditorLoader) {
        this._updateLayout = this.updateLayout.bind(this);
    }

    ngOnChanges(changes: SimpleChanges): void {
        updateFromConfig(this.diffEditor, changes.config.currentValue);
    }

    ngAfterViewInit() {
        this._monacoLoader.waitForMonaco().then(() => {
            this.diffEditor = monaco.editor.createDiffEditor(this.view.nativeElement);
            this.diffNavigator = monaco.editor.createDiffNavigator(this.diffEditor);
            (<any>window).addEventListener('resize', this._updateLayout);
            updateFromConfig(this.diffEditor, this.config);
        });
    }

    ngOnDestroy(): void {
        (<any>window).removeEventListener('resize', this._updateLayout);
    }

    private updateLayout() {
        this.diffEditor.layout();
    }

    moveToNextDiff() {
        this.diffNavigator.next();
    }

    moveToPreviousDiff() {
        this.diffNavigator.previous();
    }

    updateView() {
        // XXX: More simple solutions?
        updateFromConfig(this.diffEditor, this.config);
    }

}
