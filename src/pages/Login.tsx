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

import { Component } from 'react';
import { Formik, FormikErrors } from 'formik';
import AuthBox from '../components/AuthBox';
import InputField from '../components/Input/InputField';
import '../css/AuthBox.scss';
import '../css/AuthMenus.scss';
import * as tokenStorage from '../scripts/tokenStorage';
import * as http from '../scripts/http';
import Checkbox from '../components/Input/InputCheckbox';
import ErrorMessage from '../components/ErrorMessage';
import * as util from '../scripts/validators';

class Login extends Component {
  constructor(props: Record<string, never>) {
    super(props);
    this.state = {
      errorMessage: '',
      invalidForm: true
    } as LoginState;

    this.validate = this.validate.bind(this);

    const token = tokenStorage.checkAuth();
    if (token)
      window.location.href = '/packages';
  }

  validate({ email, password }: LoginValues): FormikErrors<LoginValues> {
    const invalidForm = !util.validateEmail(email) || !util.validatePassword(password);
    this.setState({
      errorMessage: '',
      invalidForm
    } as LoginState);

    // We handle errors on our own, so we just don't return anything
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
            http.postCB('http://localhost:5020/auth/login', void (0), { email, password }, (err, r) => {
              setSubmitting(false);
              if (err)
                return console.error(err);
              
              const resp = r as XMLHttpRequest;

              if (resp.status !== 200) {
                let message = 'An unknown error occured';
                const errors: Record<number, string> = {
                  400: 'Bad request',
                  403: 'Invalid username/password combination',
                  500: 'Internal server error'
                };
                if (Object.hasOwnProperty.call(errors, resp.status))
                  message = errors[resp.status];
                this.setState({
                  errorMessage: message
                });
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
        }>
        {({
          handleChange,
          handleSubmit,
          isSubmitting
        }) => {
          const linkDisabled = isSubmitting ? 'linkDisabled' : '';
          const errorMessageActive = (this.state as LoginState).errorMessage !== '';

          const emailFieldData = {
            name: 'email',
            title: 'Email',
            center: true,
            width: '80%',
            onChange: handleChange
          };

          const passwordFieldData = {
            name: 'password',
            title: 'Password',
            center: true,
            width: '80%',
            type: 'password',
            onChange: handleChange
          };

          return (
            <AuthBox
              title='Login'
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitEnabled={!errorMessageActive && !(this.state as LoginState).invalidForm}
            >
              <ErrorMessage
                text={(this.state as LoginState).errorMessage}
                show={errorMessageActive}
                width='80%'
                center={true}
              />
              <InputField {...emailFieldData} />
              <InputField {...passwordFieldData} />
              <Checkbox
                name='rememberMe'
                title='Remember Me'
                center={true}
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
