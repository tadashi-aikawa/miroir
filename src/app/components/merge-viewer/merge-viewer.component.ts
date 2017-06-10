import {AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild} from '@angular/core';
import {MergeViewConfig} from '../../models/models';

declare const monaco: any;
declare const require: any;


@Component({
    selector: 'app-merge-viewer',
    template: `<div #view class="monaco-editor" style="height: 65vh;"></div>`,
})
export class MergeViewerComponent implements AfterViewInit, OnDestroy {
    @Input() config: MergeViewConfig;
    diffEditor: any;
    diffNavigator: any;

    @ViewChild('view') view: ElementRef;

    private _updateLayout: Function;

    constructor() {
        this._updateLayout = this.updateLayout.bind(this);
    }

    ngAfterViewInit() {
        const w: any = <any>window;
        w.require.config({ paths: { 'vs': 'assets/monaco/vs' } });
        w.require(['vs/editor/editor.main'], () => {
            this.diffEditor = monaco.editor.createDiffEditor(this.view.nativeElement, {
                readOnly: this.config.readOnly,
                originalEditable: !this.config.readOnly,
                renderSideBySide: this.config.sideBySide,
                scrollBeyondLastLine: false
            });
            w.addEventListener('resize', this._updateLayout);

            this.diffNavigator = monaco.editor.createDiffNavigator(this.diffEditor);
            this.diffEditor.setModel({
                original: monaco.editor.createModel(this.config.leftContent, this.config.leftContentType),
                modified: monaco.editor.createModel(this.config.rightContent, this.config.rightContentType)
            })
        });
    }

    ngOnDestroy(): void {
        const w: any = <any>window;
        w.removeEventListener('resize', this._updateLayout);
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
        this.diffEditor.layout();
    }

}
