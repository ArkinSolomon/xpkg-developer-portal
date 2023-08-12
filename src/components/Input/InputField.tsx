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
 * Properties passed to the input field.
 * 
 * @typedef {Object} InputFieldProps
 * @property {string} [name] The name of the field.
 * @property {string} [label] The label value of the field.
 * @property {string} [placeholder] The placeholder value of the field. The label is used if it is provided and placeholder is not.
 * @property {string} [defaultValue] The default value of the field.
 * @property {string} [value] The current value of the field. 
 * @property {string} [type=text] An alternate type of input.
 * @property {ChangeEventHandler} [onChange] The event handler to be passed to the onChange property of the field.
 * @property {string[]} [classes=[]] Additional classes to pass to the wrapping div.
 * @property {number} [maxLength] The maximum length of the value in the field.
 * @property {number} [minLength] The minimum length of the value in the field.
 * @property {string} [error] Any error with the text area to display under it.
 * @property {boolean|Function<boolean>} [hiddenError] True if there is an error that has no message. The box will be outlined red.
 * @property {string} [inputKey] A key passed to the input element. Useful for dynamically created fields.
 * @property {boolean} [readonly=false] True if the field should be readonly.
 * @property {number} [tabIndex] The tab index to use for the field.
 * @property {boolean} [zeroErrorText=false] Show error text if the field length is zero.
 * @property {boolean} [extendOnSlash=false] Extend the maximum character count by nine characters if a slash is typed. Useful for package identifier fields.
 */
export type InputFieldProps = {
  name?: string;
  label?: string;
  placeholder?: string;
  type?: string;
  defaultValue?: string;
  value?: string;
  onChange?: ChangeEventHandler;
  classes?: string | string[];
  maxLength?: number;
  minLength?: number;
  error?: string;
  hiddenError?: boolean | (() => boolean);
  inputKey?: string;
  readonly?: boolean;
  tabIndex?: number;
  zeroErrorText?: boolean;
  extendOnSlash?: boolean;
};

/**
 * The state of the text field.
 * 
 * @typedef {Object} InputFieldState
 * @property {string} currentValue The current value of the text in the text field (trimmed).
 * @property {string} id The id of the input field, used for jQuery.
 */
type InputFieldState = {
   currentValue: string;
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
      currentValue: (props.defaultValue ?? '').trim(),
      id: props.inputKey ?? nanoid()
    };
  }

  componentDidMount(): void {
    const setState = this.setState.bind(this);

    $(`#${this.state.id}`).on('input', function () {
      const currentValue = $(this).val() as string;
      setState({
        currentValue
      } as InputFieldState);
    });
  }

  componentDidUpdate(): void {
    const currentValue = ($(`#${this.state.id}`).val() as string).trim();
    if (currentValue === this.state.currentValue)
      return;
    
    this.setState({
      currentValue
    } as InputFieldState);
  }

  render() {
    const props = this.props as InputFieldProps;

    let {maxLength} = props;
    if (maxLength && props.extendOnSlash && this.state.currentValue.includes('/'))
      maxLength += 9;

    const lengthError = this.state.currentValue.length < (props.minLength ?? -1) ||
      this.state.currentValue.length > (maxLength ?? Infinity);
    
    const hiddenError = typeof props.hiddenError === 'boolean' ? props.hiddenError : props.hiddenError?.();
    const hasError = hiddenError || props.error || lengthError;

    // Copy the array of classes, guarantee existence
    let propsClasses: string[] | null = (props.classes && typeof props.classes === 'string' ? [props.classes] : props.classes as string[]);
    propsClasses ??= [];
    propsClasses = [...propsClasses];

    if (hasError)
      propsClasses.push('error-outline');
    if (props.readonly)
      propsClasses.push('input-readonly');
    
    const classes = 'input input-field ' + propsClasses.join(' ');
    const type = props.type ?? 'text';

    const shouldShowError = !!((props.zeroErrorText && !this.state.currentValue.length || !props.zeroErrorText && this.state.currentValue.length) && props.error);

    return (
      <div className={classes}>
        {props.label && <label htmlFor={this.state.id}>{props.label}</label>}
        <input
          id={this.state.id}
          type={type}
          name={props.name}
          placeholder={props.placeholder ?? props.label}
          defaultValue={props.defaultValue}
          value={props.value}
          onChange={props.onChange}
          readOnly={props.readonly}
          key={props.inputKey}
          tabIndex={props.readonly ? -1 : props.tabIndex}
        />
        {shouldShowError && 
          <p className='error error-text'>
            {props.error}
          </p>
        }
        {(maxLength || props.minLength) && <p className='max-len-counter'>
          <span className={lengthError ? 'error' : void(0)}>
            {this.state.currentValue.length}
          </span>
          /{maxLength}</p>}
      </div>
    );
  }
}

export default InputField;