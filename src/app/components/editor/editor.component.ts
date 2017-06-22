import {AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild} from '@angular/core';
import {EditorConfig} from '../../models/models';
import {MonacoEditorLoader} from '../../services/monaco-editor-loader';

declare const monaco: any;
declare const require: any;

@Component({
    selector: 'app-editor',
    template: `<div #view class="monaco-editor" style="height: 85vh;"></div>`
})
export class EditorComponent implements AfterViewInit, OnDestroy {
    @Input() config: EditorConfig;
    editor: any;

    @ViewChild('view') view: ElementRef;

    private _updateLayout: Function;

    constructor(private _monacoLoader: MonacoEditorLoader) {
        this._updateLayout = this.updateView.bind(this);
    }

    ngAfterViewInit() {
        this._monacoLoader.waitForMonaco().then(() => {
            this.editor = monaco.editor.create(this.view.nativeElement, {
                readOnly: this.config.readOnly,
                scrollBeyondLastLine: false,
                theme: this.config.theme
            });
             (<any>window).addEventListener('resize', this._updateLayout);

            this.editor.setModel(
                monaco.editor.createModel(this.config.content, this.config.contentType)
            );
        });
    }

    ngOnDestroy(): void {
        (<any>window).removeEventListener('resize', this._updateLayout);
    }

    updateView() {
        this.editor.layout();
    }

    getValue(): string {
        return this.editor.getValue();
    }
}
