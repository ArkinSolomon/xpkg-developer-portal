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
import '../../css/Input.scss';

function InputCheckbox(props: { name: string; title: string; center?: boolean; onChange: ChangeEventHandler; }) {
  const classes = 'input input-checkbox' + (props.center ? ' center' : '');
  return (
    <div className={classes}>
      <input type='checkbox' name={props.name} onChange={props.onChange} />
      <label>{props.title}</label>
    </div>
  );
}

export default InputCheckbox;