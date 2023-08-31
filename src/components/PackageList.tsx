/*
 * Copyright (c) 2022-2023. Arkin Solomon.
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
 * The props for the package list.
 * 
 * @typedef {Object} PackageListProps 
 * @property {[string, string][]} list A reference to the 2d array of data, which is a list of tuples where the first value is the package identifier string, and the second value is the version selection string. Empty rows should have empty data.
 * @property {(boolean) => void} [onChange] The function to run when a list has changed. Parameter is true if the form has an error.
 * @property {string} title The title of the list.
 * @property {string} noneText The text to display if no values are present.
 * @property {string} errProp The prop to set to true or false if an error is in the form.
 * @property {boolean} [readonly] True if the entire list should be readonly.
 * @property {number[]} [readonlyIndex] Integers which represent the index in list which should be ignored.
 */
export type PackageListProps = {
  list: [string, string][];
  onChange?: (hasError: boolean) => void;
  title: string;
  noneText: string;
  readonly?: boolean;
  readonlyIndex?: number[];
};

import { nanoid } from 'nanoid/non-secure';
import InputField, { InputFieldProps } from './Input/InputField';
import '../css/PackageList.scss';
import { Component, ReactNode } from 'react';
import $ from 'jquery';
import SelectionChecker from '../scripts/versionSelection';
import { validateId } from '../scripts/validators';

// Using state here will cause the text fields to loose focus
class PackageList extends Component {

  private _keyPrefix = nanoid(4);
  private _lastLen: number;

  private _readonlyIndices: number[];

  constructor(props: PackageListProps) {
    super(props);

    this._readonlyIndices = props.readonlyIndex ?? [];

    this._onChangeCaller = this._onChangeCaller.bind(this);
    this._lastLen = props.list.length;
  }

  shouldComponentUpdate(nextProps: PackageListProps): boolean {
    return (this.props as PackageListProps).list !== nextProps.list || this._lastLen !== (this.props as PackageListProps).list.length;
  }

  private _onChangeCaller(): void {
    const props = this.props as PackageListProps;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const func = props.onChange ?? (() => { });
    func(PackageList.doesListHaveError(props.list));
  }

  private _createList(): ReactNode {
    const props = this.props as PackageListProps;

    const packageIdFields = [];
    const versionSelectFields = [];
    this._lastLen = props.list.length;

    for (let i = 0; i < props.list.length; ++i){
  
      const packageIdKey = this._keyPrefix + i + '-packageid';
      const versionSelectKey = this._keyPrefix + i + '-versionsel';
      const [packageIdValue, versionSelectValue] = props.list[i];

      const disabled = props.readonly || this._readonlyIndices.includes(i);

      const additionalPackageIdProps: Partial<InputFieldProps> = disabled ?
        { readonly: true } :
        {
          minLength: 6,
          maxLength: 32
        };
      
      const additionalVersionSelectProps: Partial<InputFieldProps> = disabled ?
        { readonly: true } :
        {
          minLength: 1,
          maxLength: 256
        };

      const packageIdFieldProps: InputFieldProps = {
        placeholder: 'Package Identifier',
        onChange: e => {
          const val = $(e.target).val() as string;
          const selectionVal = props.list[i][1];
          props.list[i] = [val, selectionVal];
          this._onChangeCaller();
        },
        hiddenError: () => {
          const val = $('#' + packageIdKey).val() as (string | undefined) ?? packageIdValue;
          return !val || !val.length || !validateId(val);
        },
        defaultValue: packageIdValue,
        extendOnSlash: true,
        inputKey: packageIdKey
      };
      
      const versionSelectFieldProps: InputFieldProps = {
        placeholder: 'x.x.x-x.x.x',
        onChange: e => {
          const val = $(e.target).val() as string;
          const packageIdVal = props.list[i][0];
          props.list[i] = [packageIdVal, val];
          this._onChangeCaller();
        },
        hiddenError: () => {
          const val = $('#' + versionSelectKey).val() as (string | undefined) ?? versionSelectValue;
          return !val || !val.length || !new SelectionChecker(val).isValid;
        },
        defaultValue: versionSelectValue,
        inputKey: versionSelectKey
      };

      packageIdFields.push(<InputField {...additionalPackageIdProps} {...packageIdFieldProps} key={this._keyPrefix + '-input-field-' + i + '-packageid'} />);
      versionSelectFields.push(<InputField {...additionalVersionSelectProps} {...versionSelectFieldProps} key={this._keyPrefix + '-input-field-' + i + '-versionsel'} />);
    }
  
    const rows = [];
    for (const i in packageIdFields) {
      const packageIdField = packageIdFields[i];
      const versionSelectField = versionSelectFields[i];

      const index = ~~i; 
      const disabled = props.readonly || this._readonlyIndices.includes(index);
  
      rows.push(
        <div className='package-list-row-wrapper' key={nanoid(10)}>
          <div className='package-list-row'>
            {packageIdField}
            {versionSelectField}
          </div>
          {!disabled && <div className='button-wrapper'>
            <button
              type='button'
              onClick={() => {
                const props = (this.props as PackageListProps);
                props.list.splice(index, 1);
                this._onChangeCaller();
              }}
            ><span /></button>
          </div>}
        </div>
      );
    }
  
    return (
      <>
        {rows}
      </>
    );
  }

  render(): ReactNode {
    const {list, title, noneText, readonly} = this.props as PackageListProps;

    return (
      <>
        <div className='package-list'>
          <p>{title}</p>
          {list.length === 0 && <p className='package-list-empty'>{ noneText }</p>}
          {this._createList()}
        </div>
        {!readonly &&
          <div className='package-list-button'>
            <button
              type='button'
              className='list-mod-button left'
              onClick={() => {
                list.push(['', '']);
                this._onChangeCaller();
              }}
            >+</button>
          </div>
        }
      </>
    );
  }

  /**
   * Determine if a package list has an error in it.
   * 
   * @param {[string, string][]} list The list to check for error.
   * @returns {boolean} True if the list has an error, or false if it doesn't.
   */
  static doesListHaveError(list: [string, string][]): boolean {
    return !!list.find(([packageId, selection]) => 
      !packageId || !packageId.length || !validateId(packageId) ||
      !selection || !selection.length || !new SelectionChecker(selection).isValid
    );
  }
}

export default PackageList;