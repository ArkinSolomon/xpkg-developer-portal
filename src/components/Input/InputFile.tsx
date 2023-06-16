/*
 * Copyright (c) 2022-2023. Arkin Solomon.
 * 
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied limitations under the License.
 */

/**
 * A callback triggered when the input file is changed.
 * 
 * @callback InputFileChangeCallback
 * @param {ChangeEvent<HTMLInputElement>} e The event that triggered this call.
 */

/**
 * The properties for the input file
 * 
 * @typedef {Object} InputFileProps
 * @property {string} label The label for the file.
 * @property {string} name The name for the input element.
 * @property {string} [id] The id for the input element.
 * @property {string} [classes] The classes to apply to the element.
 * @property {InputFileChangeCallback} onChange The function to execute on change.
 * @property {string|string[]} [types] The types for the file.
 */
export type InputFileProps = {
  label: string;
  name: string;
  id?: string;
  classes?: string[];
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  types?: string | string[];
};

import { ChangeEvent, useState } from 'react';
import '../../css/Input.scss';

export default function InputFile(props: InputFileProps): JSX.Element {
  let typeString: string | undefined;
  let accept: string | undefined;

  if (props.types) {
    let types = props.types;
    if (typeof types === 'string')
      types = [types];
    
    accept = types.join();
    typeString = ` [${types.join(', ')}]`;
  }

  const classes = (props.classes ?? []).join(' ');

  const [fileName, setFileName] = useState('(no file selected)');

  return (
    <div className={'input-file ' + classes}>
      <p>{props.label + (typeString ?? '')}</p>
      <label className='input'>
        <input
          type='file'
          name={props.name}
          accept={accept}
          id={props.id}
          onChange={e => {
            let fileName = '(no file selected)';

            if (e.target.files && e.target.files?.length > 0) 
              fileName = e.target.files[0].name;
          
            setFileName(fileName);
            props.onChange(e);
          }} /> 
        Upload file
      </label>
      <span>{ fileName }</span>
    </div>
  );
}