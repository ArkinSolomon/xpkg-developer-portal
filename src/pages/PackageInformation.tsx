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
 * @property {PackageData} [currentPackageData] The current package data (not nessicarily up to date with the server).
 * @property {Partial<DescriptionValues?} descriptionErrors Any errors for the fields in the description update sub-form.
 * @property {ConfirmPopupConfig} [popupConfig] Configuration for the popup.
 * @property {boolean} isPopupVisible True if the popup is visible.
 * @property {boolean} isFormSubmitting True if any form is being submitted.
 * @property {boolean} isDescriptionOriginal True if the description is the same as the original description.
 */
type PackageInformationState = {
  isLoading: boolean;
  errorMessage?: string;
  currentPackageData?: PackageData;
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
import { PackageData, PackageType, VersionData, getStatusTextShort } from './Packages';
import { Formik, FormikErrors } from 'formik';
import InputArea, { InputAreaProps } from '../components/Input/InputArea';
import '../css/PackageInformation.scss';
import '../css/SubrowStyles.scss';
import Table, { TableProps } from '../components/Table';
import $ from 'jquery';
import ConfirmPopup, { ConfirmPopupConfig } from '../components/ConfirmPopup';
import Version from '../scripts/version';
import Big from 'big.js';
import HTTPMethod from 'http-method-enum';
import PackageInfoFields from '../components/PackageInfoFields';

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

  componentDidMount(): void {
    const urlParams = new URLSearchParams(location.search);
    let packageId: string;
    try {
      packageId = urlParams.get('packageId')?.toLowerCase() as string;
    } catch (e) {
      return this.setState({
        errorMessage: 'No package identifier provided'
      } as Partial<PackageInformationState>);
    }

    const token = tokenStorage.checkAuth() as string;

    httpRequest(`${window.REGISTRY_URL}/account/packages`, HTTPMethod.GET, token , { }, (err, res) => {
      if (err)
        return this.setState({
          errorMessage: 'An unknown error occured'
        } as Partial<PackageInformationState>);
      
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
        } as Partial<PackageInformationState>);
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
      
      currentPackageData.versions.sort((a, b) => {
        const aVer = Version.fromString(a.version);
        const bVer = Version.fromString(b.version);

        // Flipping a and b reverses the sort
        return bVer?.toFloat().cmp(aVer?.toFloat() as Big).valueOf() as number;
      });

      this._originalDesc = currentPackageData.description;
      
      this.setState({
        errorMessage: void (0),
        isLoading: false,
        currentPackageData
      } as Partial<PackageInformationState>);
    });
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

  private _versionSubrow(version: VersionData): JSX.Element {
    return (
      <div className='version-table-subrow'>
        <h3>{this.state.currentPackageData?.packageName} &#8212; {version.version}</h3>
        <p>{version.installs} installs</p>
        <p>Checksum: {version.hash}</p>

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
            onClick={() => window.location.href = `/packages/details?packageId=${this.state.currentPackageData?.packageId}&packageVersion=${version.version}&referrer=package_info`}
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
        subrowRender: this._versionSubrow.bind(this)
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

      return (
        <MainContainer>
          <MainContainerContent
            title='Edit Package'
            backButtonText='Packages'
            backButtonURL='/packages'
          >
            <>
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
                        <PackageInfoFields
                          packageId={this.state.currentPackageData?.packageId as string}
                          packageName={this.state.currentPackageData?.packageName as string}
                          packageType={this.state.currentPackageData?.packageType as PackageType}
                        />
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
}

export default PackageInformation;