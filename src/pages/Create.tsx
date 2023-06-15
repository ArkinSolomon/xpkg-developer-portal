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
 * @property {boolean} invalidForm True if the form is invalid and should not allow submissions.
 */
 type CreateState = {
  errorMessage: string;
  invalidForm: boolean;
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
import ErrorMessage from '../components/ErrorMessage';
import * as util from '../scripts/validators';
import HTTPMethod from 'http-method-enum';

class Create extends Component {
  constructor(props: Record<string, never>) {
    super(props);
    this.state = {
      errorMessage: '',
      invalidForm: true
    } as CreateState;

    this.validate = this.validate.bind(this);
    
    const token = tokenStorage.checkAuth();
    if (token)
      window.location.href = '/packages';
  }

  validate({ email, password, checkPassword, name, agree }: CreateValues): FormikErrors<CreateValues> {
    let invalidForm = false;
    invalidForm = !util.validateEmail(email) || !util.validatePassword(password)
      || typeof name !== 'string' || name.length < 3 || name.length > 32
      || checkPassword !== password
      || !agree;
    this.setState({
      errorMessage: '',
      invalidForm
    } as CreateState);

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
        } as CreateValues}
        onSubmit={
          (values, { setSubmitting }) => {
            this.setState({
              errorMessage: ''
            } as Partial<CreateState>);
            const { email, password, name } = values;
            http.httpRequest('http://localhost:5020/auth/create',HTTPMethod.POST, void (0), { email, password, name }, (err, r) => {
              setSubmitting(false);
              if (err) {
                this.setState({
                  errorMessage: 'Could not connect to server'
                });
                return console.error(err);
              }
              const resp = r as XMLHttpRequest;

              if (resp.status !== 200) {
                let message = 'An unknown error occured';
                const errors: Record<number, string> = {
                  400: 'Bad request',
                  409: 'Email or name in use',
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
          const errorMessageActive = (this.state as CreateState).errorMessage !== '';

          const emailFieldData: InputFieldProps = {
            name: 'email',
            label: 'Email',
            onChange: handleChange
          };

          const nameFieldData: InputFieldProps = {
            name:'name',
            label:'Name',
            onChange: handleChange
          };
          
          const passwordFieldData: InputFieldProps = {
            name: 'password',
            label: 'Password',
            type: 'password',
            onChange: handleChange
          };

          const checkPasswordFieldData: InputFieldProps = {
            name: 'checkPassword',
            label: 'Re-enter Password',
            type: 'password',
            onChange: handleChange
          };

          return (
            <AuthBox title='Create Account' onSubmit={handleSubmit} isSubmitting={isSubmitting} submitEnabled={!errorMessageActive && !(this.state as CreateState).invalidForm}>
              <ErrorMessage text={(this.state as CreateState).errorMessage} show={errorMessageActive} width='80%' center={true} />
              <InputField {...emailFieldData} />
              <InputField {...nameFieldData}/>
              <InputField {...passwordFieldData}/>
              <InputField {...checkPasswordFieldData}/>
              <Checkbox name='rememberMe' title='Remember Me' onChange={handleChange} />
              <Checkbox name='agree' title='I agree to the privacy policy' onChange={handleChange} />
              <div className="help-links">
                <a href="/" className={linkDisabled}>Login Instead</a>
                <a href="/privacy-policy" className={linkDisabled}>Privacy Policy</a>
              </div>
            </AuthBox>
          );
        }
        }
      </Formik >
    );
  }
}

export default Create;