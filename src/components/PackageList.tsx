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
 * A callback executed whenever a row of the package list was updated.
 * 
 * @callback PackageListChange
 * @param {number} index The index of the updated values (corresponds to the provided initial values).
 * @param {string} packageId The current value of the package identifier string.
 * @param {string} versionSelection The current value of the version selection string.
 */
type PackageListChange = (index: number, packageId: string, versionSelection: string) => void;

/**
 * The props for the package list.
 * 
 * @typedef {Object} PackageListProps 
 * @property {[string, string][]} initialValues A 2d array of data where it's a list of tuples where the first value is the package identifier string, and the second value is the version selection string. Empty rows should have empty data.
 * @property {PackageListChange} onChange The callback to execute when the value of a row is changed.
 */
export type PackageListProps = {
  initialValues: [string, string][];
  onChange: PackageListChange;
};

import { nanoid } from 'nanoid/non-secure';
import InputField, { InputFieldProps } from './Input/InputField';
import '../css/PackageList.scss';
import { Component, ReactNode } from 'react';
import $ from 'jquery';
import SelectionChecker from '../scripts/selectionChecker';
import { validateId } from '../scripts/validators';

// Using state here will cause the text fields to loose focus
class PackageList extends Component {

  private _values: [string, string][] = [];
  private _keyPrefix = nanoid(4);

  constructor(props: PackageListProps) {
    super(props);
    this._values = JSON.parse(JSON.stringify(props.initialValues));
  }

  render(): ReactNode {
    const props = this.props as PackageListProps;

    const packageIdFields = [];
    const versionSelectFields = [];
    for (let i = 0; i < this._values.length; ++i){
  
      const packageIdKey = this._keyPrefix + i + '-packageid';
      const versionSelectKey = this._keyPrefix + i + '-versionsel';
      const [packageIdValue, versionSelectValue] = props.initialValues[i];

      const packageIdFieldProps: InputFieldProps = {
        minLength: 6,
        maxLength: 32,
        placeholder: 'Package Identifier',
        onChange: e => {
          const val = $(e.target).val() as string;
          const selectionVal = props.initialValues[i][1];
          this._values[i] = [val, selectionVal];
          props.onChange(i, val, selectionVal);
        },
        hiddenError: () => {
          const val = $('#' + packageIdKey).val() as (string | undefined) ?? packageIdValue;
          return !val || !val.length || !validateId(val);
        },
        defaultValue: packageIdValue,
        inputKey: packageIdKey
      };
      
      const versionSelectFieldProps: InputFieldProps = {
        placeholder: 'x.x.x-x.x.x',
        minLength: 1,
        maxLength: 256,
        onChange: e => {
          const val = $(e.target).val() as string;
          const packageIdVal = props.initialValues[i][0];
          this._values[i] = [packageIdVal, val];
          props.onChange(i, packageIdVal, val);
        },
        hiddenError: () => {
          const val = $('#' + versionSelectKey).val() as (string | undefined) ?? versionSelectValue;
          return !val || !val.length || !new SelectionChecker(val).isValid;
        },
        defaultValue: versionSelectValue,
        inputKey: versionSelectKey
      };

      packageIdFields.push(<InputField {...packageIdFieldProps} key={this._keyPrefix + '-input-field-' + i + '-packageid'} />);
      versionSelectFields.push(<InputField {...versionSelectFieldProps} key={this._keyPrefix + '-input-field-' + i + '-versionsel'} />);
    }
  
    const rows = [];
    for (const i in packageIdFields) {
      const packageIdField = packageIdFields[i];
      const versionSelectField = versionSelectFields[i];
  
      rows.push(
        <div className='package-list-row' key={nanoid(10)}>
          <>
            {packageIdField}
            {versionSelectField}
          </>
        </div>
      );
    }
  
    return (
      <>
        {rows}
      </>
    );
  }
}

export default PackageList;