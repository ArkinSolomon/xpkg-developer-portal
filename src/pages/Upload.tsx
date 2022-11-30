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
 * The state of the upload page
 * 
 * @typedef {Object} UploadState
 * @property {string} [packageName] The errors with the package name.
 * @property {string} [packageId] The errors with the package id.
 */
type UploadState = {
  errors: {
    packageName?: string;
    packageId?: string;
  }
}

/**
 * Values for the upload form.
 * 
 * @typedef {Object} UploadValues
 * @property {string} packageName The name of the package.
 * @property {string} packageId The identifier of the package.
 */
type UploadValues = {
  packageName: string;
  packageId: string;
};

import { Formik, FormikErrors } from 'formik';
import { Component, ReactNode } from 'react';
import InputField from '../components/InputField';
import MainContainer from '../components/MainContainer';
import MainContainerRight from '../components/MainContainerRight';
import '../css/Upload.scss';

class Upload extends Component {

  state: UploadState;

  constructor(props: Record<string, never>) {
    super(props);

    this.validate = this.validate.bind(this);
    this.state = {
      errors: {}
    };
  }

  validate({ packageName, packageId }: UploadValues): FormikErrors<UploadValues> {
    packageId = packageId.trim().toLowerCase();
    packageName = packageName.trim();
    
    const errors = {} as UploadState['errors'];

    if (packageId.length < 6)
      errors.packageId = 'Package id too short';
    else if (packageId.length > 32)
      errors.packageId = 'Package id too short';
    
    if (packageName.length < 3)
      errors.packageName = 'Package name too short';
    else if (packageName.length > 32)
      errors.packageName = 'Package name too long';

    this.setState({ errors });
    return {};
  }

  render(): ReactNode {
    return (
      <MainContainer>
        <MainContainerRight title='Upload'>
          <Formik
            validate={this.validate}
            validateOnChange={true}
            validateOnMount={true}
            initialValues={{
              packageName: '',
              packageId: ''
            } as UploadValues}
            onSubmit={
              (values, { setSubmitting }) => {
                setSubmitting(false);
                
                const packageId = values.packageId.trim().toLowerCase();
                const packageName = values.packageName.trim();
              }
            }>
            {({
              handleChange,
              handleSubmit,
              isSubmitting
            }) => {
              return (
                <form onSubmit={handleSubmit}>
                  <div className='upload-input-section'>
                    <InputField
                      classes={['package-upload-field']}
                      name='packageName'
                      title='Package Name'
                      width='30%'
                      onChange={handleChange}
                    />
                    <InputField
                      classes={['package-upload-field']}
                      name='packageId'
                      title='Package Identifier'
                      width='30%'
                      onChange={handleChange}
                    />
                  </div>
                  <div className='upload-input-section'>
                    <input
                      type="submit"
                      value="Upload"
                      disabled={isSubmitting || !!Object.keys(this.state.errors).length}
                    />
                  </div>
                </form>
              );  
            }}
          </Formik>
        </MainContainerRight>
      </MainContainer>
    );
  }
}

export default Upload;