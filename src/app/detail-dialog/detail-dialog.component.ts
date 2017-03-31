import {AccessPoint, AwsConfig, Pair, Trial} from '../models/models';
import {AwsService} from '../services/aws-service';
import {Component, Input, OnInit, Optional, ViewChild} from '@angular/core';
import * as CodeMirror from 'codemirror';
import {MdDialogRef} from '@angular/material';
import {IOption} from 'ng-select';
import {Hotkey, HotkeysService} from 'angular2-hotkeys';


function createConfig(one: string, other: string): CodeMirror.MergeView.MergeViewEditorConfiguration {
    return {
        value: other,
        orig: undefined,
        origLeft: one,
        lineNumbers: true,
        lineWrapping: true,
        viewportMargin: 10,
        collapseIdentical: 30,
        readOnly: true
    };
}


@Component({
    templateUrl: './detail-dialog.component.html',
    providers: [
        AwsService
    ]
})
export class DetailDialogComponent implements OnInit {
    @Input() reportKey: string;
    @Input() oneAccessPoint: AccessPoint;
    @Input() otherAccessPoint: AccessPoint;
    @Input() trials: Trial[];
    @Input() awsConfig: AwsConfig;

    @ViewChild('selector') selector;
    @ViewChild('mergeView') mergeView;

    activeIndex: string;
    options: IOption[];
    isLoading: boolean;
    errorMessage: string;
    mergeViewConfig: CodeMirror.MergeView.MergeViewEditorConfiguration;
    displayedQueries: {key: string, value: string}[];

    constructor(private service: AwsService,
                @Optional() public dialogRef: MdDialogRef<DetailDialogComponent>,
                private _hotkeysService: HotkeysService) {
        // To prevent from unexpected close
        dialogRef.config = {disableClose: true};

        // XXX: _hotkeysService.remove(Hotkey[]) is not worked (maybe issues)
        _hotkeysService.hotkeys.splice(0).forEach(x => _hotkeysService.remove(x));

        _hotkeysService.add([
            new Hotkey('f', e => { return false; }, null, 'Formatting text in active editor.'),
            new Hotkey('k', e => {this.mergeView.moveToNextDiff(true); return false; }, null, 'Move to previous diff.'),
            new Hotkey('i', e => {this.mergeView.moveToPreviousDiff(true); return false; }, null, 'Move to next diff.'),
            new Hotkey('l', e => {this.showNextTrial(); return false; }, null, 'Show next trial.'),
            new Hotkey('j', e => {this.showPreviousTrial(); return false; }, null, 'Show previous trial.'),
            new Hotkey('/', e => {this.openSelector(); return false; }, null, 'Open trial list'),
            new Hotkey('q', e => {this.closeDialog(); return false; }, null, 'Close this dialog'),
            new Hotkey('?', e => {this.toggleCheatSheet(); return false; }, null, 'Open cheat sheet')
        ]);
    }

    ngOnInit(): void {
        // value is index of trial
        this.options = this.trials.map((t, i) => ({
            label: `${t.seq}. ${t.name} (${t.path})`,
            value: String(i)
        }));
        this.showTrial(this.getActiveTrial());
    }

    toggleCheatSheet(): void {
        this._hotkeysService.cheatSheetToggle.next({});
    }

    closeDialog(): void {
        this.dialogRef.close();
    }

    getActiveTrial(): Trial {
        return this.trials[this.activeIndex];
    }

    showNextTrial(): boolean {
        const index: number = Number(this.activeIndex);
        if (index === this.trials.length - 1) {
            return false;
        }

        this.showTrial(this.trials[index + 1]);
        this.activeIndex = String(index + 1);
    }

    showPreviousTrial(): boolean {
        const index: number = Number(this.activeIndex);
        if (index === 0) {
            return false;
        }

        this.showTrial(this.trials[index - 1]);
        this.activeIndex = String(index - 1);
    }

    openSelector(): void {
        this.selector.open();
    }

    updateValues(pair: Pair<string>): void {
        this.mergeViewConfig = createConfig(pair.one, pair.other);
    }

    showTrial(trial: Trial): void {
        this.displayedQueries = Object.keys(trial.queries)
            .map(k => ({key: k, value: trial.queries[k].join(', ')}));
        this.isLoading = true;

        const fetchFile = (file: string) =>
            this.service.fetchDetail(`${this.reportKey}/${file}`, this.awsConfig);

        // viewportMaring <==> search
        Promise.all([fetchFile(trial.one.file), fetchFile(trial.other.file)])
            .then((rs: string[]) => {
                this.isLoading = false;
                this.errorMessage = undefined;
                this.mergeViewConfig = createConfig(rs[0], rs[1]);
            })
            .catch(err => {
                this.isLoading = false;
                this.errorMessage = err;
            });
    }

}
