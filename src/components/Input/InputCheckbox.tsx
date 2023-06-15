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
import { ChangeEventHandler } from 'react';
import { nanoid } from 'nanoid/non-secure';
import '../../css/Input.scss';

function InputCheckbox(props: {
  name: string;
  title: string;
  onChange: ChangeEventHandler;
  className?: string;
  defaultValue?: boolean;
  checked?: boolean;
  disabled?: boolean;
}) {
  const classes = 'input input-checkbox ' + (props.className ?? '');
  const id = nanoid(4);
  return (
    <div className={classes}>
      <input
        id={id}
        type='checkbox'
        name={props.name}
        onChange={props.onChange}
        defaultChecked={props.defaultValue}
        checked={props.checked}
        disabled={props.disabled}
      />
      <label htmlFor={id}>{props.title}</label>
    </div>
  );
}

export default InputCheckbox;