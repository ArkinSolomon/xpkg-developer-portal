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
import { ChangeEventHandler, ReactElement } from 'react';
import '../css/Input.scss';

function InputDropdown(props: {
  name: string;
  label: string;
  items: Record<string, string>;
  classes?: string[];
  center?: boolean;
  onChange?: ChangeEventHandler;
}): ReactElement {
  const items: ReactElement[] = [];

  const propsClasses = props.classes && typeof props.classes === 'string' ? [props.classes] : props.classes as string[];
  const classes = 'input input-dropdown' + (props.center ? ' center' : '') + ' ' + (propsClasses ?? []).join(' ');

  let defaultValue;
  for (const [value, displayVal] of Object.entries(props.items)) {
    if (!defaultValue)
      defaultValue = value;
      
    items.push(<option value={value}>{displayVal}</option>);
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