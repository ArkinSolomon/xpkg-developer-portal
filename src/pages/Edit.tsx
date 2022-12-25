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
 * @property {string} [basicChangeError] An error that occurs with the basic information changing.
 * @property {Object} basicErrors Any errors for the fields in the basic information sub-form.
 */
type EditState = {
  isLoading: boolean;
  errorMessage?: string;
  currentPackageData?: PackageData;
  basicChangeError?: string;
  basicErrors: Partial<BasicInformationValues>
}

/**
 * Values for the basic editing sub-form.
 * 
 * @typedef {Object} BasicInformationValues
 * @property {string} packageName The name of the package.
 * @property {string} description The description of the package.
 */
type BasicInformationValues = {
  packageName: string;
  description: string;
}

import { Component, ReactNode } from 'react';
import MainContainer from '../components/Main Container/MainContainer';
import MainContainerRightLoading from '../components/Main Container/MainContainerRightLoading';
import MainContainerRightError from '../components/Main Container/MainContainerRightError';
import MainContainerRight from '../components/Main Container/MainContainerRight';
import * as tokenStorage from '../scripts/tokenStorage';
import { downloadFile, postCB } from '../scripts/http';
import { PackageData, VersionData } from './Packages';
import { Formik } from 'formik';
import InputField, { InputFieldProps } from '../components/Input/InputField';
import InputArea, { InputAreaProps } from '../components/Input/InputArea';
import ErrorMessage from '../components/ErrorMessage';
import '../css/Edit.scss';
import '../css/SubrowStyles.scss';
import Table, { TableProps } from '../components/Input/Table';
import $ from 'jquery';

class Edit extends Component {

  state: EditState;

  constructor(props: Record<string, never>) {
    super(props);

    this.state = {
      isLoading: true,
      basicErrors: {}
    };

    const token = tokenStorage.checkAuth();
    if (!token) {
      sessionStorage.setItem('post-auth-redirect', '/packages');
      window.location.href = '/';
      return;
    }   
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
      
      this.setState({
        errorMessage: void (0),
        isLoading: false,
        currentPackageData
      } as Partial<EditState>);
    });
  }

  render(): ReactNode {
    if (this.state.errorMessage) 
      return (
        <MainContainer>
          <MainContainerRightError message={this.state.errorMessage} />
        </MainContainer>
      );
    else if (this.state.isLoading) 
      return (
        <MainContainer>
          <MainContainerRightLoading loadingMessage='Loading Package Information' />
        </MainContainer>
      );
    else {
      return (
        <MainContainer>
          <MainContainerRight title="Edit Package">
            <>
              <Formik
                initialValues={{
                  packageName: this.state.currentPackageData?.packageName,
                  description: this.state.currentPackageData?.description
                } as BasicInformationValues}
                onSubmit={
                  async (values, { setSubmitting }) => {
                    setSubmitting(false);
                    console.log(values);
                  }
                }
              >{({
                  handleChange,
                  handleSubmit,
                  isSubmitting
                }) => {

                  // To be perfectly honest (probably because of the router), I have no idea why these classes are still applying (yes I just copied and pasted this from Upload.tsx, no I don't feel like seperating these forms into individual components)
                  const packageNameData: InputFieldProps = {
                    classes: ['package-upload-input'],
                    name: 'packageName',
                    title: 'Package Name',
                    width: '35%',
                    minLength: 3,
                    maxLength: 32,
                    onChange: handleChange,
                    defaultValue: this.state.currentPackageData?.packageName,
                    error: this.state.basicErrors.packageName
                  };
  
                  const packageIdData: InputFieldProps = {
                    classes: ['package-upload-input'],
                    name: 'packageId',
                    title: 'Package Identifier',
                    readonly: true,
                    defaultValue: this.state.currentPackageData?.packageId,
                    width: '35%',
                  };

                  const packageTypeData: InputFieldProps = {
                    classes: ['package-upload-input', 'right'],
                    name: 'packageType',
                    title: 'Package Type',
                    defaultValue: this.state.currentPackageData?.packageType,
                    readonly: true
                  };
                
                  const descTextAreaData: InputAreaProps = {
                    name: 'description',
                    title: 'Description',
                    minLength: 10,
                    maxLength: 8192,
                    onChange: handleChange,
                    defaultValue: this.state.currentPackageData?.description,
                    error: this.state.basicErrors.description
                  };

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
                      console.log(version);
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
                            {!version.private && !version.published ? <button className='upload-button action-button'>Upload package</button> : void (0)}
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

                  return (
                    <>
                      <ErrorMessage text={this.state.basicChangeError ?? ''} show={!!this.state.basicChangeError} />
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
                            disabled={isSubmitting || !!Object.keys(this.state.basicErrors).length}
                          />
                        </div>
                        <div className='upload-input-section'>
                          <h2>Versions</h2>
                          <Table {...tableConfig} />
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
}

export default Edit;