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
 * The properties passed to the component at creation.
 * 
 * @typedef {Object} InputAreaProps
 * @property {string} name The name of the component.
 * @property {string} label The label to go above the description.
 * @property {string} [placeholder] The placeholder of the text area. The label is used if no placeholder is provided.
 * @property {number} [maxLength] The maximum length of the value of the text area.
 * @property {number} [minLength] The minimum length of the value of the text area.
 * @property {ChangeEventHandler} [onChange] The function to run on the change of the text area.
 * @property {string} [error] Any error with the text area to display under it.
 * @property {string} [defaultValue] The default value of the input area.
 */
export type InputAreaProps = {
  name: string;
  label: string;
  placeholder?: string;
  maxLength?: number;
  minLength?: number;
  onChange?: ChangeEventHandler;
  error?: string;
  defaultValue?: string;
};

/**
 * The state of the text area.
 * 
 * @typedef {Object} InputAreaState
 * @property {number} currentLength The current length of the value of the item in the text area.
 */
type InputAreaState = {
  currentLength: number;
};

import { ChangeEventHandler, Component } from 'react';
import $ from 'jquery';
import '../../css/Input.scss';
import { nanoid } from 'nanoid';

class InputArea extends Component {

  state: InputAreaState;
  private _id: string;

  constructor(props: InputAreaProps) {
    super(props);

    this._id = nanoid();

    this.state = {
      currentLength: (props.defaultValue ?? '').length
    };
  }

  componentDidUpdate(): void {
    const setState = this.setState.bind(this);
    const state = this.state;

    $(`#${this._id}`).each(function () {
      this.style.height = '0';
      this.style.height = (this.scrollHeight) + 'px';

      const currentLength = ($(this).val() as string).trim().length;
      if (currentLength === state.currentLength)
        return;
      
      setState({
        currentLength
      } as InputAreaState);
    });
  }

  componentDidMount(): void {
    const setState = this.setState.bind(this);

    $(`#${this._id}`).on('input', function () {
      this.style.height = '0';
      this.style.height = (this.scrollHeight) + 'px';

      const currentLength = ($(this).val() as string).trim().length;
      setState({
        currentLength
      } as InputAreaState);
    });
  }

  render() {
    const props = this.props as InputAreaProps;

    return (
      <div className={'input input-area ' + (props.error ? 'error-outline' : '')}>
        <label htmlFor={this._id}>{props.label}</label>
        <textarea
          id={this._id}
          defaultValue={props.defaultValue}
          className='input-area-element'
          name={props.name}
          placeholder={props.placeholder ?? props.label}
          onChange={props.onChange}
        />
        {props.error && 
          <p className='error error-text'>
            {props.error}
          </p>
        }
        {(props.maxLength || props.minLength) && <p className='max-len-counter'>
          <span
            className={
              this.state.currentLength < (props.minLength ?? -1) ||
                  this.state.currentLength > (props.maxLength ?? Infinity)
                ? 'error' : ''
            }
          >
            {this.state.currentLength}
          </span>
            /{props.maxLength}</p>}
      </div>
    );
  }
}

export default InputArea;