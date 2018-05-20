import {Row, Trial} from '../../models/models';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {regexpComparator} from "../../utils/filters";

interface RowData {
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

    rowClassRules = {
        'report-table-record-different': 'data.status === "different"',
    };
    defaultColDef = {
        filterParams: {
            textCustomComparator: regexpComparator,
            debounceMs: 200
        },
        floatingFilterComponentParams: {
            debounceMs: 200
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
            openByDefault: true,
            children: [
                {
                    headerName: "Status",
                    columnGroupShow: "everything else",
                    children: [
                        {headerName: "one", field: "oneStatus"},
                        {headerName: "other", field: "otherStatus"},
                    ]
                },
                {
                    headerName: "Sec",
                    columnGroupShow: "open",
                    children: [
                        {headerName: "one", field: "oneSec", filter: 'agNumberColumnFilter'},
                        {headerName: "other", field: "otherSec", filter: 'agNumberColumnFilter'},
                    ]
                },
                {
                    headerName: "Byte",
                    columnGroupShow: "open",
                    children: [
                        {headerName: "one", field: "oneByte", filter: 'agNumberColumnFilter'},
                        {headerName: "other", field: "otherByte", filter: 'agNumberColumnFilter'},
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
        console.log("ready")
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;
        this.fitColumnWidths();
    }

    handleRowClicked(row: Row<RowData>) {
        this.onClickRow.emit(row);
    }

    handleModelUpdated() {
        this.onDisplayedTrialsUpdated.emit(
            this.gridApi ?
                this.gridApi.getModel().rowsToDisplay.map(x => x.data.trial) :
                this.tableRowData.map(x => x.trial)
        )
    }

    fitColumnWidths() {
        // Not initialized case
        if (!this.gridColumnApi) {
            return
        }

        this.gridColumnApi.autoSizeColumns(
            this.gridColumnApi.getAllColumns().map(x => x.colId)
        );
    }

}
