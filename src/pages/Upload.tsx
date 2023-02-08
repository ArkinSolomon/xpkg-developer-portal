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
 * Values for the upload form.
 * 
 * @typedef {Object} UploadValues
 * @property {string} packageName The name of the package.
 * @property {string} packageId The identifier of the package.
 * @property {string} packageType The type of the package.
 * @property {string} description The description of the package.
 * @property {string} xplaneVersion The X-Plane compatibility version.
 * @property {boolean} isPublic True if the package is public.
 * @property {boolean} isPrivate True if the package is private.
 * @property {boolean} isStored True if the package is stored in the registry. 
 */
type UploadValues = {
  packageName: string;
  packageId: string;
  packageType: string;
  description: string;
  initialVersion: string;
  xplaneVersion: string;
  isPublic: boolean;
  isPrivate: boolean;
  isStored: boolean;
};

/**
 * The state of the upload page
 * 
 * @typedef {Object} UploadState
 * @property {Object} errors The errors for each field, the same items in {@linkcode UploadValues}, but with all keys optional.
 * @property {string} [uploadError] Any error that occured after pressing the upload button.
 * @property {File} [file] The file to upload to the server.
 * @property {JSX.Element} dependencyList The dependency list rendered. 
 * @property {JSX.Element} optionalDependencyList The optional dependency list rendered.
 * @property {JSX.Element} incompatibilityList The incompatibility list rendered.
 */
type UploadState = {
  errors: Partial<UploadValues>;
  uploadError?: string;
  file?: File;
  dependencyList: JSX.Element
  optionalDependencyList: JSX.Element;
  incompatibilityList: JSX.Element;
};

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
import InputCheckbox from '../components/Input/InputCheckbox';
import PackageList, { PackageListProps } from '../components/PackageList';
import { nanoid } from 'nanoid';
import SelectionChecker from '../scripts/selectionChecker';
import { validateId } from '../scripts/validators';

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

  private _isMounted = false;
  private _dependencies: [string, string][];
  private _optionalDependencies: [string, string][];
  private _incompatibilities: [string, string][];

  constructor(props: Record<string, never>) {
    super(props);

    this._dependencies = [];
    this._optionalDependencies = [];
    this._incompatibilities = [];

    const lists = this._genLists();

    this.validate = this.validate.bind(this);
    this.state = {
      errors: {},
      ...lists
    };
  }

  componentDidMount(): void {
    this._isMounted = true;
  }

  validate({ packageName, packageId, description, initialVersion, xplaneVersion }: UploadValues): FormikErrors<UploadValues> {
    packageId = packageId.trim().toLowerCase();
    packageName = packageName.trim();
    description = description.trim();
    initialVersion = initialVersion.trim().toLowerCase();
    
    const errors = {} as UploadState['errors'];

    if (packageId.length < 6)
      errors.packageId = 'Package identifier too short';
    else if (packageId.length > 32)
      errors.packageId = 'Package identifier too short';
    else if (!validateId(packageId)) 
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
    
    if (xplaneVersion.length < 1)
      errors.xplaneVersion = 'X-Plane version selection required';
    else if (xplaneVersion.length > 256)
      errors.xplaneVersion = 'X-Plane version selection too long';
    else if (!new SelectionChecker(xplaneVersion).isValid)
      errors.xplaneVersion = 'X-Plane version selection invalid';
    
    this.setState({
      errors,
      uploadError: '',
    } as UploadState);
    return {};
  }

  private _genLists(): Pick<UploadState, 'dependencyList' | 'optionalDependencyList' | 'incompatibilityList'> {

    const dependencyListProps: PackageListProps = {
      initialValues: this._dependencies,
      onChange: (i, packageId, versionSelection) => {
        this._dependencies[i] = [packageId, versionSelection];
      }
    };

    const optionalDependencyList: PackageListProps = {
      initialValues: this._optionalDependencies,
      onChange: (i, packageId, versionSelection) => {
        this._optionalDependencies[i] = [packageId, versionSelection];
      }
    };

    const incompatibilityListProps: PackageListProps = {
      initialValues: this._incompatibilities,
      onChange: (i, packageId, versionSelection) => {
        this._incompatibilities[i] = [packageId, versionSelection];
      }
    };

    // Make sure to generate a random key each render, otherwise it'll be consistent and won't re-render
    const newValues: Pick<UploadState, 'dependencyList' | 'optionalDependencyList' | 'incompatibilityList'> = {
      dependencyList: <PackageList {...dependencyListProps} key={nanoid(5)} />,
      optionalDependencyList: <PackageList {...optionalDependencyList} key={nanoid(5)} />,
      incompatibilityList: <PackageList {...incompatibilityListProps} key={nanoid(5)} />
    };
    if (this._isMounted) 
      this.setState(newValues as Partial<UploadState>);
    return newValues;
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
                xplaneVersion: '',
                isPublic: true,
                isPrivate: false,
                isStored: true,
                file: void(0)
              } as UploadValues}
              onSubmit={
                async (values, { setSubmitting }) => {
                  setSubmitting(true);
                
                  const packageId = values.packageId.trim().toLowerCase();
                  const packageName = values.packageName.trim();
                  const packageType = (values.packageType || defaultPackage).trim().toLowerCase();
                  const description = values.description.trim();
                  const initialVersion = values.initialVersion.trim().toLowerCase(); 
                  const xplaneVersion = values.xplaneVersion.trim().toLowerCase();
                  const { isPublic, isPrivate, isStored } = values;

                  const formData = new FormData();
                  formData.append('packageId', packageId);
                  formData.append('packageName', packageName);
                  formData.append('packageType', packageType);
                  formData.append('description', description);
                  formData.append('initialVersion', initialVersion);
                  formData.append('xplaneVersion', xplaneVersion);
                  formData.append('isPublic', isPublic ? 'true' : 'false');
                  formData.append('isPrivate', isPrivate ? 'true' : 'false');
                  formData.append('isStored', isStored ? 'true' : 'false');
                  formData.append('dependencies', JSON.stringify(this._dependencies));
                  formData.append('optionalDependencies', JSON.stringify(this._optionalDependencies));
                  formData.append('incompatibilities', JSON.stringify(this._incompatibilities));
                  
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
                            missing_form_data: 'missing form data.',
                            short_id: 'package identifier is too short',
                            long_id: 'package identifier is too long',
                            invalid_id: 'package identifier uses invalid characters',
                            short_name: 'package name is too short',
                            long_name: 'package name is too long',
                            short_desc: 'description is too short',
                            long_desc: 'description is too long',
                            profane_id: 'do not use profanity in package identifier (contact support if you believe this is in error)',
                            profane_name: 'do not use profanity in package name (contact support if you believe this is in error)',
                            profane_desc: 'do not use profanity in description (contact support if you believe this is in error)',
                            id_in_use: 'package identifier already in use',
                            name_in_use: 'package name already in use'
                          }[e.response?.data as string]
                            ?? ('unkown issue with form: ' + e.response?.data as string)
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
                values,
                isSubmitting,
                setFieldValue
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
                  width: '66%',
                  defaultValue: '1.0.0',
                  error: this.state.errors.initialVersion
                };

                const inputFileProps: InputFileProps = {
                  id: 'package-file',
                  classes: ['float-right'],
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

                const xpCompatiblityFieldProps: InputFieldProps = {
                  title: 'X-Plane Compatiblity',
                  placeholder: 'x.x.x-x.x.x',
                  name: 'xplaneVersion',
                  minLength: 1,
                  maxLength: 256,
                  width: '88%',
                  error: this.state.errors.xplaneVersion
                };

                // Use `values` for previous state, and parameters for current state
                const checkboxUpdated = ({ isPublic, isPrivate }: UploadValues) => {
                  if (!values.isPrivate && isPrivate)
                    setFieldValue('isPublic', false, false);
                  
                  if (!values.isPublic && isPublic) {
                    setFieldValue('isPrivate', false, false);
                    setFieldValue('isStored', true, false);
                  }
                  
                  if (values.isPublic && !isPublic)
                    setFieldValue('isPrivate', true, false);
                  
                  if (values.isPrivate && !isPrivate) {
                    setFieldValue('isStored', true, false);
                    setFieldValue('isPublic', true, false);
                  }
                };
                const v = JSON.parse(JSON.stringify(values));

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
                      <div className='upload-input-section mt-9 bottom-margin'>
                        <InputArea {...descTextAreaData} />
                      </div>
                      <div className='upload-input-section mt-9'>
                        <h2>Initial Package Version</h2>
                        <div className='left-third'>
                          <InputField {...initialVersionField} />
                        </div>
                        <div className='middle-third'>
                          <label className='access-config-label'>Access Config</label>
                          <InputCheckbox className='ml-4' inline name="isPublic" title="Public" onChange={e => {
                            v.isPublic = !v.isPublic;
                            handleChange(e);
                            checkboxUpdated(v);
                          }} checked={values.isPublic} /> 
                          <InputCheckbox className='ml-4' inline name="isPrivate" title="Private" onChange={e => {
                            v.isPrivate = !v.isPrivate;
                            handleChange(e);
                            checkboxUpdated(v);
                          }} checked={values.isPrivate} /> 
                          <InputCheckbox className='ml-4' inline name="isStored" title="Is Saved" onChange={e => {
                            v.isStored = !v.isStored;
                            handleChange(e);
                            checkboxUpdated(v);
                          }} checked={values.isStored} disabled={values.isPublic} /> 
                        </div>
                        <div className='right-third'>
                          <InputFile {...inputFileProps}></InputFile>
                        </div>
                      </div>

                      <div className='upload-input-section mt-9'>
                        <div className='left-third'>
                          <InputField {...xpCompatiblityFieldProps} />
                        </div>  
                        {/* We don't need the right half */}
                      </div>
                      <div className='upload-input-section flex-section mt-9'>
                        <div className='left-third right-border'>
                          <p>Dependencies</p>
                          <div className='package-list'>
                            {this._dependencies.length === 0 && <p className='package-list-empty'>No dependencies</p>}
                            {this.state.dependencyList}
                          </div>
                          <div className='package-list-buttons'>
                            <button
                              className='list-mod-button left'
                              onClick={() => {
                                this._dependencies.push(['', '']);
                                this._genLists();
                              }}
                            >Add</button>
                            <button
                              className='list-mod-button right'
                              onClick={() => {
                                this._dependencies.pop();
                                this._genLists();
                              }}
                            >Remove</button>
                          </div>
                        </div>
                        <div className='middle-third right-border'>
                          <p>Optional Dependencies</p>
                          <div className='package-list'>
                            {this._optionalDependencies.length === 0 && <p className='package-list-empty'>No optional dependencies</p>}
                            {this.state.optionalDependencyList}
                          </div>
                          <div className='package-list-buttons'>
                            <button
                              className='list-mod-button left'
                              onClick={() => {
                                this._optionalDependencies.push(['', '']);
                                this._genLists();
                              }}
                            >Add</button>
                            <button
                              className='list-mod-button right'
                              onClick={() => {
                                this._optionalDependencies.pop();
                                this._genLists();
                              }}
                            >Remove</button>
                          </div>
                        </div>
                        <div className='right-third other-borders'>
                          <p>Incompatibilities</p>
                          <div className='package-list'>
                            {this._incompatibilities.length === 0 && <p className='package-list-empty'>No incompatibilities</p>}
                            {this.state.incompatibilityList}
                          </div>
                          <div className='package-list-buttons'>
                            <button
                              className='list-mod-button left'
                              onClick={() => {
                                this._incompatibilities.push(['', '']);
                                this._genLists();
                              }}
                            >Add</button>
                            <button
                              className='list-mod-button right'
                              onClick={() => {
                                this._incompatibilities.pop();
                                this._genLists();
                              }}
                            >Remove</button>
                          </div>
                        </div>
                      </div>
                      <div className='upload-input-section relative mt-9'>
                        <input
                          type="submit"
                          value="Upload"
                          disabled={isSubmitting || !!Object.keys(this.state.errors).length || !!this.state.uploadError || !this.state.file}
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