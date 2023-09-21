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
 * @typedef {Object} LoginState
 * @property {string} errorMessage The message of the error. Empty string if there is no error.
 * @property {Partial<LoginValues>} errors The errors with each field in the form.
 * @property {string} [recaptchaToken] The recaptcha token to send to the server.
 */
type LoginState = {
  errorMessage: string;
  errors: Partial<LoginValues>;
  recaptchaToken?: string;
}

/**
 * The values in the form.
 * 
 * @typedef {Object} LoginValues
 * @property {string} email The email the user is using to login.
 * @property {string} password The password the user is using to login.
 * @property {boolean} rememberMe True if we should save the token to local storage or session storage.
 */
type LoginValues = {
  email: string;
  password: string;
  rememberMe: boolean;
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

class Login extends Component {

  state: LoginState;

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
    } as Partial<LoginState>), 3005);
  }

  private _recaptchaChange(token: string|null) {
    this.setState({
      recaptchaToken: token
    } as Partial<LoginState>);
  }

  private _validate({ email, password }: LoginValues): FormikErrors<LoginValues> {
    const errors: Partial<LoginValues> = {};

    if (email.length < 5)
      errors.email = 'Email address too short';
    else if (email.length > 64)
      errors.email = 'Email address too long';
    else if (!util.validateEmail(email))
      errors.email = 'Invalid email address';
    
    if (!util.validatePassword(password))
      
      // Not shown
      errors.password = 'invalid password';

    this.setState({
      errorMessage: '',
      errors
    } as LoginState);

    // We handle errors on our own, so we just don't return anything
    return {};
  }

  private async _submit(values: LoginValues, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void; }) {
    this.setState({
      errorMessage: ''
    });
    const { email, password } = values;

    http.httpRequest(`${window.REGISTRY_URL}/auth/login`, HTTPMethod.POST, void (0), {
      email,
      password,
      validation: this.state.recaptchaToken as string
    }, (err, r) => {
      setSubmitting(false);
      if (err) {
        this.setState({
          errorMessage: 'There was an error connecting to the server'
        });
        this._removeMessageAfterDelay();
        return console.error(err);
      }
      
      const resp = r as XMLHttpRequest;

      if (resp.status !== 200) {
        let errorMessage = 'An unknown error occured';
        switch (resp.status) {
        case 400:
          errorMessage = 'Bad request';
          break;
        case 401:
          errorMessage = 'Invalid email and/or password';
          break;
        case 409:
          errorMessage = 'Unable, suspicious activity';
          this._removeMessageAfterDelay();
          break;
        case 418:
          errorMessage = 'Ensure you have filled out the captcha';
          break;
        case 429:
          errorMessage = 'You are doing that too much, please slow down';
          break;
        case 500:
          errorMessage = 'Internal server error, please try again later';
          break;
        }
        this.setState({
          errorMessage
        } as Partial<LoginState>);

        if (resp.status !== 400)
          this._removeMessageAfterDelay();
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
          password: '',
          rememberMe: false
        } as LoginValues}
        onSubmit={ this._submit }>
        {({
          handleChange,
          handleSubmit,
          isSubmitting
        }) => {
          const linkDisabled = isSubmitting ? 'linkDisabled' : '';
          const errorMessageActive = (this.state as LoginState).errorMessage !== '';

          const emailFieldData: InputFieldProps = {
            name: 'email',
            label: 'Email',
            onChange: handleChange,
            minLength: 5,
            maxLength: 64,
            error: this.state.errors.email
          };

          const passwordFieldData: InputFieldProps = {
            name: 'password',
            label: 'Password',
            type: 'password',
            onChange: handleChange,
            minLength: 8,
            maxLength: 64
          };

          return (
            <AuthBox
              title='Login'
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitEnabled={!errorMessageActive && !Object.keys(this.state.errors).length && !!this.state.recaptchaToken}
              errorMessgae={this.state.errorMessage}
            >
              <InputField {...emailFieldData} />
              <InputField {...passwordFieldData} />

              <div className='flex justify-center my-4'>
                <ReCAPTCHA
                  sitekey={window.SITE_KEY}
                  onChange={this._recaptchaChange}
                />
              </div>

              <Checkbox
                name='rememberMe'
                title='Remember Me'
                onChange={handleChange} />
              <div className="help-links">
                <a href="/create" className={linkDisabled}>Create account</a>
                <a href="/forgot" className={linkDisabled}>Forgot Password</a>
              </div>
            </AuthBox>
          );
        }
        }
      </Formik >
    );
  }
}

export default Login;
