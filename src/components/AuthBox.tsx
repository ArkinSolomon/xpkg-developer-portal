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
import { ReactNode, FormEvent } from 'react';
import '../css/AuthBox.scss';

function AuthBox(props: {
  children: ReactNode;
  title: string;
  onSubmit: (e?: FormEvent<HTMLFormElement> | undefined) => void;
  isSubmitting: boolean;
  submitEnabled: boolean;
  errorMessgae?: string;
}) {
  return (
    <div id='auth-box-wrapper'>
      <div id='auth-box'>
        <h2>{props.title}</h2>
        <form onSubmit={props.onSubmit}>
          <div id='auth-box-children-wrapper'>
            <p className='auth-box-error'>{ props.errorMessgae }</p>
            {props.children}
          </div>
          <input type="submit" value="Submit" disabled={props.isSubmitting || !props.submitEnabled} />
        </form>
      </div>
    </div>
  );


}

export default AuthBox;