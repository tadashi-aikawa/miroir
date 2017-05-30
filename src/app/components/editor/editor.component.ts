import {AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild} from '@angular/core';
import {EditorConfig} from '../../models/models';

declare const monaco: any;
declare const require: any;

@Component({
    selector: 'app-editor',
    template: `<div #view class="monaco-editor" style="height: 85vh;"></div>`
})
export class EditorComponent implements AfterViewInit, OnDestroy {
    @Input() config: EditorConfig;
    // todo:
    @Input() height: number;
    editor: any;

    @ViewChild('view') view: ElementRef;

    private _updateLayout: Function;

    constructor() {
        this._updateLayout = this.updateView.bind(this);
    }

    ngAfterViewInit() {
        const w: any = <any>window;
        w.require.config({ paths: { 'vs': 'assets/monaco/vs' } });
        w.require(['vs/editor/editor.main'], () => {
            this.editor = monaco.editor.create(this.view.nativeElement, {
                readOnly: this.config.readOnly,
                scrollBeyondLastLine: false,
                theme: this.config.theme
            });
            w.addEventListener('resize', this._updateLayout);

            this.editor.setModel(
                monaco.editor.createModel(this.config.content, this.config.contentType)
            )
        });
    }

    ngOnDestroy(): void {
        const w: any = <any>window;
        w.removeEventListener('resize', this._updateLayout);
    }

    updateView() {
        this.editor.layout();
    }
}
