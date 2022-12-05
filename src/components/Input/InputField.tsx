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
 * Properties passed to the input field.
 * 
 * @typedef {Object} InputFieldProps
 * @property {string} name The name of the field.
 * @property {string} title The title value of the field. Used if placeholder is not provided.
 * @property {string} [placeholder] The placeholder value of the field.
 * @property {boolean} [center=false] True if the field should be centered.
 * @property {string} [width] A custom value for the width property.
 * @property {string} [defaultValue] The default value of the field.
 * @property {string} [type=text] An alternate type of input.
 * @property {ChangeEventHandler} [onChange] The event handler to be passed to the onChange property of the field.
 * @property {string[]} [classes=[]] Additional classes to pass to the wrapping div.
 * @property {number} maxLength The maximum length of the value in the field.
 * @property {number} minLength The minimum length of the value in the field.
 */
type InputFieldProps = {
  name: string;
  title: string;
  placeholder?: string;
  center?: boolean;
  width?: string;
  type?: string;
  defaultValue?: string;
  onChange?: ChangeEventHandler;
  classes?: string | string[];
  maxLength?: number;
  minLength?: number;
};

/**
 * The state of the text field.
 * 
 * @typedef {Object} InputFieldState
 * @property {number} currentLength The current length of the value of the item in the text field.
 * @property {string} id The id of the input field, used for jQuery.
 */
 type InputFieldState = {
   currentLength: number;
   id: string;
};

import { ChangeEventHandler, Component } from 'react';
import '../../css/Input.scss';
import $ from 'jquery';
import 'nanoid';
import { nanoid } from 'nanoid';

class InputField extends Component {

  state: InputFieldState;

  constructor(props: InputFieldProps) {
    super(props);

    this.state = {
      currentLength: 0,
      id: nanoid()
    };
  }

  componentDidMount(): void {
    const setState = this.setState.bind(this);
    $(`#${this.state.id}`).on('input', function () {
      const currentLength = ($(this).val() as string).length;
      setState({
        currentLength
      } as InputFieldState);
    });
  }

  render() {
    const props = this.props as InputFieldProps;

    const propsClasses = props.classes && typeof props.classes === 'string' ? [props.classes] : props.classes as string[];
    const classes = 'input input-field' + (props.center ? ' center' : '') + ' ' + (propsClasses ?? []).join(' ');
    const width = props.width ?? '120px';
    const type = props.type ?? 'text';

    return (
      <div className={classes} style={{ width }}>
        <label htmlFor={props.name}>{props.title}</label>
        <input
          id={this.state.id}
          type={type}
          name={props.name}
          placeholder={props.placeholder ?? props.title}
          defaultValue={props.defaultValue}
          onChange={props.onChange}
        />
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

export default InputField;