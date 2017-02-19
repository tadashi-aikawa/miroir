import {Component, Input, Output, ViewChild, OnChanges, SimpleChanges} from '@angular/core';
import * as CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/merge/merge';
//import 'mergely';


@Component({
    selector: 'merge-viewer',
    styleUrls: ['./merge-viewer.css'],
    template: `<div #view></div>`,
})
export class MergeViewerComponent implements OnChanges {

    @Input() config: CodeMirror.MergeView.MergeViewEditorConfiguration;
    @Input() height?: string;
    @Output() instance: CodeMirror.MergeView.MergeViewEditor;

    @ViewChild('view') view;

    ngOnChanges(changes: SimpleChanges): void {
        this.config = changes["config"]["currentValue"];
        this.view.nativeElement.innerHTML = "";
        if (this.config) {
            this.instance = CodeMirror.MergeView(this.view.nativeElement, this.config);
            this.setHeight(this.height || "80vh");
        }
    }

    private setHeight(height: string) {
        const instanceAny: any = this.instance;
        instanceAny.wrap.style.height = height;
        this.instance.editor().setSize(null, height);
        this.instance.leftOriginal() && this.instance.leftOriginal().setSize(null, height);
        this.instance.rightOriginal() && this.instance.rightOriginal().setSize(null, height);
    }
}
