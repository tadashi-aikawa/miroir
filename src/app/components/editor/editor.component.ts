import {AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild, OnChanges, SimpleChanges} from '@angular/core';
import {EditorConfig} from '../../models/models';
import {MonacoEditorLoader} from '../../services/monaco-editor-loader';

declare const monaco: any;

@Component({
    selector: 'app-editor',
    template: `
        <div #view class="monaco-editor" [style.height]="height"></div>`,
})
export class EditorComponent implements AfterViewInit, OnDestroy, OnChanges {
    @Input() config: EditorConfig;
    @Input() height: string;
    editor: any;

    @ViewChild('view', {static: true}) view: ElementRef;

    private _updateLayout: Function;

    constructor(private _monacoLoader: MonacoEditorLoader) {
        this._updateLayout = this.updateView.bind(this);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.height) {
            setTimeout(() => this.updateView(), 0);
        }
    }


    ngAfterViewInit() {
        this._monacoLoader.waitForMonaco().then(() => {
            this.editor = monaco.editor.create(this.view.nativeElement, {
                readOnly: this.config.readOnly,
                scrollBeyondLastLine: false,
                theme: this.config.theme,
                minimap: this.config.minimap,
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
        if (this.editor) {
            setTimeout(() => this.editor.layout(), 0);
        }
    }

    getValue(): string {
        return this.editor.getValue();
    }
}
