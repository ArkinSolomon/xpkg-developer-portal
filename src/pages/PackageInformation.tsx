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
 * @typedef {Object} PackageInformationState
 * @property {boolean} isLoading True if the page is loading.
 * @property {string} [errorMessage] The error message of the page, or undefined if the page has no error.
 * @property {AuthorPackageData} [currentPackageData] The current package data (not nessicarily up to date with the server).
 * @property {Partial<DescriptionValues?} descriptionErrors Any errors for the fields in the description update sub-form.
 * @property {ConfirmPopupConfig} [popupConfig] Configuration for the popup.
 * @property {boolean} isPopupVisible True if the popup is visible.
 * @property {boolean} isFormSubmitting True if any form is being submitted.
 * @property {boolean} isDescriptionOriginal True if the description is the same as the original description.
 */
type PackageInformationState = {
  isLoading: boolean;
  errorMessage?: string;
  currentPackageData?: AuthorPackageData;
  descriptionErrors: Partial<DescUpdateValues>
  popupConfig?: ConfirmPopupConfig;
  isPopupVisible: boolean;
  isFormSubmitting: boolean;
  isDescriptionOriginal: boolean;
};

/**
 * Values for description modification form.
 * 
 * @typedef {Object} DescUpdateValues
 * @property {string} description The description of the package.
 */
type DescUpdateValues = {
  description: string;
};

import { Component, ReactNode } from 'react';
import MainContainer from '../components/Main Container/MainContainer';
import MainContainerLoading from '../components/Main Container/MainContainerLoading';
import MainContainerError from '../components/Main Container/MainContainerError';
import MainContainerContent from '../components/Main Container/MainContainerContent';
import * as tokenStorage from '../scripts/tokenStorage';
import { httpRequest } from '../scripts/http';
import { getStatusTextShort } from './Packages';
import { Formik, FormikErrors } from 'formik';
import InputArea, { InputAreaProps } from '../components/Input/InputArea';
import '../css/PackageInformation.scss';
import '../css/SubrowStyles.scss';
import Table, { TableProps } from '../components/Table';
import $ from 'jquery';
import ConfirmPopup, { ConfirmPopupConfig } from '../components/ConfirmPopup';
import Big from 'big.js';
import HTTPMethod from 'http-method-enum';
import PackageInfoFields from '../components/PackageInfoFields';
import { AuthorPackageData, AuthorVersionData, PackageType, VersionStatus, getAuthorPackage } from '../scripts/author';
import RegistryError from '../scripts/registryError';
import { getBestUnits } from '../scripts/displayUtil';
import { Line } from 'react-chartjs-2';

class PackageInformation extends Component {

  state: PackageInformationState; 

  private _originalDesc: string;

  constructor(props: Record<string, never>) {
    super(props);

    this._originalDesc = '';

    this.state = {
      isLoading: true,
      descriptionErrors: {},
      isPopupVisible: false,
      isFormSubmitting: false,
      isDescriptionOriginal: true,
    };

    const token = tokenStorage.checkAuth();
    if (!token) {
      tokenStorage.delToken();
      sessionStorage.setItem('post-auth-redirect', '/packages');
      window.location.href = '/';
      return;
    }   

    this._updateDescription = this._updateDescription.bind(this);
  }

  async componentDidMount(): Promise<void> {
    const urlParams = new URLSearchParams(location.search);
    let packageId;
    try {
      packageId = urlParams.get('packageId')?.toLowerCase() as string;
    } catch (e) {
      return this.setState({
        errorMessage: 'No package identifier provided'
      } as Partial<PackageInformationState>);
    }
    
    try {
      const currentPackageData = await getAuthorPackage(packageId);
      this._originalDesc = currentPackageData.description;
      currentPackageData.versions.sort((a, b) => {

        // Flipping a and b reverses the sort
        return b.packageVersion.toFloat().cmp(a.packageVersion.toFloat() as Big).valueOf() as number;
      });

      this.setState({
        errorMessage: void (0),
        isLoading: false,
        currentPackageData
      } as Partial<PackageInformationState>);
    } catch (e) {
      console.error(e);
      if (e instanceof RegistryError) {
        switch (e.status) {
        case 401:
          tokenStorage.delToken();
          sessionStorage.setItem('post-auth-redirect', '/packages');
          window.location.href = '/';
          return;
        case 404:
          return this.setState({
            isLoading: false,
            errorMessage: 'Package does not exist'
          } as Partial<PackageInformationState>);
        }
      }

      return this.setState({
        isLoading: false,
        errorMessage: 'An unknown error occured'
      } as Partial<PackageInformationState>);
    }
  }

  private _validateDescription({ description }: DescUpdateValues): FormikErrors<DescUpdateValues> {
    description = (description ?? '').trim();

    const descriptionErrors: Partial<DescUpdateValues> = {};
    if (description.length < 10)
      descriptionErrors.description = 'Description too short';
    else if (description.length > 8192)
      descriptionErrors.description = 'Description too long';
    
    this.setState({
      descriptionErrors,
      isDescriptionOriginal: this._originalDesc === description
    } as Partial<PackageInformationState>);
    
    return {};
  }

  private _updateDescription({ description }: DescUpdateValues) {
    
    const popupConfig: ConfirmPopupConfig = {
      title: 'Update description', 
      confirmText: 'Confirm',
      closeText: 'Cancel',
      onConfirm: () => {
        this.setState({
          isFormSubmitting: true
        } as Partial<PackageInformationState>); 
        
        httpRequest(`${window.REGISTRY_URL}/packages/description`, HTTPMethod.PATCH, tokenStorage.checkAuth() as string, {
          newDescription: description,
          packageId: this.state.currentPackageData?.packageId as string
        }, (err, res) => {
          if (err || res?.status !== 204) {
            this.setState({
              isFormSubmitting: true
            } as Partial<PackageInformationState>);   

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
                } as Partial<PackageInformationState>);
              },
              children: <p className='generic-popup-text'>Could not update description, { errMsg }</p>
            };

            this.setState({
              popupConfig,
              isPopupVisible: true
            } as Partial<PackageInformationState>);
          } else {
            sessionStorage.setItem('success_message', `The package description for '${this.state.currentPackageData?.packageName}' (${this.state.currentPackageData?.packageId}) was updated successfully`);
            window.location.href = '/packages'; 
          } 
        });

        return;
      },
      onClose: () => {
        this.setState({
          isPopupVisible: false
        } as Partial<PackageInformationState>);
      },
      children: <p className='generic-popup-text'>Are you sure you want to update the description of the package?</p>
    };

    this.setState({
      popupConfig,
      isPopupVisible: true
    } as Partial<PackageInformationState>);
  }

  private _versionSubrow(version: AuthorVersionData): JSX.Element {
    return (
      <div className='version-table-subrow'>
        {PackageInformation.getVersionInfoText(this.state.currentPackageData!.packageId, this.state.currentPackageData!.packageType, version)}

        {
          !version.isPublic && 
            <p><a
              className='subrow-private-key-link'
              onClick={e => {
                e.preventDefault(); 
                $(e.target).parent().html(`Private key: ${version.privateKey}`);
              }}>Click to reveal private key</a></p>
        }

        <div className='subrow-top-right'>
          <button
            className='primary-button'
            onClick={() => window.location.href = `/packages/details?packageId=${this.state.currentPackageData?.packageId}&packageVersion=${version.packageVersion}&referrer=package_info`}
          >Details</button>
        </div>
      </div>
    );
  }

  render(): ReactNode {
    if (this.state.errorMessage) 
      return (
        <MainContainer>
          <MainContainerError
            message={this.state.errorMessage}
            linkName='Return Home'
            link='/packages'
          />
        </MainContainer>
      );
    
    // We keep loading until state is updated
    else if (this.state.isLoading || !this.state.currentPackageData?.packageId) 
      return (
        <MainContainer>
          <MainContainerLoading loadingMessage='Loading Package Information' />
        </MainContainer>
      );
    else {

      const tableConfig: TableProps<AuthorVersionData> = {
        columns: {
          Version: 25,
          Downloads: 15,
          Public: 7,
          Stored: 7,
          Status: 20,
          'Uploaded Date': 26
        },
        data: [],
        subrowData: [],
        subrowRender: this._versionSubrow.bind(this)
      };

      if (this.state.currentPackageData){
        for (const version of this.state.currentPackageData.versions) {

          tableConfig.data.push([
            version.packageVersion.toString(),
            version.downloads.toString(),
            version.isPublic ? 'Yes' : 'No',
            version.isStored ? 'Yes' : 'No',
            getStatusTextShort(version.status),
            new Date(version.uploadDate).toLocaleString()
          ]);

          tableConfig.subrowData.push(version);
        }
      }

      return (
        <MainContainer>
          <MainContainerContent
            title='Edit Package'
            backButtonText='Packages'
            backButtonURL='/packages'
          >
            <>
              <PackageInfoFields
                packageId={this.state.currentPackageData?.packageId as string}
                packageName={this.state.currentPackageData?.packageName as string}
                packageType={this.state.currentPackageData?.packageType as PackageType}
              />
              <Formik
                validate={this._validateDescription.bind(this)}
                validateOnChange
                validateOnMount
                initialValues={{
                  description: this.state.currentPackageData?.description
                } as DescUpdateValues}
                onSubmit={this._updateDescription}
              >{({
                  handleChange,
                  handleSubmit
                }) => {
                
                  const descTextAreaData: InputAreaProps = {
                    name: 'description',
                    label: 'Description',
                    minLength: 10,
                    maxLength: 8192,
                    onChange: handleChange,
                    defaultValue: this.state.currentPackageData?.description,
                    error: this.state.descriptionErrors.description
                  };

                  return (
                    <>
                      <ConfirmPopup {...this.state.popupConfig as ConfirmPopupConfig} open={this.state.isPopupVisible} />
                      
                      <form
                        onSubmit={handleSubmit}
                        onChange={handleChange}
                      >
                        <section className='mt-9'>
                          <InputArea {...descTextAreaData} />
                        </section>
                        <section className='mt-9'>
                          <input
                            className='primary-button float-right'
                            type="submit"
                            value="Update"
                            disabled={this.state.isDescriptionOriginal || this.state.isFormSubmitting || !!Object.keys(this.state.descriptionErrors).length}
                          />
                        </section>
                      </form>
                    </>
                  );
                }}
              </Formik>

              <section id='versions-header' className='mt-7'>
                <h2>Versions</h2>
                <Table {...tableConfig} />
              </section>

              <section className='mt-4'>
                <button
                  className='primary-button float-right'
                  onClick={ () => window.location.href = `/packages/upload?packageId=${this.state.currentPackageData?.packageId}` }
                >Upload new version</button>
              </section>
            </>
          </MainContainerContent>
        </MainContainer>
      );   
    }
  }

  static getVersionInfoText(packageId: string, packageType: PackageType, version: AuthorVersionData): JSX.Element {
    const innerHtml = (() => {
      switch (version.status) {
      case VersionStatus.Processing:
        return (<p>This package is still processing. Check again later.</p>);
      case VersionStatus.Processed:
        return (
          <>
            <p>Downloads: <b>{version.downloads}</b></p>
            <p>Checksum: <b>{version.hash?.toUpperCase()}</b></p>
            <p>Uploaded: <b>{version.uploadDate.toLocaleString()}</b></p>
            <p>Package Size: <b>{getBestUnits(version.size)} ({version.size} bytes)</b></p>
            <p>Installed Size: <b>{getBestUnits(version.installedSize)} ({version.installedSize} bytes)</b></p>
          </>
        );
      case VersionStatus.Removed:
        return (<p>This version has been removed from the registry. Please contact support.</p>);
      case VersionStatus.Aborted:
        return (<p>Processing of this version was aborted. There may have been a server error, or your package took too long to process. Please try again.</p>);
      case VersionStatus.FailedFileTooLarge:
        return (<p>The uploaded zip can not grow to be more than 16 GiB in size.</p>);
      case VersionStatus.FailedInvalidFileTypes:
        if (packageType === PackageType.Executable)
          return (<p>The uploaded zip file may not contain symbolic links.</p>);
        else
          return (<p>The uploaded zip file may not contain symbolic links or executables.</p>);
      case VersionStatus.FailedMACOSX:
        return (<p>You only have a __MACOSX directory in your uploaded zip. Ensure your directory structure is correct, and then try again.</p>);
      case VersionStatus.FailedManifestExists:
        return (<p>You can not have a file named <b>manifest.json</b> in your zip file root.</p>);
      case VersionStatus.FailedNoFileDir:
        return (<p>No directory was present with the package identifier, <b>{packageId}</b>. Ensure your directory structure is correct, and then try again.</p>);
      case VersionStatus.FailedNotEnoughSpace:
        return (<p>You do not own enough storage space to store the package file. Purchase more storage space in order to upload more packages or versions.</p>);
      case VersionStatus.FailedServer:
        return (<p>There was a server error packaging the file.</p>);
      default:
        return (<p style={{ color: 'red' }}>Invalid meta text invocation. Version status: <b>{version.status}</b>. This may be a bug.</p>);
      }
    }
    )();

    return (
      <div className='version-meta-text'>
        {innerHtml}
      </div>
    );
  }
}

export default PackageInformation;