/*
 * Copyright (c) 2022. X-Pkg Developer Portal Contributors.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied limitations under the License.
 */

/**
 * Properties for the table component.
 * 
 * @typedef {Object} TableProps<T>
 * @property {Record<string, number>} columns The widths of the columns of the table (in percentages), indexed by column name.
 * @property {string[][]} data The data of the table's initial columns. First dimension is rows, second dimension is columns.
 * @property {T[]} subrowData The data for each subrow when expanded.
 * @property {(T) => ReactElement} subrowRender Render the data for a subrow.
 */
export type TableProps<T> = {
  columns: Record<string, number>;
  data: string[][];
  subrowData: T[];
  subrowRender: (data: T) => ReactElement;
};

/**
 * State of table component.
 * 
 * @typedef {Object} TableState<T>
 * @property {T} [currentSubrowData] The data of the currently opened subrow, or undefined if no subrow is currently active.
 * @property {number} [r] The current index of the subrow data.
 */
type TableState<T> = {
  currentSubrowData?: T;
  r?: number;
}

import {Component, ReactElement, ReactNode} from 'react';
import '../../css/Table.scss';
import $ from 'jquery';
import { nanoid } from 'nanoid';

class Table<T> extends Component {
  
  state: TableState<T>;

  constructor(props: TableProps<T>) {
    super(props);

    this.state = {};
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentDidUpdate = this.componentDidMount;
  }

  componentDidMount(): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    $('.expand-button').on('click', function () {
      const index = parseInt(this.getAttribute('data-index') as string, 10);
      that.setState({
        currentSubrowData: (that.props as TableProps<T>).subrowData[index],
        r: index
      } as Partial<TableState<T>>);
    });
  }

  render(): ReactNode {
    const props = this.props as TableProps<T>;
    const header: ReactElement[] = [];
    const tableData: ReactElement[] = [];
    const widths: { width: string; }[] = [];
    
    for (const columnName of Object.keys(props.columns)) {
      const percentage = props.columns[columnName];
      const width = { width: `${.95 * percentage}%` };

      widths.push(width);
      header.push(<th style={width} key={nanoid()}>{columnName}</th>);
    }
    header.push(<th key={nanoid()}>&nbsp;</th>);

    for (const r in props.data) {
      const row = props.data[r];
      const d = [];
      for (const i in row) {
        const style = widths[i];

        d.push(<td style={style} key={nanoid()}>{row[i]}</td>);
      }
  
      d.push(<td className='expand-button' data-index={r} key={nanoid()}>+</td>);
      tableData.push(<tr key={nanoid()}>{d}</tr>);
    }

    if (typeof this.state.currentSubrowData !== 'undefined') {
      const subrow = props.subrowRender(this.state.currentSubrowData);
      tableData.splice(this.state.r as number + 1, 0, (
        <tr key="TABLE_SUBROW">
          <td className='table-subrow' colSpan={Object.keys(props.columns).length + 1}>
            {subrow}
          </td>
        </tr>
      ));
    }

    return (
      <table className='xpkg-table'>
        <thead>
          <tr>{header}</tr>
        </thead>
        <tbody>
          {tableData}
        </tbody>
      </table>
    );
  }
}

export default Table;