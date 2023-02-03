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
 * Props for the input dropdown.
 * 
 * @typedef {Object} InputDropdownProps
 * @property {string} name The name of the field.
 * @property {string} label The label for the field.
 * @property {Record<string, string>} items The items of the dropdown, where the key is the value of the field, and the value of the record is the display value.
 * @property {string[]} [classes] Additional classes for the dropdown wrapping div.
 * @property {boolean} [center] True if you want to center the item.
 * @property {ChangeEventHandler} [onChange] The function to call when the value is changed.
 */
export type InputDropdownProps = {
  name: string;
  label: string;
  items: Record<string, string>;
  classes?: string[];
  center?: boolean;
  onChange?: ChangeEventHandler;
};

import { ChangeEventHandler, ReactElement } from 'react';
import '../../css/Input.scss';

function InputDropdown(props: InputDropdownProps): ReactElement {
  const items: ReactElement[] = [];

  const propsClasses = props.classes && typeof props.classes === 'string' ? [props.classes] : props.classes as string[];
  const classes = 'input input-dropdown' + (props.center ? ' center' : '') + ' ' + (propsClasses ?? []).join(' ');

  let defaultValue;
  for (const [value, displayVal] of Object.entries(props.items).sort((a, b) => a[1].localeCompare(b[1]))) {
    if (!defaultValue)
      defaultValue = value;
      
    items.push(<option value={value} key={value}>{displayVal}</option>);
  }

  return (
    <div className={classes}>
      <label htmlFor={props.name}>{props.label}</label>
      <select
        name={props.name}
        defaultValue={defaultValue}
        onChange={props.onChange}>
        {items}
      </select>
    </div>
  );
}

export default InputDropdown;