import {Component, Input, Output, ViewChild, OnChanges, SimpleChanges} from '@angular/core';
import * as CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/merge/merge';

@Component({
    selector: 'merge-viewer',
    styleUrls: ['./merge-viewer.css'],
    template: `<div #view></div>`,
})
export class MergeViewerComponent implements OnChanges {

    @Input() config: any;
    @Output() instance: CodeMirror.MergeView.MergeViewEditor;

    @ViewChild('view') view;

    ngOnChanges(changes: SimpleChanges): void {
        console.log("change")
        this.config = changes["config"]["currentValue"];
        this.view.nativeElement.innerHTML = "";
        this.instance = CodeMirror.MergeView(this.view.nativeElement, this.config || {
                value: "",
                orig: "",
                lineNumbers: true,
                readOnly: true
            });
        // if (this.instance.leftOriginal()) {
        //     this.instance.leftOriginal().getWrapperElement().style.height = "1000px";
        //     this.instance.rightOriginal().getWrapperElement().style.height = "1000px";
        // }
    }
}
