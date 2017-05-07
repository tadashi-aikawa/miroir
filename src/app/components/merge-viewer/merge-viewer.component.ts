import {Component, Input, Output, ViewChild, OnChanges, SimpleChanges, EventEmitter, OnInit} from '@angular/core';
import * as CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/merge/merge';
import 'codemirror/addon/dialog/dialog';
import 'codemirror/addon/search/search';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/matchesonscrollbar';
import 'codemirror/addon/scroll/annotatescrollbar';
import 'codemirror/addon/search/jump-to-line';
import {Pair} from '../../models/models';


function scrollToCenter(cm) {
    const {line} = cm.getCursor();

    const top = cm.charCoords({line: line, ch: 0}, 'local').top;
    const halfWindowHeight = cm.getWrapperElement().offsetHeight / 2;
    cm.scrollTo(null, top - halfWindowHeight);
}

function pretty(value: string): string {
    // TODO: Not json case
    return JSON.stringify(
        JSON.parse(value),
        (_, v) => (!(v instanceof Array || v === null) && typeof v === 'object') ?
            Object.keys(v).sort().reduce((r, k) => { r[k] = v[k]; return r; }, {}) :
            v,
        4
    );
}

@Component({
    selector: 'app-merge-viewer',
    styleUrls: ['./merge-viewer.css'],
    template: `<div #view></div>`,
})
export class MergeViewerComponent implements OnInit {

    @Input() config: CodeMirror.MergeView.MergeViewEditorConfiguration;
    @Input() height?: string;

    @Output() instance: CodeMirror.MergeView.MergeViewEditor;
    @Output() onKeyD = new EventEmitter<void>();
    @Output() onKeyQ = new EventEmitter<void>();
    @Output() onKeyP = new EventEmitter<void>();
    @Output() onKeyF = new EventEmitter<void>();
    @Output() onKeyI = new EventEmitter<boolean>();
    @Output() onKeyJ = new EventEmitter<void>();
    @Output() onKeyK = new EventEmitter<boolean>();
    @Output() onKeyL = new EventEmitter<void>();
    @Output() onKeyX = new EventEmitter<Pair<string>>();
    @Output() onKeyW = new EventEmitter<void>();
    @Output() onKeySlash = new EventEmitter<void>();
    @Output() onKeyQuestion = new EventEmitter<void>();

    @ViewChild('view') view;

    ngOnInit(): void {
        const editorKeyBinding = (isOrigin: boolean) => ({
            'D': cm => this.onKeyD.emit(),
            'Q': cm => this.onKeyQ.emit(),
            'P': cm => this.onKeyP.emit(),
            'F': cm => {
                cm.execCommand('findPersistent');
                this.onKeyF.emit();
            },
            'I': cm => this.onKeyI.emit(isOrigin),
            'J': cm => this.onKeyJ.emit(),
            'K': cm => this.onKeyK.emit(isOrigin),
            'L': cm => this.onKeyL.emit(),
            'X': cm => {
                // Support for response of JSONView extension
                const optimizeFormat = (target) => pretty(target.replace(/^([^":\[\]{},]+):/mg, '"$1":'));

                const one = optimizeFormat(this.instance.leftOriginal().getValue());
                const other = optimizeFormat(this.instance.editor().getValue());

                this.onKeyX.emit({one, other});
            },
            'W': cm => this.onKeyW.emit(),
            '/': cm => this.onKeySlash.emit(),
            'Shift-/': cm => this.onKeyQuestion.emit()
        });

        this.view.nativeElement.innerHTML = '';
        if (this.config) {
            this.instance = CodeMirror.MergeView(this.view.nativeElement, this.config);
            this.setHeight(this.height || '70vh');
            this.instance.editor().setOption('extraKeys', editorKeyBinding(false));
            this.instance.leftOriginal().setOption('extraKeys', editorKeyBinding(true));
            this.instance.leftOriginal().focus();
        }
    }

    moveToNextDiff(isOrigin: boolean) {
        const cm: any = isOrigin ? this.instance.leftOriginal() : this.instance.editor();
        cm.execCommand('goNextDiff');
        scrollToCenter(cm);
    }

    moveToPreviousDiff(isOrigin: boolean) {
        const cm: any = isOrigin ? this.instance.leftOriginal() : this.instance.editor();
        cm.execCommand('goPrevDiff');
        scrollToCenter(cm);
    }

    updateView() {
        this.instance.leftOriginal().refresh();
        this.instance.editor().refresh();
    }

    private setHeight(height: string) {
        const instanceAny: any = this.instance;
        instanceAny.wrap.style.height = height;

        this.instance.editor().setSize(null, height);
        this.instance.editor().setOption('readOnly', false);

        this.instance.leftOriginal().setSize(null, height);
        this.instance.leftOriginal().setOption('readOnly', false);
    }
}
