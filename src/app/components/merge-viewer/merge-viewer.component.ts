import {
    Component, Input, Output, ViewChild, OnChanges, SimpleChanges, EventEmitter, OnInit,
    AfterViewInit, ElementRef, OnDestroy
} from '@angular/core';
import {MergeViewConfig} from '../../models/models';

declare const monaco: any;
declare const require: any;


@Component({
    selector: 'app-merge-viewer',
    styleUrls: ['./merge-viewer.css'],
    template: `<div #view class="monaco-editor" style="height:65vh;"></div>`,
})
export class MergeViewerComponent implements AfterViewInit, OnDestroy {
    @Input() config: MergeViewConfig;
    diffEditor: any;
    diffNavigator: any;

    @ViewChild('view') view: ElementRef;

    @Output() onKeyD = new EventEmitter<void>();
    @Output() onKeyI = new EventEmitter<boolean>();
    @Output() onKeyJ = new EventEmitter<void>();
    @Output() onKeyK = new EventEmitter<boolean>();
    @Output() onKeyL = new EventEmitter<void>();
    @Output() onKeyP = new EventEmitter<void>();
    @Output() onKeyQ = new EventEmitter<void>();
    @Output() onKeyW = new EventEmitter<void>();
    @Output() onKeySlash = new EventEmitter<void>();
    @Output() onKeyQuestion = new EventEmitter<void>();

    private _updateLayout: Function;

    constructor() {
        this._updateLayout = this.updateLayout.bind(this);
    }

    ngAfterViewInit() {
        const onGotAmdLoader = () => {
            const w: any = <any>window;
            w.require.config({ paths: { 'vs': 'assets/monaco/vs' } });
            w.require(['vs/editor/editor.main'], () => {
                this.diffEditor = monaco.editor.createDiffEditor(this.view.nativeElement, {
                    readOnly: this.config.readOnly,
                    originalEditable: !this.config.readOnly,
                    renderSideBySide: this.config.sideBySide,
                    scrollBeyondLastLine: false
                });
                this.bindKeys(this.diffEditor);
                w.addEventListener('resize', this._updateLayout);

                this.diffNavigator = monaco.editor.createDiffNavigator(this.diffEditor);
                this.diffEditor.setModel({
                    original: monaco.editor.createModel(this.config.leftContent, this.config.leftContentType),
                    modified: monaco.editor.createModel(this.config.rightContent, this.config.rightContentType)
                })
            });
        };

        if (!(<any>window).require) {
            const loaderScript = document.createElement('script');
            loaderScript.type = 'text/javascript';
            loaderScript.src = 'assets/monaco/vs/loader.js';
            loaderScript.addEventListener('load', onGotAmdLoader);
            document.body.appendChild(loaderScript);
        } else {
            onGotAmdLoader();
        }
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

    private bindKeys(diffEditor) {
        diffEditor.addCommand(monaco.KeyCode.KEY_D, () => this.onKeyD.emit());
        diffEditor.addCommand(monaco.KeyCode.KEY_I, () => this.onKeyI.emit());
        diffEditor.addCommand(monaco.KeyCode.KEY_J, () => this.onKeyJ.emit());
        diffEditor.addCommand(monaco.KeyCode.KEY_K, () => this.onKeyK.emit());
        diffEditor.addCommand(monaco.KeyCode.KEY_L, () => this.onKeyL.emit());
        diffEditor.addCommand(monaco.KeyCode.KEY_P, () => this.onKeyP.emit());
        diffEditor.addCommand(monaco.KeyCode.KEY_Q, () => this.onKeyQ.emit());
        diffEditor.addCommand(monaco.KeyCode.KEY_W, () => this.onKeyW.emit());
        diffEditor.addCommand(monaco.KeyCode.US_SLASH, () => this.onKeySlash.emit());
        diffEditor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.US_SLASH, () => this.onKeyI.emit());
    }
}
