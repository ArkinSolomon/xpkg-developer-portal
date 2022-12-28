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
 * The state of the edit page.
 * 
 * @typedef {Object} EditState
 * @property {boolean} isLoading True if the page is loading.
 * @property {string} [errorMessage] The error message of the page, or undefined if the page has no error.
 * @property {PackageData} [currentPackageData] The current package data (not nessicarily up to date with the server).
 * @property {Partial<DescriptionValues?} descriptionErrors Any errors for the fields in the description update sub-form.
 * @property {Partial<NewVersionValues>} newVersionErrors Any errors for the fields in the new version sub-form.
 * @property {Omit<NewVersionValues, 'versionString'>} newVersionAccessConfig The values for the new version access config.
 * @property {ConfirmPopupConfig} [popupConfig] Configuration for the popup.
 * @property {boolean} isPopupVisible True if the popup is visible.
 * @property {boolean} isFormSubmitting True if any form is being submitted.
 * @property {boolean} isDescriptionOriginal True if the description is the same as the original description.
 * @property {boolean} showNewVersionForm True if we should show the new version form.
 * @property {File} [newVersionFile] The file uploaded for the new version.
 */
type EditState = {
  isLoading: boolean;
  errorMessage?: string;
  currentPackageData?: PackageData;
  descriptionErrors: Partial<DescriptionValues>
  newVersionErrors: Partial<NewVersionValues>
  newVersionAccessConfig: Omit<NewVersionValues, 'versionString'>;
  popupConfig?: ConfirmPopupConfig;
  isPopupVisible: boolean;
  isFormSubmitting: boolean;
  isDescriptionOriginal: boolean;
  showNewVersionForm: boolean;
  newVersionFile?: File;
};

/**
 * Values for description modification form.
 * 
 * @typedef {Object} DescriptionValues
 * @property {string} description The description of the package.
 */
type DescriptionValues = {
  description: string;
};

/**
 * Values for the version upload form.
 * 
 * @typedef {Object} NewVersionValues
 * @property {string} versionString The version string.
 * @property {boolean} isPublic True if the package is public. 
 * @property {boolean} isPrivate True if the package is private.
 * @property {boolean} shouldApprove True if the package is to be submitted for approval.
 */
type NewVersionValues = {
  versionString: string;
  isPublic: boolean;
  isPrivate: boolean;
  shouldApprove: boolean;
};

import { ChangeEventHandler, Component, ReactNode } from 'react';
import MainContainer from '../components/Main Container/MainContainer';
import MainContainerRightLoading from '../components/Main Container/MainContainerRightLoading';
import MainContainerRightError from '../components/Main Container/MainContainerRightError';
import MainContainerRight from '../components/Main Container/MainContainerRight';
import * as tokenStorage from '../scripts/tokenStorage';
import { downloadFile, postCB } from '../scripts/http';
import { PackageData, VersionData } from './Packages';
import { Formik, FormikErrors } from 'formik';
import InputField, { InputFieldProps } from '../components/Input/InputField';
import InputArea, { InputAreaProps } from '../components/Input/InputArea';
import '../css/Edit.scss';
import '../css/SubrowStyles.scss';
import Table, { TableProps } from '../components/Input/Table';
import $ from 'jquery';
import ConfirmPopup, { ConfirmPopupConfig } from '../components/ConfirmPopup';
import InputFile, { InputFileProps } from '../components/Input/InputFile';
import semver from 'semver';
import InputCheckbox from '../components/Input/InputCheckbox';

class Edit extends Component {

  state: EditState;
  private _originalDesc: string;

  constructor(props: Record<string, never>) {
    super(props);

    this._originalDesc = '';
    this.state = {
      isLoading: true,
      descriptionErrors: {},
      newVersionErrors: {},
      isPopupVisible: false,
      isFormSubmitting: false,
      isDescriptionOriginal: true,
      showNewVersionForm: true, // Set this for easier debugging
      newVersionAccessConfig: {
        isPublic: true,
        isPrivate: false,
        shouldApprove: true
      }
    };

    const token = tokenStorage.checkAuth();
    if (!token) {
      sessionStorage.setItem('post-auth-redirect', '/packages');
      window.location.href = '/';
      return;
    }   

    this.validateDescription = this.validateDescription.bind(this);
    this.validateNewVersion = this.validateNewVersion.bind(this);
  }

  componentDidMount(): void {
    const urlParams = new URLSearchParams(location.search);
    let packageId: string;
    try {
      packageId = urlParams.get('packageId')?.toLowerCase() as string;
    } catch (e) {
      return this.setState({
        errorMessage: 'No package id provided'
      } as Partial<EditState>);
    }

    const token = tokenStorage.checkAuth() as string;

    this.setState({
      isLoading: false
    });

    postCB('http://localhost:5020/account/packages', token , { }, (err, res) => {
      if (err)
        return this.setState({
          errorMessage: 'An unknown error occured'
        } as Partial<EditState>);
      
      if (res?.status !== 200) {

        if (res?.status === 401) {
          tokenStorage.delToken();
          window.location.href = '/';
          return;
        }

        return this.setState({
          isLoading: false,
          errorMessage: 'An unknown error occured'
        } as Partial<EditState>);
      }

      const currentPackageData = (JSON.parse(res.response) as PackageData[])
        .find(pkg => pkg.packageId === packageId);
      
      if (!currentPackageData) {
        this.setState({
          errorMessage: 'Package does not exist',
          isLoading: false
        });
        return;
      }

      this._originalDesc = currentPackageData.description;
      
      this.setState({
        errorMessage: void (0),
        isLoading: false,
        currentPackageData
      } as Partial<EditState>);
    });
  }

  validateDescription({ description }: DescriptionValues): FormikErrors<DescriptionValues> {
    description = (description ?? '').trim();

    const descriptionErrors: Partial<DescriptionValues> = {};
    if (description.length < 10)
      descriptionErrors.description = 'Description too short';
    else if (description.length > 8192)
      descriptionErrors.description = 'Description too long';
    
    this.setState({
      descriptionErrors,
      isDescriptionOriginal: this._originalDesc === description
    } as EditState);
    
    return {};
  }

  validateNewVersion({ versionString }: NewVersionValues) {  
    versionString = versionString.trim().toLowerCase();

    const newVersionErrors: Partial<NewVersionValues> = {};

    if (versionString.length < 1)
      newVersionErrors.versionString = 'Version string required';
    else if (versionString.length > 15)
      newVersionErrors.versionString = 'Version string too long';

    //TODO check if semver is implemented properly
    else if (semver.valid(versionString))
      newVersionErrors.versionString = 'Invalid version string';
    
    
    this.setState({
      newVersionErrors
    } as Partial<EditState>);

    return {};
  }

  render(): ReactNode {
    if (this.state.errorMessage) 
      return (
        <MainContainer>
          <MainContainerRightError message={this.state.errorMessage} />
        </MainContainer>
      );
    // We keep loading until state is updated
    else if (this.state.isLoading || !this.state.currentPackageData?.packageId) 
      return (
        <MainContainer>
          <MainContainerRightLoading loadingMessage='Loading Package Information' />
        </MainContainer>
      );
    else {

      const tableConfig: TableProps<VersionData> = {
        columns: {
          Version: 20,
          Installs: 13,
          Approved: 13,
          Published: 13,
          Private: 13,
          'Uploaded Date': 28
        },
        data: [],
        subrowData: [], 
        subrowRender: version => {
          return (
            <div className='version-table-subrow'>
              <h3>{this.state.currentPackageData?.packageName} &#8212; {version.version}</h3>
              <p>{version.installs} installs</p>
              <p>Checksum: {version.hash}</p>
              {version.private ? <p><a className='subrow-private-key-link' onClick={e => {
                e.preventDefault();
                
                $(e.target).parent().html(`Private key: ${version.privateKey}`);
              }}>Click to reveal private key</a></p> : void (0)}
              <div className='subrow-top-right'>
                {!version.approved && version.private ? <button className='upload-button action-button'>Submit for approval</button> : void (0)}
                {version.approved && version.private ? <button className='upload-button action-button'>Publish</button> : void (0)}
                {!version.private && !version.published ? <button className='upload-button action-button' onClick={e => {
                  e.preventDefault();
                }}>Upload package</button> : void (0)}
                {version.published || version.private ? <button className='upload-button action-button' onClick={e => {
                  e.preventDefault();
                  downloadFile(version.loc, `${version.packageId}@${version.version}.xpkg`);
                }}>Download</button> : void (0)}
              </div>
            </div>
          );
        }
      };

      if (this.state.currentPackageData){
        for (const version of this.state.currentPackageData.versions) {

          let isApproved = version.approved ? 'Yes' : 'No';
          if (!version.private && !version.published)
            isApproved = 'N/A';  

          tableConfig.data.push([
            version.version,
            version.installs,
            isApproved,
            version.published ? 'Yes' : 'No',
            version.private ? 'Yes' : 'No',
            new Date(version.uploadDate).toLocaleString()
          ]);

          tableConfig.subrowData.push(version);
        }
      }

      const defaultNewVersionValues: NewVersionValues = {
        versionString: '',
        isPublic: true,
        isPrivate: false,
        shouldApprove: true
      };

      return (
        <MainContainer>
          <MainContainerRight title="Edit Package">
            <>
              <Formik
                validate={this.validateDescription}
                validateOnChange={true}
                validateOnMount={true}
                initialValues={{
                  description: this.state.currentPackageData?.description
                } as DescriptionValues}
                onSubmit={
                  async ({description}) => {

                    const popupConfig: ConfirmPopupConfig = {
                      title: 'Update description', 
                      confirmText: 'Confirm',
                      closeText: 'Cancel',
                      onConfirm: () => {
                        this.setState({
                          isFormSubmitting: true
                        } as EditState); 
                        
                        postCB('http://localhost:5020/packages/description', tokenStorage.checkAuth() as string, {
                          newDescription: description,
                          packageId: this.state.currentPackageData?.packageId as string
                        }, (err, res) => {
                          if (err || res?.status !== 204) {
                            this.setState({
                              isFormSubmitting: true
                            } as EditState);   

                            let errMsg = 'an unknown error occured.';
                            if (res)
                              switch (res.status) {
                              case 401:
                                tokenStorage.delToken();
                                sessionStorage.setItem('post-auth-redirect', '/packages');
                                window.location.href = '/';
                                break;
                              case 400:
                                errMsg = {
                                  no_desc: 'no description.',
                                  no_id: 'no package id.',
                                  invalid_type: 'invalid data type.',
                                  short_desc: 'description too short.',
                                  long_desc: 'description too long.',
                                }[res.responseText]
                                  ?? `an unknown error occured [${res.responseText}].`;
                                break;
                              case 403:
                                errMsg = 'package not owned.';
                                break;
                              case 500:
                                errMsg = 'internal server error.';
                                break;
                              }

                            const popupConfig: ConfirmPopupConfig = {
                              title: 'Update failed',
                              showClose: false,
                              confirmText: 'Ok',
                              onClose: () => {
                                this.setState({
                                  isPopupVisible: false
                                } as Partial<EditState>);
                              },
                              children: <p className='generic-popup-text'>Could not update description, { errMsg }</p>
                            };

                            this.setState({
                              popupConfig,
                              isPopupVisible: true
                            } as EditState);
                          } else 
                            window.location.href = '/packages?s=' + btoa(`The package description for '${this.state.currentPackageData?.packageName}' (${this.state.currentPackageData?.packageId}) was updated successfully`);
                        });

                        return;
                      },
                      onClose: () => {
                        this.setState({
                          isPopupVisible: false
                        } as EditState);
                      },
                      children: <p className='generic-popup-text'>Are you sure you want to modify the description of the package?</p>
                    };

                    this.setState({
                      popupConfig,
                      isPopupVisible: true
                    } as EditState);
                  }
                }
              >{({
                  handleChange,
                  handleSubmit
                }) => {

                  // To be perfectly honest (probably because of the router), I have no idea why these classes are still applying (yes I just copied and pasted this from Upload.tsx, no I don't feel like seperating these forms into individual components)
                  const packageNameData: InputFieldProps = {
                    classes: ['package-upload-input'],
                    name: 'packageName',
                    title: 'Package Name',
                    width: '35%',
                    readonly: true,
                    defaultValue: this.state.currentPackageData?.packageName,
                  };
  
                  const packageIdData: InputFieldProps = {
                    classes: ['package-upload-input'],
                    name: 'packageId',
                    title: 'Package Identifier',
                    readonly: true,
                    defaultValue: this.state.currentPackageData?.packageId,
                    width: '35%',
                  };

                  const pkgType = (this.state.currentPackageData?.packageType ?? '  ');
                  const upercasePkgType = pkgType.charAt(0).toUpperCase() + pkgType.slice(1);

                  const packageTypeData: InputFieldProps = {
                    classes: ['package-upload-input', 'right'],
                    name: 'packageType',
                    title: 'Package Type',
                    defaultValue: upercasePkgType,
                    readonly: true
                  };
                
                  const descTextAreaData: InputAreaProps = {
                    name: 'description',
                    title: 'Description',
                    minLength: 10,
                    maxLength: 8192,
                    onChange: handleChange,
                    defaultValue: this.state.currentPackageData?.description,
                    error: this.state.descriptionErrors.description
                  };

                  return (
                    <>
                      <ConfirmPopup {...this.state.popupConfig as ConfirmPopupConfig} open={this.state.isPopupVisible} />
                      
                      <form onSubmit={handleSubmit} onChange={handleChange}>
                        <div className='upload-input-section'>
                          <InputField {...packageNameData}/>
                          <InputField {...packageIdData} />
                          <InputField {...packageTypeData} />
                        </div>
                        <div className='upload-input-section top-margin bottom-margin'>
                          <InputArea {...descTextAreaData} />
                        </div>
                        <div className='upload-input-section relative top-margin'>
                          <input
                            type="submit"
                            value="Update"
                            disabled={this.state.isDescriptionOriginal || this.state.isFormSubmitting || !!Object.keys(this.state.descriptionErrors).length}
                          />
                        </div>
                      </form>
                    </>
                  );
                }}
              </Formik>

              <div className='upload-input-section'>
                <h2>Versions</h2>
                <Table {...tableConfig} />
              </div>

              <div className='upload-input-section top-margin'>
                <Formik
                  validate={this.validateNewVersion}
                  validateOnChange={true}
                  validateOnMount={true}
                  initialValues={defaultNewVersionValues}
                  onSubmit={
                    async ({versionString, isPublic, isPrivate, shouldApprove}) => {
                      versionString = versionString.trim().toLowerCase();

                    }
                  }
                >{({
                    handleChange,
                    handleSubmit,
                    setFieldValue,
                    values
                  }) => {

                    const versionStringField: InputFieldProps = {
                      name: 'versionString',
                      title: 'Intitial Version',
                      placeholder: 'x.x.x',
                      minLength: 1,
                      maxLength: 15,
                      width: '66%',
                      error: this.state.newVersionErrors.versionString,
                    };

                    const fileUploadProps: InputFileProps = {
                      label: 'Files',
                      name: 'package-file',
                      types: '.zip',
                      onChange: e => {
                        if (!e.target.files?.length)
                          return;
                        this.setState({
                          newVersionFile: e.target.files[0]
                        } as Partial<EditState>);
                      }
                    };

                    const xpCompatiblityFieldProps: InputFieldProps = {
                      title: 'X-Plane Compatiblity',
                      placeholder: 'x.x.x-x.x.x',
                      name: 'xpCompatibility',
                      minLength: 1, 
                      maxLength: 31, 
                      width: '66%'
                    };

                    // This makes sure a user can't input invalid access config
                    const checkboxUpdated = ({ isPublic, isPrivate, shouldApprove }: NewVersionValues) => {
                      if (!isPrivate && !isPublic)
                        setFieldValue('shouldApprove', false, false);
                    
                      if (!values.isPrivate && isPrivate)
                        setFieldValue('isPublic', false, false);
                    
                      if (!values.isPublic && isPublic) {
                        setFieldValue('isPrivate', false, false);
                        setFieldValue('shouldApprove', true, false);
                      }

                      if (!values.shouldApprove && shouldApprove && !isPrivate)
                        setFieldValue('isPublic', true, false);
                    };
                    const v = JSON.parse(JSON.stringify(values));

                    return (
                      <>
                        {!this.state.showNewVersionForm && 
                          <button className='upload-button action-button' onClick={() => this.setState({showNewVersionForm: true} as Partial<EditState>)}>Upload new version</button>
                        }
                        {this.state.showNewVersionForm &&
                          <>
                            <form onSubmit={handleSubmit} onChange={handleChange}>
                              <div className='upload-input-section top-margin bottom-margin'>
                                <h2>Upload a New Version</h2>
                                <div className='left-third'>
                                  <InputField {...versionStringField} />
                                </div>
                                <div className='middle-third access-config'>
                                  <label className='access-config-label'>Access Config</label>
                                  <InputCheckbox inline name="isPublic" title="Public" onChange={e => {
                                    v.isPublic = !v.isPublic;
                                    handleChange(e);
                                    checkboxUpdated(v);
                                  }} checked={values.isPublic} /> 
                                  <InputCheckbox inline name="isPrivate" title="Private" onChange={e => {
                                    v.isPrivate = !v.isPrivate;
                                    handleChange(e);
                                    checkboxUpdated(v);
                                  }} checked={values.isPrivate} /> 
                                  <InputCheckbox inline name="shouldApprove" title="Submit for approval" onChange={e => {
                                    v.shouldApprove = !v.shouldApprove;
                                    handleChange(e);
                                    checkboxUpdated(v);
                                  }} checked={values.shouldApprove} /> 
                                </div>
                                <div className='right-third'>
                                  <InputFile {...fileUploadProps} />
                                </div>
                              </div>
                              <div className='upload-input-section top-margin'>
                                <div className='left-half'>
                                  <InputField {...xpCompatiblityFieldProps} />
                                </div>
                                <div className='right-half'>
                                  <p>Right</p>
                                </div>
                              </div>
                              <div className='upload-input-section relative top-margin'>
                                <input
                                  type="submit"
                                  value="Upload"
                                  disabled={!this.state.newVersionFile || this.state.isFormSubmitting || !!Object.keys(this.state.newVersionErrors).length}
                                />
                              </div>
                            </form>
                          </>
                        }
                      </>
                    );
                  }}
                </Formik>
              </div>
            </>
          </MainContainerRight>
        </MainContainer>
      );   
    }
  }
}

export default Edit;