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
import AuthBox from '../components/AuthBox';
import InputField from '../components/InputField';
import '../css/AuthMenus.scss';

function Create() {
  return (
    <p>Create</p>
    // <AuthBox title='Create new Account'>
    //   <InputField name='name' title='Name' center={true} width='80%' />
    //   <InputField name='email' title='Email' center={true} width='80%' />
    //   <InputField name='password' title='Password' center={true} width='80%' type='password' />
    //   <InputField name='confirm-password' title='Confirm Password' center={true} width='80%' type='password' />
    //   <div className="help-links">
    //     <a href="/">Login to existing account</a>
    //   </div>
    // </AuthBox>
  );
}

export default Create;
