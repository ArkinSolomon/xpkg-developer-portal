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
 * The state used for this component.
 * 
 * @typedef {Object} CreateState
 * @property {string} errorMessage The message of the error. Empty string if there is no error.
 * @property {string} [recaptchaToken] The reCAPTCHA validation token to be sent to the server.
 * @property {Partial<CreateValues>} errors The errors for each text box.
 */
 type CreateState = {
  errorMessage: string;
  recaptchaToken?: string;
  errors: Partial<CreateValues>;
}

/**
 * The values in the form.
 * 
 * @typedef {Object} CreateValues
 * @property {string} email The email the author is using to create their account.
 * @property {string} name The name of the new user.
 * @property {string} password The password the user is using to create their account.
 * @property {string} checkPassword The password again, to ensure they are the same.
 * @property {boolean} rememberMe True if we should save the token to local storage or session storage.
 * @property {boolean} agree True if the user has checked the agree box.
 */
type CreateValues = {
  email: string;
  name: string;
  password: string;
  checkPassword: string;
  rememberMe: boolean;
  agree: boolean;
}

import { Component } from 'react';
import { Formik, FormikErrors } from 'formik';
import AuthBox from '../components/AuthBox';
import InputField, { InputFieldProps } from '../components/Input/InputField';
import '../css/AuthBox.scss';
import * as tokenStorage from '../scripts/tokenStorage';
import * as http from '../scripts/http';
import Checkbox from '../components/Input/InputCheckbox';
import * as util from '../scripts/validators';
import HTTPMethod from 'http-method-enum';
import ReCAPTCHA from 'react-google-recaptcha';

class Create extends Component {

  state: CreateState;

  constructor(props: Record<string, never>) {
    super(props);
    this.state = {
      errorMessage: '',
      errors: {}
    };

    const token = tokenStorage.checkAuth();
    if (token) {
      const possibleRedir = sessionStorage.getItem('post-auth-redirect');
      if (possibleRedir) {
        sessionStorage.removeItem('post-auth-redirect');
        window.location.href = possibleRedir;
      }else 
        window.location.href = '/packages';
    }
    
    this._validate = this._validate.bind(this);
    this._recaptchaChange = this._recaptchaChange.bind(this);
    this._submit = this._submit.bind(this);
  }

  private _removeMessageAfterDelay() {
    setTimeout(() => this.setState({
      errorMessage: ''
    } as Partial<CreateState>), 3005);
  }

  private _recaptchaChange(token: string|null) {
    this.setState({
      recaptchaToken: token
    } as Partial<CreateState>);
  }

  private _validate({ email, password, checkPassword, name, agree }: CreateValues): FormikErrors<CreateValues> {
    const errors: Partial<CreateValues> = {};

    if (email.length < 5)
      errors.email = 'Email address too short';
    else if (email.length > 64)
      errors.email = 'Email address too long';
    else if (!util.validateEmail(email))
      errors.email = 'Invalid email address';
    
    if (name.length < 3)
      errors.name = 'Name too short';
    else if (name.length > 32)
      errors.name = 'Name too long';
    else if (!util.validateName(name))
      errors.name = 'Invalid name';
    
    if (password.length < 8)
      errors.password = 'Password too short';
    else if (password.length > 64)
      errors.password = 'Password too long';
    else if (password.toLowerCase() === 'password')
      errors.password = 'Password can not be "password"';
    else if (!util.validatePassword(password))
      errors.password = 'Invalid password';
    
    if (password !== checkPassword)
      errors.checkPassword = 'Passwords do not match';
    
    let errorMessage = '';
    if (!agree && !Object.keys(errors).length)
      errorMessage = 'You can not sign up without agreeing to the privacy policy';
    
    this.setState({
      errorMessage,
      errors
    } as CreateState);

    // We handle errors on our own, so we just don't return anything
    return {};
  }

  private async _submit(values: CreateValues, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void; }) {
    this.setState({
      errorMessage: ''
    } as Partial<CreateState>);
    const { email, password, name } = values;

    http.httpRequest(`${window.REGISTRY_URL}/auth/create`, HTTPMethod.POST, void (0), {
      email,
      password,
      name,
      validation: this.state.recaptchaToken as string
    }, (err, r) => {
      setSubmitting(false);
      if (err) {
        this.setState({
          errorMessage: 'Could not connect to server'
        });
        return console.error(err);
      }
      const resp = r as XMLHttpRequest;

      if (resp.status !== 200) {
        let errorMessage = 'An unknown error occured';
        switch (resp.status) {
        case 400:
          errorMessage = 'Bad request';
          break;
        case 403: {
          const itemInUse = resp.responseText as 'email' | 'name';
          errorMessage = `${itemInUse === 'email' ? 'Email' : 'Name'}`;
          break;
        }
        case 409:
          errorMessage = 'Unable, suspicious activity';
          this._removeMessageAfterDelay();
          break;
        case 418: 
          errorMessage = 'Ensure you have filled out the captcha';
          this._removeMessageAfterDelay();
          break;
        case 429: 
          errorMessage = 'You are doing that too much, please slow down';
          this._removeMessageAfterDelay(); 
          break;
        case 500:
          errorMessage = 'Internal server error, please try again later';
          this._removeMessageAfterDelay();
          break;
        }
        
        this.setState({
          errorMessage
        } as Partial<CreateState>);
      } else {
        const { token } = JSON.parse(resp.response);
        tokenStorage.saveToken(token, values.rememberMe);
        
        const possibleRedir = sessionStorage.getItem('post-auth-redirect');
        if (possibleRedir) {
          sessionStorage.removeItem('post-auth-redirect');
          return window.location.href = possibleRedir;
        }

        window.location.href = '/packages';
      }
    });
  }

  render() {
    return (
      <Formik
        validate={this._validate}
        validateOnChange={true}
        validateOnMount={true}
        initialValues={{
          email: '',
          name: '',
          password: '',
          rememberMe: false,
          agree: false
        } as CreateValues}
        onSubmit={this._submit}>
        {({
          handleChange,
          handleSubmit,
          isSubmitting,
        }) => {
          const linkDisabled = isSubmitting ? 'linkDisabled' : '';
          const errorMessageActive = this.state.errorMessage !== '';

          const emailFieldData: InputFieldProps = {
            name: 'email',
            label: 'Email',
            onChange: handleChange,
            minLength: 5,
            maxLength: 64,
            error: this.state.errors.email
          };

          const nameFieldData: InputFieldProps = {
            name:'name',
            label:'Name',
            onChange: handleChange,
            minLength: 3,
            maxLength: 32,
            error: this.state.errors.name
          };
          
          const passwordFieldData: InputFieldProps = {
            name: 'password',
            label: 'Password',
            type: 'password',
            onChange: handleChange,
            minLength: 8,
            maxLength: 64,
            error: this.state.errors.password
          };

          const checkPasswordFieldData: InputFieldProps = {
            name: 'checkPassword',
            label: 'Re-enter Password',
            type: 'password',
            onChange: handleChange,
            minLength: 8,
            maxLength: 64,
            error: this.state.errors.checkPassword
          };

          return (
            <AuthBox
              title='Create Account'
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitEnabled={!errorMessageActive && !Object.keys(this.state.errors).length && !!this.state.recaptchaToken}
              errorMessgae={this.state.errorMessage}
            >
              <InputField {...emailFieldData} />
              <InputField {...nameFieldData}/>
              <InputField {...passwordFieldData}/>
              <InputField {...checkPasswordFieldData} />
              
              <div className='flex justify-center my-4'>
                <ReCAPTCHA
                  sitekey={window.SITE_KEY}
                  onChange={this._recaptchaChange}
                />
              </div>

              <Checkbox name='rememberMe' title='Remember Me' onChange={handleChange} />
              <Checkbox name='agree' title='I agree to the privacy policy' onChange={handleChange} />
              <div className='help-links'>
                <a href='/' className={linkDisabled}>Login Instead</a>
                <a href='/privacy-policy' className={linkDisabled}>Privacy Policy</a>
              </div>
            </AuthBox>
          );
        }}
      </Formik >
    );
  }
}

export default Create;