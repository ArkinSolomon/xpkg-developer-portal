/*
 * Copyright (c) 2023. Arkin Solomon.
 * 
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied limitations under the License.
 */

/**
 * The fields required to submit to the server to upload.
 * 
 * @typedef {Object} UploadValues
 * @property {string} packageId The id of the package that is getting a new version.
 * @property {string} packageVersion The version of the package that is being uploaded.
 * @property {string} xplaneSelection The selection of X-Plane versions.
 * @property {boolean} isPublic True if this version is public.
 * @property {boolean} isPrivate True if this version is private
 * @property {boolean} isStored True if this version is stored.
 */
type UploadValues = {
  packageId: string;
  packageVersion: string;
  xplaneSelection: string;
  isPublic: boolean;
  isPrivate: boolean;
  isStored: boolean;
}

/**
 * The state of the upload object.
 * 
 * @typedef {Object} UploadState
 * @property {boolean} isLoading True if the page is fetching data from the server.
 * @property {string} [errorMessage] The message to display in an error, undefined if no error exists. 
 * @property {PackageData} [packageData] The data of the package that this page is uploading for.
 * @property {boolean} isUploading True if we are currently uploading data to the server, and if the loading bar popup should be up.
 * @property {number} uploadProgress The progress of the upload, a number from 0 to 1, where 0 is 0% and 1 is 100%.
 * @property {string} [uploadError] Any error that was returned from the server during upload (human-readable).
 * @property {Partial<UploadValues>} errors Any errors with the form.
 * @property {[string, string][]} dependencies The dependencies of the new version being uploaded. An array of tuples where the first value is the id of the package that this version depends on, and the second value is the selection string of the dependency. 
 * @property {[string, string][]} incompatibilities The incompatibilities of the new version being uploaded. An array of tuples where the first value is the id of the package that this version is incompatible with, and the second value is the selection string of the incompatibility.
 * @property {boolean} dependencyErr True if there is an error with the dependency list.
 * @property {boolean} incompatibilityErr True if there is an error with the incompatibility list.
 */
type UploadState = {
  isLoading: boolean;
  errorMessage?: string;
  packageData?: PackageData;
  isUploading: boolean;
  uploadProgress: number;
  uploadError?: string;
  errors: Partial<UploadValues>;
  file?: File;
  dependencies: [string, string][];
  incompatibilities: [string, string][];
  dependencyErr: boolean;
  incompatibilityErr: boolean;
}

import { Component } from 'react';
import { httpRequest } from '../scripts/http';
import * as tokenStorage from '../scripts/tokenStorage';
import HTTPMethod from 'http-method-enum';
import { PackageData, PackageType } from './Packages';
import Version from '../scripts/version';
import Big from 'big.js';
import LoadingBarPopup, { LoadingPopupConfig } from '../components/LoadingBarPopup';
import MainContainer from '../components/Main Container/MainContainer';
import MainContainerError from '../components/Main Container/MainContainerError';
import MainContainerLoading from '../components/Main Container/MainContainerLoading';
import MainContainerContent from '../components/Main Container/MainContainerContent';
import { Formik, FormikErrors } from 'formik';
import ErrorMessage from '../components/ErrorMessage';
import InputField, { InputFieldProps } from '../components/Input/InputField';
import InputFile, { InputFileProps } from '../components/Input/InputFile';
import InputCheckbox from '../components/Input/InputCheckbox';
import PackageList, { PackageListProps } from '../components/PackageList';
import axios, { AxiosError } from 'axios';
import SelectionChecker from '../scripts/selectionChecker';
import PackageInfoFields from '../components/PackageInfoFields';
import '../css/Upload.scss';

class Upload extends Component {
  
  state: UploadState;

  private _packageId?: string;
  private _defaultVersion = '1.0.0';

  constructor(props: Record<string, never>) {
    super(props);

    this.state = {
      isLoading: true,
      isUploading: false,
      uploadProgress: 0,
      errors: {},
      dependencies: [],
      incompatibilities: [],
      dependencyErr: false,
      incompatibilityErr: false
    };    

    const token = tokenStorage.checkAuth();
    if (!token) {
      sessionStorage.setItem('post-auth-redirect', '/packages');
      window.location.href = '/';
      return;
    }   
  } 

  componentDidMount(): void {
    const searchParams = new URLSearchParams(window.location.search);

    if (!searchParams.has('packageId')) {
      this.setState({
        isLoading: false,
        errorMessage: 'No package identifier'
      } as Partial<UploadState>);
      return;
    }

    this._packageId = decodeURIComponent(searchParams.get('packageId') as string).trim().toLowerCase();

    const token = tokenStorage.checkAuth() as string;

    httpRequest('http://localhost:5020/account/packages', HTTPMethod.GET, token , { }, (err, res) => {
      if (err)
        return this.setState({
          errorMessage: 'An unknown error occured'
        } as Partial<UploadState>);
      
      if (res?.status !== 200) {

        if (res?.status === 401) {
          tokenStorage.delToken();
          sessionStorage.setItem('post-auth-redirect', '/packages');
          window.location.href = '/';
          return;
        }

        return this.setState({
          isLoading: false,
          errorMessage: 'An unknown error occured'
        } as Partial<UploadState>);
      }

      const packageData = (JSON.parse(res.response) as PackageData[])
        .find(pkg => pkg.packageId === this._packageId);
      
      if (!packageData) {
        this.setState({
          errorMessage: 'Package does not exist',
          isLoading: false
        });
        return;
      }
      
      packageData.versions.sort((a, b) => {
        const aVer = Version.fromString(a.version);
        const bVer = Version.fromString(b.version);

        return bVer?.toFloat().cmp(aVer?.toFloat() as Big).valueOf() as number;
      });

      // Increment the last version as the default version
      if (packageData.versions.length) {
        const lastVersionStr = packageData.versions[0].version;
        const lastVersion = Version.fromString(lastVersionStr) as Version;

        if (lastVersion.isPreRelease) {
          const preReleaseNum = lastVersion.preReleaseNum;
          if (typeof preReleaseNum === 'number' && preReleaseNum !== 999)
            lastVersion.preReleaseNum = preReleaseNum + 1;
        } else {
          const patchNum = lastVersion.patch;
          if (patchNum !== 999)
            lastVersion.patch = patchNum + 1;
        }

        this._defaultVersion = lastVersion.toString();
      }
      
      this.setState({
        errorMessage: void (0),
        isLoading: false,
        packageData
      } as Partial<UploadState>);
    });
  }

  private _validate({ packageVersion, xplaneSelection }: UploadValues): FormikErrors<UploadValues> {
    packageVersion = packageVersion.trim();
    xplaneSelection = xplaneSelection.trim();

    const errors: Partial<UploadValues> = {};

    if (packageVersion.length < 1)
      errors.packageVersion = 'Version string required';
    else if (packageVersion.length > 15)
      errors.packageVersion = 'Version string too long';
    else if (!Version.fromString(packageVersion))
      errors.packageVersion = 'Invalid version string';
    
    const selectionChecker = new SelectionChecker(xplaneSelection);
    if (xplaneSelection.length < 1)
      errors.xplaneSelection = 'X-Plane version required';
    else if (xplaneSelection.length > 256)
      errors.xplaneSelection = 'X-Plane version too long';
    else if (!selectionChecker.isValid)
      errors.xplaneSelection = 'Version selection invalid';
    
    this.setState({
      errors
    } as Partial<UploadState>);

    return {};
  }

  private async _submit(values: UploadValues, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void; }): Promise<void> {
    this.setState({
      isUploading: true,
      uploadProgress: 0
    } as Partial<UploadState>);
    setSubmitting(true);
                
    const packageVersion = values.packageVersion.trim().toLowerCase(); 
    const xplaneSelection = values.xplaneSelection.trim().toLowerCase();
    const { isPublic, isPrivate, isStored } = values;

    const formData = new FormData();
    formData.append('packageId', this.state.packageData?.packageId as string);
    formData.append('packageVersion', packageVersion);
    formData.append('xplaneSelection', xplaneSelection);
    formData.append('isPublic', isPublic ? 'true' : 'false');
    formData.append('isPrivate', isPrivate ? 'true' : 'false');
    formData.append('isStored', isStored ? 'true' : 'false');
    formData.append('dependencies', JSON.stringify(this.state.dependencies));
    formData.append('incompatibilities', JSON.stringify(this.state.incompatibilities));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formData.append('file', (document.getElementById('package-file') as any).files[0]);
    try {
      await axios({
        url: 'http://localhost:5020/packages/upload',
        method: HTTPMethod.POST,
        data: formData,
        headers: {
          Authorization: tokenStorage.checkAuth() as string
        }, 
        onUploadProgress: e  => {
          this.setState({
            uploadProgress: e.progress
          } as Partial<UploadState>);
        },
      });

      sessionStorage.setItem('success_message', 'Uploaded new package version successfully');
      window.location.href = '/packages';
    } catch (e) {
      let errorMessage = 'An unknown error occured.';
      
      if (e instanceof AxiosError) {
        switch (e.response?.status) {
        case 400:
          errorMessage = {
            missing_form_data: 'Missing form data.',
            no_version: 'A version must be provided.',
            long_version: 'The version provided is too long.',
            invalid_version: 'The version provided is invalid',
            version_exists: 'The version provided already exists.'
          }[e.response?.data as string]
              ?? `An unknown error occured [${e.response?.data}].`;
          break;
        case 403:
          errorMessage = `You do not own the package ${this.state.packageData?.packageId as string}.`;
          break;
        case 500:
          errorMessage = 'An internal server error occured.';
          break;
        }
      }

      this.setState({
        uploadError: errorMessage,
        isUploading: false
      } as Partial<UploadState>);
    } finally {
      setSubmitting(false);
    }
  }

  render(): JSX.Element {
    const loadingBarProps: LoadingPopupConfig =  {
      open: this.state.isUploading,
      progress: this.state.uploadProgress,
      title: 'Uploading',
      text: this.state.uploadProgress < 1 ? `Uploading -- ${Math.round(this.state.uploadProgress * 100)}%` : 'Waiting for Upload Confirmation...'
    };

    const dependencyListProps: PackageListProps = {
      list: this.state.dependencies,
      onChange: err => {
        this.setState({
          dependencyErr: err
        });
      },
      title: 'Dependencies',
      noneText: 'No dependencies'
    };

    const incompatibilityListProps: PackageListProps = {
      list: this.state.incompatibilities,
      onChange: err => {
        this.setState({
          incompatibilityErr: err
        });
      },
      title: 'Incompatibilities',
      noneText: 'No incompatibilities'
    };

    return (
      <>
        <LoadingBarPopup {...loadingBarProps} />
        <MainContainer>
          {this.state.errorMessage && <MainContainerError
            message={this.state.errorMessage}
            linkName='Return Home'
            link='/packages'
          />}
          {this.state.isLoading && <MainContainerLoading loadingMessage='Loading data from registry' />}
          {(!this.state.errorMessage && !this.state.isLoading) &&
            <MainContainerContent title='Upload a new version'>
              <Formik
                validate={this._validate.bind(this)}
                validateOnChange={true}
                validateOnMount={true}
                initialValues={{
                  packageId: this.state.packageData?.packageId,
                  packageVersion: this._defaultVersion,
                  xplaneSelection: '',
                  isPublic: true,
                  isPrivate: false,
                  isStored: true
                } as UploadValues}
                onSubmit={ this._submit.bind(this) }>
                {({
                  values,
                  handleChange,
                  handleSubmit,
                  setFieldValue
                }) => {
                  const parsedVersion = Version.fromString(values.packageVersion);
                  const packageVersionProps: InputFieldProps = {
                    name: 'packageVersion',
                    label: parsedVersion ? `Package Version (${parsedVersion.toString()})`: 'Package Version',
                    placeholder: 'x.x.x',
                    defaultValue: this._defaultVersion,
                    minLength: 1,
                    maxLength: 15,
                    error: this.state.errors.packageVersion,
                  };

                  const fileUploadProps: InputFileProps = {
                    label: 'Files',
                    id: 'package-file',
                    name: 'package-file',
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
                    label: 'X-Plane Compatiblity',
                    placeholder: 'x.x.x-x.x.x',
                    name: 'xplaneSelection',
                    minLength: 1,
                    maxLength: 256,
                    error: this.state.errors.xplaneSelection
                  };

                  // Make sure access config is valid once a checkbox is updated
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
                      <form
                        id='upload-form'
                        onSubmit={handleSubmit}
                        onChange={handleChange}
                        onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                      >
                        <PackageInfoFields
                          packageId={this.state.packageData?.packageId as string}
                          packageName={this.state.packageData?.packageName as string}
                          packageType={this.state.packageData?.packageType as PackageType}
                        />

                        <section className='no-border mt-9'>

                          <div className='left-half'>
                            <InputField {...packageVersionProps} />
                          </div>

                          <div className='right-half'>
                            <InputFile {...fileUploadProps} /> 
                          </div>

                        </section>
                        <section className='no-border mt-9'>
                          
                          <div className='left-half'>
                            <InputField {...xpCompatiblityFieldProps} />
                          </div>

                          <div className='right-half access-config'>
                            <label className='access-config-label'>Access Configuration</label>
                            <div className="checkboxes">
                              <InputCheckbox name='isPublic' title='Public' onChange={e => {
                                v.isPublic = !v.isPublic;
                                handleChange(e);
                                checkboxUpdated(v);
                              }} checked={values.isPublic} />
                              <InputCheckbox name='isPrivate' title='Private' onChange={e => {
                                v.isPrivate = !v.isPrivate;
                                handleChange(e);
                                checkboxUpdated(v);
                              }} checked={values.isPrivate} />
                              <InputCheckbox name='isStored' title='Is Saved' onChange={e => {
                                v.isStored = !v.isStored;
                                handleChange(e);
                                checkboxUpdated(v);
                              }} checked={values.isStored} disabled={values.isPublic} />
                            </div>
                          </div>  
                        </section>
                        <section className='mt-[5.5rem]'>
                          <div className='left-half'>              
                            <PackageList {...dependencyListProps} />
                          </div>
                          <div className='right-half'>
                            <PackageList {...incompatibilityListProps} />
                          </div>
                        </section>
                        <section className='relative mt-9'>
                          <input
                            form='upload-form'
                            className='primary-button float-right'
                            type='submit'
                            value='Upload'
                            disabled={this.state.isUploading || !!Object.keys(this.state.errors).length || !!this.state.uploadError || !this.state.file || this.state.dependencyErr || this.state.incompatibilityErr}
                          />
                        </section>
                      </form>
                    </>
                  );  
                }}
              </Formik>
            </MainContainerContent>
          }
        </MainContainer>
      </>
    );
  } 
}

export default Upload;