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
 * Values for the upload form.
 * 
 * @typedef {Object} UploadValues
 * @property {string} packageName The name of the package.
 * @property {string} packageId The identifier of the package.
 * @property {string} packageType The type of the package.
 * @property {string} description The description of the package.
 */
type UploadValues = {
  packageName: string;
  packageId: string;
  packageType: string;
  description: string;
  initialVersion: string;
};

/**
 * The state of the upload page
 * 
 * @typedef {Object} UploadState
 * @property {Object} errors The errors for each field, the same items in {@linkcode UploadValues}, but with all keys optional.
 * @property {string} [uploadError] Any error that occured after pressing the upload button.
 * @property {File} [file] The file to upload to the server.
 */
 type UploadState = {
   errors: Partial<UploadValues>;
   uploadError?: string;
   file?: File;
}

import { Formik, FormikErrors } from 'formik';
import { Component, ReactNode } from 'react';
import InputDropdown from '../components/Input/InputDropdown';
import InputField, { InputFieldProps } from '../components/Input/InputField';
import MainContainer from '../components/Main Container/MainContainer';
import MainContainerRight from '../components/Main Container/MainContainerRight';
import ErrorMessage from '../components/ErrorMessage';
import '../css/Upload.scss';
import { checkAuth, delToken } from '../scripts/tokenStorage';
import InputArea, { InputAreaProps } from '../components/Input/InputArea';
import Version from '../scripts/version';
import axios, { AxiosError } from 'axios';
import InputFile, { InputFileProps } from '../components/Input/InputFile';

// Compute the default option
const packageTypes = {
  aircraft: 'Aircraft',
  scenery: 'Scenery',
  plugin: 'Plugin',
  livery: 'Livery',
  executable: 'Executable',
  other: 'Other'
};
const defaultPackage = Object.entries(packageTypes).sort((a, b) => a[1].localeCompare(b[1]))[0][0];

class Upload extends Component {

  state: UploadState;

  constructor(props: Record<string, never>) {
    super(props);

    this.validate = this.validate.bind(this);
    this.state = {
      errors: {}
    };
  }

  validate({ packageName, packageId, description, initialVersion }: UploadValues): FormikErrors<UploadValues> {
    packageId = packageId.trim().toLowerCase();
    packageName = packageName.trim();
    description = description.trim();
    initialVersion = initialVersion.trim().toLowerCase();
    
    const errors = {} as UploadState['errors'];

    if (packageId.length < 6)
      errors.packageId = 'Package identifier too short';
    else if (packageId.length > 32)
      errors.packageId = 'Package identifier too short';
    else if (!/^[a-z0-9_.]+$/i.test(packageId)) 
      errors.packageId = 'Package identifier has invalid characters';
      
    if (packageName.length < 3)
      errors.packageName = 'Package name too short';
    else if (packageName.length > 32)
      errors.packageName = 'Package name too long';
    
    if (description.length < 10)
      errors.description = 'Description too short';
    else if (description.length > 8192)
      errors.description = 'Description too long';
    
    if (initialVersion.length < 1)
      errors.initialVersion = 'Version string required';
    else if (initialVersion.length > 15)
      errors.initialVersion = 'Version string too long';
    else if (!Version.fromString(initialVersion))
      errors.initialVersion = 'Invalid version string';
    
    this.setState({
      errors,
      uploadError: ''
    } as UploadState);
    return {};
  }

  render(): ReactNode {
    return (
      <MainContainer>
        <MainContainerRight title='Upload'>
          <>
            <Formik
              validate={this.validate}
              validateOnChange={true}
              validateOnMount={true}
              initialValues={{
                packageName: '',
                packageId: '',
                packageType: '',
                description: '',
                initialVersion: '1.0.0',
                file: void(0)
              } as UploadValues}
              onSubmit={
                async (values, { setSubmitting }) => {
                
                  const packageId = values.packageId.trim().toLowerCase();
                  const packageName = values.packageName.trim();
                  const packageType = (values.packageType || defaultPackage).trim().toLowerCase();
                  const description = values.description.trim();
                  const initialVersion = values.initialVersion.trim().toLowerCase(); 

                  const formData = new FormData();
                  formData.append('packageId', packageId);
                  formData.append('packageName', packageName);
                  formData.append('packageType', packageType);
                  formData.append('description', description);
                  formData.append('initialVersion', initialVersion);

                  // Types are broken for FormData
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formData.append('file', (document.getElementById('package-file') as any).files[0]);

                  try {
                    await axios({
                      url: 'http://localhost:5020/packages/new',
                      method: 'POST',
                      data: formData,
                      headers: {
                        Authorization: checkAuth() as string
                      }
                    });
                    window.location.href = '/packages?s=' + encodeURIComponent(btoa('Registered new package successfully'));
                  } catch (e){
                    if (!(e instanceof AxiosError)) {
                      this.setState({
                        uploadError: 'An unkown error occured'
                      });
                    } else {
                      switch (e.response?.status) {
                      case 400:
                        this.setState({
                          uploadError: {
                            missing_form_data: 'How did you manage this? 0_o',
                            short_id: 'Package identifier is too short',
                            long_id: 'Package identifier is too long',
                            invalid_id: 'Package identifier uses invalid characters',
                            short_name: 'Package name is too short',
                            long_name: 'Package name is too long',
                            short_desc: 'Description is too short',
                            long_desc: 'Description is too long',
                            profane_id: 'Do not use profanity in package identifier, contact support if you believe this is in error',
                            profane_name: 'Do not use profanity in package name, contact support if you believe this is in error',
                            profane_desc: 'Do not use profanity in description, contact support if you believe this is in error',
                            id_in_use: 'Package identifier already in use',
                            name_in_use: 'Package name already in use'
                          }[e.response?.data as string]
                            ?? ('Unkown issue with form: ' + e.response?.data as string)
                        } as Partial<UploadState>);
                        break;
                      case 401:
                        window.location.href = '/';
                        delToken();
                        break;
                      case 422:
                        this.setState({
                          uploadError: {
                            invalid_package: 'The uploaded package is invalid'
                          }[e.response?.data as string]
                              ?? ('Unknown issue with uploaded file: ' + e.response?.data)
                        } as Partial<UploadState>);
                        break;
                      case 500:
                        this.setState({
                          uploadError: 'Internal server error, try again'
                        } as UploadState);
                        break;
                      default:
                        this.setState({
                          uploadError: 'An unknown error occured'
                        } as Partial<UploadState>);
                      }
                    }

                  } finally {
                    setSubmitting(false);
                  }
                }
              }>
              {({
                handleChange,
                handleSubmit,
                isSubmitting
              }) => {

                // We need this due to TypeScript being weird
                // https://stackoverflow.com/questions/48240449/type-is-not-assignable-to-type-intrinsicattributes-intrinsicclassattribu
                const packageNameData: InputFieldProps = {
                  classes: ['package-upload-input'],
                  name: 'packageName',
                  title: 'Package Name',
                  width: '35%',
                  minLength: 3,
                  maxLength: 32,
                  onChange: handleChange,
                  error: this.state.errors.packageName
                };

                const packageIdData: InputFieldProps = {
                  classes: ['package-upload-input'],
                  name: 'packageId',
                  title: 'Package Identifier',
                  minLength: 6,
                  maxLength: 32,
                  width: '35%',
                  onChange: handleChange,
                  error: this.state.errors.packageId
                };
              
                const descTextAreaData: InputAreaProps = {
                  name: 'description',
                  title: 'Description',
                  minLength: 10,
                  maxLength: 8192,
                  onChange: handleChange,
                  error: this.state.errors.description
                };

                const initialVersionField: InputFieldProps = {
                  name: 'initialVersion',
                  title: 'Initial Version',
                  placeholder: 'x.x.x',
                  minLength: 1,
                  maxLength: 15,
                  width: '25%',
                  defaultValue: '1.0.0',
                  error: this.state.errors.initialVersion
                };

                const inputFileProps: InputFileProps = {
                  label: 'Files',
                  name: 'file',
                  types: '.zip',
                  onChange: e => {
                    if (!e.target.files?.length)
                      return;
                    this.setState({
                      file: e.target.files[0]
                    } as Partial<UploadState>);
                  }
                };

                return (
                  <>
                    <ErrorMessage text={this.state.uploadError ?? ''} show={!!this.state.uploadError} />
                    <form onSubmit={handleSubmit} onChange={handleChange}>
                      <div className='upload-input-section'>
                        <InputField {...packageNameData}/>
                        <InputField {...packageIdData} />
                        <InputDropdown
                          classes={['package-upload-input', 'right']}
                          name='packageType'
                          label='Package Type'
                          items={packageTypes}
                          onChange={handleChange}
                        />
                      </div>
                      <div className='upload-input-section top-margin bottom-margin'>
                        <InputArea {...descTextAreaData} />
                      </div>
                      <div className='upload-input-section top-margin'>
                        <h2>Initial Package Release</h2>
                        <div className='right-half'>
                          <InputField {...initialVersionField} />
                        </div>
                        <div className='left-half'>
                          <InputFile {...inputFileProps}></InputFile>
                        </div>
                      </div>
                      <div className='upload-input-section'>
                        <input
                          type="submit"
                          value="Upload"
                          disabled={!this.state.file || isSubmitting || !!Object.keys(this.state.errors).length}
                        />
                      </div>
                    </form>
                  </>
                );  
              }}
            </Formik>
          </>
        </MainContainerRight>
      </MainContainer>
    );
  }
}

export default Upload;