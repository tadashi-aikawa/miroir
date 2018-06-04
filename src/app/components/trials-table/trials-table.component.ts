import * as _ from 'lodash';
import {animate, style, transition, trigger} from '@angular/animations';
import {Row, Trial} from '../../models/models';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {regexpComparator} from "../../utils/filters";
import {Column} from "ag-grid";

export interface RowData {
    trial: Trial;
    seq: Number;
    name: string;
    path: string;
    queriesNum: number;
    queries: string;
    encodedQueries: string;
    status: string;
    oneByte: number;
    otherByte: number;
    oneSec: number;
    otherSec: number;
    oneStatus: number;
    otherStatus: number;
    oneType: string;
    otherType: string;
    oneContentType: string;
    otherContentType: string;
    requestTime: string;
    attention: string;
    checkedAlready: string[];
    ignored: string[];
}

@Component({
    selector: 'app-trials-table',
    templateUrl: './trials-table.component.html',
    styleUrls: [
        './trials-table.css',
    ],
})
export class TrialsTableComponent {
    @Input() tableRowData: RowData[];
    @Output() onClickRow = new EventEmitter<Row<RowData>>();
    @Output() onDisplayedTrialsUpdated = new EventEmitter<Trial[]>();
    @Output() onfilteredRowsNumUpdated = new EventEmitter<string>();

    width: string;
    rowClassRules = {
        'report-table-record-attention': 'data.attention === "Appears unknown!!" || (data.status === "different" && data.attention === "???")',
        'report-table-record-both-failure': 'data.attention === "Both failure!!"',
        'report-table-record-no-diff-keys': 'data.attention === "No diff keys!!"',
        'report-table-record-failure': 'data.status === "failure"',
        'report-table-record-checked-already': 'data.checkedAlready.length > 0 && !data.attention',
    };

    defaultColDef = {
        filterParams: {
            textCustomComparator: regexpComparator,
            debounceMs: 200,
            newRowsAction: 'keep',
        },
        floatingFilterComponentParams: {
            debounceMs: 200,
        }
    };

    columnDefs = [
        {
            headerName: "seq",
            field: "seq",
            pinned: 'left',
        },
        {
            headerName: "name",
            field: "name",
            pinned: 'left',
        },
        {
            headerName: "Result",
            pinned: 'left',
            children: [
                {
                    headerName: "status",
                    field: "status",
                },
                {
                    headerName: "Intelligent Analytics",
                    children: [
                        {headerName: "attention", field: "attention"},
                        {headerName: "checkedAlready", field: "checkedAlready", columnGroupShow: "open"},
                        {headerName: "ignored", field: "ignored", columnGroupShow: "open"},
                    ]
                },
            ]
        },
        {
            headerName: "Request",
            children: [
                {
                    headerName: "path",
                    field: "path",
                },
                {
                    headerName: "queries",
                    columnGroupShow: "open",
                    children: [
                        {
                            headerName: "number",
                            field: "queriesNum",
                            columnGroupShow: "closed",
                        },
                        {
                            headerName: "detail",
                            field: "queries",
                            columnGroupShow: "open",
                        },
                        {
                            headerName: "encoded",
                            field: "encodedQueries",
                            columnGroupShow: "open",
                            filterParams: {
                                textCustomComparator: null
                            }
                        },
                    ]
                },
            ]
        },
        {
            headerName: "Response",
            children: [
                {
                    headerName: "Status",
                    children: [
                        {headerName: "one", field: "oneStatus"},
                        {headerName: "other", field: "otherStatus"},
                    ]
                },
                {
                    headerName: "Sec",
                    children: [
                        {
                            headerName: "one",
                            field: "oneSec",
                            filter: 'agNumberColumnFilter',
                            filterParams: {
                                defaultOption: "greaterThanOrEqual"
                            }
                        },
                        {
                            headerName: "other",
                            field: "otherSec",
                            filter: 'agNumberColumnFilter',
                            filterParams: {
                                defaultOption: "greaterThanOrEqual"
                            }
                        },
                    ]
                },
                {
                    headerName: "Byte",
                    children: [
                        {
                            headerName: "one",
                            field: "oneByte",
                            filter: 'agNumberColumnFilter',
                            filterParams: {
                                defaultOption: "greaterThanOrEqual"
                            }
                        },
                        {
                            headerName: "other",
                            field: "otherByte",
                            filter: 'agNumberColumnFilter',
                            filterParams: {
                                defaultOption: "greaterThanOrEqual"
                            }
                        },
                    ]
                },
                {
                    headerName: "Type",
                    children: [
                        {headerName: "one", field: "oneType"},
                        {headerName: "other", field: "otherType"},
                    ]
                },
                {
                    headerName: "ContentType",
                    columnGroupShow: "open",
                    children: [
                        {
                            headerName: "one",
                            field: "oneContentType",
                        },
                        {
                            headerName: "other",
                            field: "otherContentType",
                        },
                    ]
                },
            ]
        },
        {
            headerName: "requestTime",
            field: "requestTime",
            pinned: 'right',
        },
    ];

    private gridApi;
    private gridColumnApi;

    handleGridReady(params) {
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;
        this.fitColumnWidths();
    }

    handleRowClicked(row: Row<RowData>) {
        this.onClickRow.emit(row);
    }

    handleModelUpdated() {
        const trials: Trial[] = this.gridApi ?
            this.gridApi.getModel().rowsToDisplay.map(x => x.data.trial) :
            this.tableRowData.map(x => x.trial);
        this.onDisplayedTrialsUpdated.emit(trials);

        const message = this.gridApi && this.gridApi.isAnyFilterPresent() ?
            `${trials.length} / ${this.tableRowData.length}` :
            undefined;
        this.onfilteredRowsNumUpdated.emit(message);

        this.fitColumnWidths();
    }

    fitColumnWidths() {
        // Not initialized case
        if (!this.gridColumnApi) {
            return
        }

        this.gridColumnApi.autoSizeColumns(
            this.gridColumnApi.getAllColumns().map(x => x.colId)
        );
        this.fitTableWidth();
    }

    fitTableWidth() {
        const columnsWidth: number = _.sumBy<Column>(this.gridColumnApi.getAllDisplayedColumns(), x => x.getActualWidth());
        this.width = `${columnsWidth}px`;
    }

    setAllColumnsVisible() {
        this.gridColumnApi.setColumnsVisible(
            this.gridColumnApi.getAllColumns().map(x => x.colId),
            true
        );
    }

    clearAllFilters() {
        this.gridColumnApi.getAllColumns().map(x => this.gridApi.destroyFilter(x));
    }

}
