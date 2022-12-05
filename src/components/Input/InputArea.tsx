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
 * The properties passed to the component at creation.
 * 
 * @typedef {Object} InputAreaProps
 * @property {string} name The name of the component.
 * @property {string} title The title and placeholder of the component.
 * @property {number} [maxLength] The maximum length of the value of the text area.
 * @property {number} [minLength] The minimum length of the value of the text area.
 * @property {ChangeEventHandler} [onChange] The function to run on the change of the text area.
 */
type InputAreaProps = {
  name: string;
  title: string;
  maxLength?: number;
  minLength?: number;
  onChange?: ChangeEventHandler;
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

class InputArea extends Component {

  state: InputAreaState;

  constructor(props: InputAreaProps) {
    super(props);

    this.state = {
      currentLength: 0
    };
  }

  componentDidMount(): void {
    const setState = this.setState.bind(this);

    $('.input-area-element').each(function () {
      this.setAttribute('style', 'height:' + (this.scrollHeight) + 'px;overflow-y:hidden;');
    }).on('input', function () {
      this.style.height = '0';
      this.style.height = (this.scrollHeight) + 'px';

      const currentLength = ($(this).val() as string).length;
      setState({
        currentLength
      } as InputAreaState);
    });
  }

  render() {
    const props = this.props as InputAreaProps;
    return (
      <div className='input input-area'>
        <label htmlFor={props.name}>{props.title}</label>
        <textarea
          className='input-area-element'
          name={props.name}
          placeholder={props.title}
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

export default InputArea;