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
 * The state of the edit page.
 * 
 * @typedef {Object} EditState
 * @property {boolean} isLoading True if the page is loading.
 * @property {string} [errorMessage] The error message of the page, or undefined if the page has no error.
 * @property {PackageData} [currentPackageData] The current package data (not nessicarily up to date with the server).
 * @property {Partial<DescriptionValues?} descriptionErrors Any errors for the fields in the description update sub-form.
 * @property {Partial<NewVersionValues>} newVersionErrors Any errors for the fields in the new version sub-form.
 * @property {Omit<NewVersionValues, 'versionString' | 'xplaneVersion'>} newVersionAccessConfig The values for the new version access config.
 * @property {ConfirmPopupConfig} [popupConfig] Configuration for the popup.
 * @property {boolean} isPopupVisible True if the popup is visible.
 * @property {boolean} isFormSubmitting True if any form is being submitted.
 * @property {boolean} isDescriptionOriginal True if the description is the same as the original description.
 * @property {boolean} showNewVersionForm True if we should show the new version form.
 * @property {File} [newVersionFile] The file uploaded for the new version.
 * @property {JSX.Element} dependencyList The dependency list rendered. 
 * @property {JSX.Element} incompatibilityList The incompatibility list rendered.
 * @property {boolean} uploading True if we are currently uploading a package version to the server.
 * @property {number} uploadProgress Our current upload progress.
 */
type EditState = {
  isLoading: boolean;
  errorMessage?: string;
  currentPackageData?: PackageData;
  descriptionErrors: Partial<DescriptionValues>
  newVersionErrors: Partial<NewVersionValues>
  newVersionAccessConfig: Omit<NewVersionValues, 'versionString' | 'xplaneVersion'>;
  popupConfig?: ConfirmPopupConfig;
  isPopupVisible: boolean;
  isFormSubmitting: boolean;
  isDescriptionOriginal: boolean;
  showNewVersionForm: boolean;
  newVersionFile?: File;
  dependencyList: JSX.Element;
  incompatibilityList: JSX.Element;
  uploading: boolean;
  uploadProgress: number;
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
 * @property {boolean} isStored True if the package is stored.
 * @property {string} xplaneVersion The versions of X-Plane the new version will be compatible with.
 */
type NewVersionValues = {
  versionString: string;
  isPublic: boolean;
  isPrivate: boolean;
  isStored: boolean;
  xplaneVersion: string;
};

import { Component, ReactNode } from 'react';
import MainContainer from '../components/Main Container/MainContainer';
import MainContainerRightLoading from '../components/Main Container/MainContainerRightLoading';
import MainContainerRightError from '../components/Main Container/MainContainerRightError';
import MainContainerRight from '../components/Main Container/MainContainerRight';
import * as tokenStorage from '../scripts/tokenStorage';
import { downloadFile, httpRequest } from '../scripts/http';
import { PackageData, VersionData, getStatusTextShort } from './Packages';
import { Formik, FormikErrors } from 'formik';
import InputField, { InputFieldProps } from '../components/Input/InputField';
import InputArea, { InputAreaProps } from '../components/Input/InputArea';
import '../css/Edit.scss';
import '../css/SubrowStyles.scss';
import Table, { TableProps } from '../components/Table';
import $ from 'jquery';
import ConfirmPopup, { ConfirmPopupConfig } from '../components/ConfirmPopup';
import InputFile, { InputFileProps } from '../components/Input/InputFile';
import InputCheckbox from '../components/Input/InputCheckbox';
import PackageList, { PackageListProps } from '../components/PackageList';
import { nanoid } from 'nanoid/non-secure';
import SelectionChecker from '../scripts/selectionChecker';
import Version from '../scripts/version';
import { checkAuth } from '../scripts/tokenStorage';
import axios, { AxiosError } from 'axios';
import Big from 'big.js';
import HTTPMethod from 'http-method-enum';

class Edit extends Component {

  state: EditState; 

  private _isMounted = false;
  private _originalDesc: string;
  private _dependencies: [string, string][];
  private _incompatibilities: [string, string][];

  constructor(props: Record<string, never>) {
    super(props);

    this._originalDesc = '';
    this._dependencies = [];
    this._incompatibilities = [];

    const lists = this._genLists();

    this.state = {
      isLoading: true,
      descriptionErrors: {},
      newVersionErrors: {},
      isPopupVisible: false,
      isFormSubmitting: false,
      isDescriptionOriginal: true,
      showNewVersionForm: false, // Set this to true for easier debugging
      newVersionAccessConfig: {
        isPublic: true,
        isPrivate: false,
        isStored: true
      },
      ...lists,
      uploading: false,
      uploadProgress: 0
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

  private _genLists(): Pick<EditState, 'dependencyList' | 'incompatibilityList'> {

    const dependencyListProps: PackageListProps = {
      initialValues:  this._dependencies,
      onChange: (i, packageId, versionSelection) => {
        this._dependencies[i] = [packageId, versionSelection];
      }
    };
    const incompatibilityListProps: PackageListProps = {
      initialValues:  this._incompatibilities,
      onChange: (i, packageId, versionSelection) => {
        this._incompatibilities[i] = [packageId, versionSelection];
      }
    };

    // Make sure to generate a random key each render, otherwise it'll be consistent and won't re-render
    const newValues: Pick<EditState, 'dependencyList' | 'incompatibilityList'> = {
      dependencyList: <PackageList {...dependencyListProps} key={nanoid(5)} />,
      incompatibilityList: <PackageList {...incompatibilityListProps} key={nanoid(5)} />
    };
    if (this._isMounted) 
      this.setState(newValues as Partial<EditState>);
    return newValues;
  }

  componentDidMount(): void {
    this._isMounted = true;
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

    httpRequest('http://localhost:5020/account/packages', HTTPMethod.GET, token , { }, (err, res) => {
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
      
      currentPackageData?.versions.sort((a, b) => {
        const aVer = Version.fromString(a.version);
        const bVer = Version.fromString(b.version);

        // Flipping a and b reverses the sort
        return bVer?.toFloat().cmp(aVer?.toFloat() as Big).valueOf() as number;
      });
      
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

  componentWillUnmount(): void {
    this._isMounted = false;
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

  validateNewVersion({ versionString, xplaneVersion }: NewVersionValues) {  
    versionString = versionString.trim();
    xplaneVersion = xplaneVersion.trim();

    const newVersionErrors: Partial<NewVersionValues> = {};

    if (versionString.length < 1)
      newVersionErrors.versionString = 'Version string required';
    else if (versionString.length > 15)
      newVersionErrors.versionString = 'Version string too long';
    else if (!Version.fromString(versionString))
      newVersionErrors.versionString = 'Invalid version string';
    
    const selectionChecker = new SelectionChecker(xplaneVersion);
    if (xplaneVersion.length < 1)
      newVersionErrors.xplaneVersion = 'X-Plane version required';
    else if (xplaneVersion.length > 256)
      newVersionErrors.xplaneVersion = 'X-Plane version too long';
    else if (!selectionChecker.isValid)
      newVersionErrors.xplaneVersion = 'Version selection invalid';
    
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
          Version: 25,
          Installs: 15,
          Public: 7,
          Stored: 7,
          Status: 20,
          'Uploaded Date': 26
        },
        data: [],
        subrowData: [],
        subrowRender: version => {
          return (
            <div className='version-table-subrow'>
              <h3>{this.state.currentPackageData?.packageName} &#8212; {version.version}</h3>
              <p>{version.installs} installs</p>
              <p>Checksum: {version.hash}</p>

              {!version.isPublic ? <p><a className='subrow-private-key-link' onClick={e => {
                e.preventDefault(); 
                $(e.target).parent().html(`Private key: ${version.privateKey}`);
              }}>Click to reveal private key</a></p> : void (0)}

              <div className='subrow-top-right'>
                {version.isStored && !version.isPublic ? <button className='upload-button action-button'>Publish</button> : void (0)}
                {!version.isStored ? <button className='upload-button action-button' onClick={e => {
                  e.preventDefault();
                }}>Upload package</button> : void (0)}

                {version.isStored ? <button className='upload-button action-button' onClick={e => {
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

          tableConfig.data.push([
            version.version,
            version.installs,
            version.isPublic ? 'Yes' : 'No',
            version.isStored ? 'Yes' : 'No',
            getStatusTextShort(version.status),
            new Date(version.uploadDate).toLocaleString()
          ]);

          tableConfig.subrowData.push(version);
        }
      }

      const defaultNewVersionValues: NewVersionValues = {
        versionString: '',
        isPublic: true,
        isPrivate: false,
        isStored: true,
        xplaneVersion: ''
      };

      return (
        <MainContainer>
          <MainContainerRight title="Edit Package">
            <>
              <Formik
                validate={this.validateDescription}
                validateOnChange
                validateOnMount
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
                        
                        httpRequest('http://localhost:5020/packages/description', HTTPMethod.PUT, tokenStorage.checkAuth() as string, {
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
                  validateOnChange
                  validateOnMount
                  initialValues={defaultNewVersionValues}
                  onSubmit={
                    async (values, { setSubmitting }) => {
                      setSubmitting(true);
                
                      const versionString = values.versionString.trim().toLowerCase(); 
                      const xplaneVersion = values.xplaneVersion.trim().toLowerCase();
                      const { isPublic, isPrivate, isStored } = values;

                      const formData = new FormData();
                      formData.append('packageId', this.state.currentPackageData?.packageId as string);
                      formData.append('versionString', versionString);
                      formData.append('xplaneVersion', xplaneVersion);
                      formData.append('isPublic', isPublic ? 'true' : 'false');
                      formData.append('isPrivate', isPrivate ? 'true' : 'false');
                      formData.append('isStored', isStored ? 'true' : 'false');
                      formData.append('dependencies', JSON.stringify(this._dependencies));
                      formData.append('incompatibilities', JSON.stringify(this._incompatibilities));

                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formData.append('file', (document.getElementById('package-file') as any).files[0]);
                      try {
                        await axios({
                          url: 'http://localhost:5020/packages/newversion',
                          method: HTTPMethod.POST,
                          data: formData,
                          headers: {
                            Authorization: checkAuth() as string
                          }
                        });
                        console.log('post-req');
                        window.location.href = '/packages?s=' + encodeURIComponent(btoa('Uploaded new package version successfully'));
                      } catch (e) {
                        let errMsg = 'an unknown error occured.';
                        
                        if (e instanceof AxiosError) {
                          switch (e.response?.status) {
                          case 400:
                            errMsg = {
                              missing_form_data: 'missing form data.',
                              no_version: 'a version must be provided.',
                              long_version: 'the version provided is too long.',
                              invalid_version: 'the version provided is invalid',
                              version_exists: 'the version provided already exists.'
                            }[e.response?.data as string]
                                  ?? `an unknown error occured [${e.response?.data}].`;
                            break;
                          case 403:
                            errMsg = `you do not own the package ${this.state.currentPackageData?.packageId as string}.`;
                            break;
                          case 422:
                            errMsg = 'invalid package file.';
                            break;
                          case 500:
                            errMsg = 'an internal server error occured.';
                            break;
                          }
                        }

                        const popupConfig: ConfirmPopupConfig = {
                          title: 'Upload failed',
                          showClose: false,
                          confirmText: 'Ok',
                          onClose: () => {
                            this.setState({
                              isPopupVisible: false
                            } as Partial<EditState>);
                          },
                          children: <p className='generic-popup-text'>Could not upload new package version, { errMsg }</p>
                        };
                          
                        this.setState({
                          popupConfig,
                          isPopupVisible: true
                        } as Partial<EditState>);
                      } finally {
                        setSubmitting(false);
                      }
                    }
                  }
                >{({
                    handleChange,
                    handleSubmit,
                    setFieldValue,
                    values,
                    isSubmitting
                  }) => {

                    const versionStringField: InputFieldProps = {
                      name: 'versionString',
                      title: 'Version String',
                      placeholder: 'x.x.x',
                      minLength: 1,
                      maxLength: 15,
                      width: '66%',
                      error: this.state.newVersionErrors.versionString,
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
                          newVersionFile: e.target.files[0]
                        } as Partial<EditState>);
                      }
                    };

                    const xpCompatiblityFieldProps: InputFieldProps = {
                      title: 'X-Plane Compatiblity',
                      placeholder: 'x.x.x-x.x.x',
                      name: 'xplaneVersion',
                      minLength: 1,
                      maxLength: 256,
                      width: '66%',
                      error: this.state.newVersionErrors.xplaneVersion
                    };

                    // Use `values` for previous state, and parameters for current state
                    const checkboxUpdated = ({ isPublic, isPrivate }: NewVersionValues) => {
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
                        {!this.state.showNewVersionForm && 
                          <button className='upload-button action-button' onClick={() => this.setState({showNewVersionForm: true} as Partial<EditState>)}>Upload new version</button>
                        }
                        {this.state.showNewVersionForm &&  <>
                          <form onSubmit={handleSubmit} onChange={handleChange}>
                            <div className='upload-input-section mt-9'>
                              <h2>Upload a New Version</h2>
                              <div className='left-third'>
                                <InputField {...versionStringField} />
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
                                <InputFile {...fileUploadProps}></InputFile>
                              </div>
                            </div>

                            <div className='upload-input-section mt-9'>
                              <div className='left-third'>
                                <InputField {...xpCompatiblityFieldProps} />
                              </div>
                              {/* We don't need the right half */}
                            </div>
                            <div className='upload-input-section flex-section mt-9'>
                              <div className='left-half right-border'>
                                <p>Dependencies</p>
                                <div className='package-list'>
                                  {this._dependencies.length === 0 && <p className='package-list-empty'>No dependencies</p>}
                                  {this.state.dependencyList}
                                </div>
                                <div className='package-list-buttons'>
                                  <button
                                    type='button'
                                    className='list-mod-button left'
                                    onClick={() => {
                                      this._dependencies.push(['', '']);
                                      this._genLists();
                                    }}
                                  >Add</button>
                                  <button
                                    type='button'
                                    className='list-mod-button right'
                                    onClick={() => {
                                      this._dependencies.pop();
                                      this._genLists();
                                    }}
                                    disabled={!this._dependencies.length}
                                  >Remove</button>
                                </div>
                              </div>
                              <div className='right-half other-borders'>
                                <p>Incompatibilities</p>
                                <div className='package-list'>
                                  {this._incompatibilities.length === 0 && <p className='package-list-empty'>No incompatibilities</p>}
                                  {this.state.incompatibilityList}
                                </div>
                                <div className='package-list-buttons'>
                                  <button
                                    type='button'
                                    className='list-mod-button left'
                                    onClick={() => {
                                      this._incompatibilities.push(['', '']);
                                      this._genLists();
                                    }}
                                  >Add</button>
                                  <button
                                    type='button'
                                    className='list-mod-button right'
                                    onClick={() => {
                                      this._incompatibilities.pop();
                                      this._genLists();
                                    }}
                                    disabled={!this._incompatibilities.length}
                                  >Remove</button>
                                </div>
                              </div>
                            </div>
                            <div className='upload-input-section relative mt-9'>
                              <input
                                type="submit"
                                value="Upload"
                                disabled={isSubmitting || !!Object.keys(this.state.newVersionErrors).length || !!this.state.errorMessage || !this.state.newVersionFile}
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