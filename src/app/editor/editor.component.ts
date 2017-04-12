import {Component, Input, Output, ViewChild, OnChanges, SimpleChanges, EventEmitter} from '@angular/core';
import * as CodeMirror from 'codemirror';
import 'codemirror/mode/yaml/yaml';
import 'codemirror/addon/search/search';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/matchesonscrollbar';
import 'codemirror/addon/scroll/annotatescrollbar';
import 'codemirror/addon/search/jump-to-line';


@Component({
    selector: 'app-editor',
    template: `<div #view></div>`,
})
export class EditorComponent implements OnChanges {

    @Input() config: CodeMirror.EditorConfiguration;
    @Input() height?: string;

    @Output() instance: CodeMirror.Editor;

    @ViewChild('view') view;

    ngOnChanges(changes: SimpleChanges): void {
        this.config = changes['config']['currentValue'];
        this.view.nativeElement.innerHTML = '';
        if (this.config) {
            this.instance = CodeMirror(this.view.nativeElement, this.config);
        }
    }

    updateView() {
        this.instance.refresh();
    }
}
