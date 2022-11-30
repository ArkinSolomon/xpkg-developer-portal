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
import { ChangeEventHandler } from 'react';
import '../css/Input.scss';

function InputField(props: {
  name: string;
  title: string;
  placeholder?: string;
  center?: boolean;
  width?: string;
  type?: string;
  defaultValue?: string;
  onChange?: ChangeEventHandler;
  classes?: string | string[];
}) {
  const propsClasses = props.classes && typeof props.classes === 'string' ? [props.classes] : props.classes as string[];
  const classes = 'input input-field' + (props.center ? ' center' : '') + ' ' + (propsClasses ?? []).join(' ');
  const width = props.width ?? '120px';
  const type = props.type ?? 'text';
  return (
    <div className={classes} style={{ width }}>
      <label htmlFor={props.name}>{props.title}</label>
      <input type={type} name={props.name} placeholder={props.placeholder ?? props.title} defaultValue={props.defaultValue} onChange={props.onChange} />
    </div>
  );
}

export default InputField;