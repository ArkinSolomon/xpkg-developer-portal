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
 * The state used for this component.
 * 
 * @typedef {Object} LoginState
 * @property {string} errorMessage The message of the error. Empty string if there is no error.
 * @property {boolean} invalidForm True if the form is invalid and should not allow submissions.
 */
type LoginState = {
  errorMessage: string;
  invalidForm: boolean;
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

/**
 * Error object used to keep track of errors for each field.
 * 
 * @typedef {Object } LoginErrors
 * @property {string} email Any issue with the email input.
 * @property {string} password Any issue with the password input.
 */
type LoginErrors = {
  email: string;
  password: string;
}

import { Component, FormEvent } from 'react';
import { Formik, FormikErrors } from 'formik';
import AuthBox from '../components/AuthBox';
import InputField from '../components/InputField';
import '../css/AuthBox.scss';
import '../css/AuthMenus.scss';
import * as tokenStorage from '../scripts/tokenStorage';
import * as http from '../scripts/http';
import Checkbox from '../components/Checkbox';
import ErrorMessage from '../components/ErrorMessage';
import * as util from '../scripts/util';

class Login extends Component {
  constructor(props: Record<string, never>) {
    super(props);
    this.state = {
      errorMessage: '',
      invalidForm: true
    } as LoginState;

    this.validate = this.validate.bind(this);
  }

  validate({ email, password }: LoginValues):FormikErrors<LoginValues> {
    let invalidForm = false;
    invalidForm = !util.validateEmail(email) || !util.validatePassword(password);
    this.setState({
      errorMessage: '',
      invalidForm
    } as LoginState);
    return {};
  }

  render() {
    return (
      <Formik
        validate={this.validate}
        validateOnChange={true}
        validateOnMount={true}
        initialValues={{
          email: '',
          password: '',
          rememberMe: false
        } as LoginValues}
        onSubmit={
          (values, { setSubmitting }) => {
            this.setState({
              errorMessage: ''
            });
            const { email, password } = values;
            http.post('http://localhost:5020/auth/login', { email, password }, (err, r) => {
              setSubmitting(false);
              if (err)
                return console.error(err);
              const resp = r as XMLHttpRequest;
              if (resp.status !== 200) {
                let message = 'An unknown error occured';
                switch (resp.status) {
                case 400:
                  message = 'Bad request';
                  break;
                case 403:
                  message = 'Invalid username/password combination';
                  break;
                case 500:
                  message = 'Internal server error';
                  break;
                }
                this.setState({
                  errorMessage: message
                });
              } else {
                const { token } = JSON.parse(resp.response);
                tokenStorage.saveToken(token, values.rememberMe);
              }
            });
          }
        }>
        {({
          handleChange,
          handleSubmit,
          isSubmitting
        }) => {
          const linkDisabled = isSubmitting ? 'linkDisabled' : '';
          const errorMessageActive = (this.state as LoginState).errorMessage !== '';
          return (
            <AuthBox title='Login' onSubmit={handleSubmit} isSubmitting={isSubmitting} submitEnabled={!errorMessageActive && !(this.state as LoginState).invalidForm}>
              <ErrorMessage text={(this.state as LoginState).errorMessage} show={errorMessageActive} width='80%' center={true} />
              <InputField name='email' title='Email' center={true} width='80%' onChange={handleChange} />
              <InputField name='password' title='Password' center={true} width='80%' type='password' onChange={handleChange} />
              <Checkbox name='rememberMe' title='Remember Me' center={true} onChange={handleChange} />
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
