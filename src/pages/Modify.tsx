/*
 * Copyright (c) 2023. Arkin Solomon.
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
 * The state of the modify page.
 * 
 * @typedef {Object} ModifyState
 * @property {boolean} isLoading True if the page is loading (getting data from the registry).
 * @property {string} [errorMessage] Any errors that occured while fetching package data. If not undefined, it will display the error page with this message.
 * @property {[string, string][]} dependencies The dependencies of the version being modified. An array of tuples where the first value is the id of the package that this version depends on, and the second value is the selection string of the dependency. 
 * @property {[string, string][]} incompatibilities The incompatibilities of the version being modified. An array of tuples where the first value is the id of the package that this version is incompatible with, and the second value is the selection string of the incompatibility.
 * @property {File} [file] The file that will be re-uploaded in order to re-process.
 * @property {boolean} incompatibilityError True if there is an error with the incompatibilityList.
 * @property {boolean} isUploading True if a file is currently being uploaded.
 * @property {number} uploadProgress The upload progress, which is a number between 0 and 1, where 0 is 0% uploaded, and 1 is 100% uploaded. 
 * @property {string} [uploadError] A human-readable message, which is set if there was an error with the upload.
 */
type ModifyState = {
  isLoading: boolean;
  errorMessage?: string;
  dependencies: [string, string][];
  incompatibilities: [string, string][];
  file?: File;
  incompatibilityError: boolean;
  isUploading: boolean;
  uploadProgress: number;
  uploadError?: string;
};

import { Component, ReactNode } from 'react';
import * as tokenStorage from '../scripts/tokenStorage';
import Version from '../scripts/version';
import { downloadFile, httpRequest } from '../scripts/http';
import HTTPMethod from 'http-method-enum';
import { PackageData, PackageType, VersionData, VersionStatus } from './Packages';
import MainContainer from '../components/Main Container/MainContainer';
import MainContainerContent from '../components/Main Container/MainContainerContent';
import MainContainerLoading from '../components/Main Container/MainContainerLoading';
import MainContainerError from '../components/Main Container/MainContainerError';
import PackageInfoFields from '../components/PackageInfoFields';
import PackageList, { PackageListProps } from '../components/PackageList';
import '../css/Modify.scss';
import { getBestUnits } from '../scripts/displayUtil';
import InputFile, { InputFileProps } from '../components/Input/InputFile';
import LoadingBarPopup from '../components/LoadingBarPopup';
import axios, { AxiosError } from 'axios';

class Modify extends Component {
  
  state: ModifyState;

  private _packageData?: PackageData;
  private _versionData?: VersionData;

  private _initialIncompatibilities = '[]';

  constructor(props: Record<string, never>) {
    super(props);

    this.state = {
      isLoading: true,
      dependencies: [],
      incompatibilities: [],
      incompatibilityError: false,
      isUploading: false,
      uploadProgress: 0
    };

    const token = tokenStorage.checkAuth();
    if (!token) {
      tokenStorage.delToken();
      sessionStorage.setItem('post-auth-redirect', '/packages');
      window.location.href = '/';
      return;
    }   
  }

  componentDidMount(): void {
    const urlParams = new URLSearchParams(location.search);
    let packageId: string;
    let version: string;

    try {
      packageId = urlParams.get('packageId')?.trim().toLowerCase() as string;
      version = urlParams.get('packageVersion')?.trim().toLowerCase() as string;
    } catch (e) {
      return this.setState({
        errorMessage: 'Invalid package identifier or version provided'
      } as Partial<ModifyState>);
    }

    if (!Version.fromString(version)) {
      return this.setState({
        errorMessage: 'Invalid version provided'
      } as Partial<ModifyState>);
    }

    const token = tokenStorage.checkAuth() as string;

    httpRequest(`${window.REGISTRY_URL}/account/packages`, HTTPMethod.GET, token , { }, (err, res) => {
      if (err)
        return this.setState({
          errorMessage: 'An unknown error occured'
        } as Partial<ModifyState>);
      
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
        } as Partial<ModifyState>);
      }

      this._packageData = (JSON.parse(res.response) as PackageData[])
        .find(pkg => pkg.packageId === packageId);
      
      if (!this._packageData) {
        this.setState({
          errorMessage: 'Package does not exist',
          isLoading: false
        });
        return;
      }

      this._versionData = this._packageData.versions
        .find(v => v.version === version);
      
      if (!this._versionData) {
        this.setState({
          errorMessage: 'Package version does not exist',
          isLoading: false
        });
        return;
      }

      // TODO get incompatibilites and dependencies
      this._initialIncompatibilities = JSON.stringify([]);
      
      this.setState({
        errorMessage: void (0),
        isLoading: false
      } as Partial<ModifyState>);
    });
  }

  private _getMetaText(): JSX.Element {
    switch (this._versionData?.status) {
    case VersionStatus.Processing:
      return (<p>This package is still processing. Check again later.</p>);
    case VersionStatus.Processed:
      return (
        <>
          <p>Installs: <b>{this._versionData.installs}</b></p>
          <p>Checksum: <b>{this._versionData.hash}</b></p>
          <p>Uploaded: <b>{this._versionData.uploadDate.toLocaleString()}</b></p>
          <p>Package Size: <b>{getBestUnits(this._versionData.size)} ({this._versionData.size} bytes)</b></p>
          <p>Installed Size: <b>{getBestUnits(this._versionData.installedSize)} ({this._versionData.installedSize} bytes)</b></p>
        </>
      );
    case VersionStatus.Removed:
      return (<p>This version has been removed from the registry. Please contact support.</p>);
    case VersionStatus.Aborted:
      return (<p>Processing of this version was aborted. There may have been a server error, or your package took too long to process. Please try again.</p>);
    case VersionStatus.FailedFileTooLarge:
      return (<p>The uploaded zip can not grow to be more than 16 GiB in size.</p>);
    case VersionStatus.FailedInvalidFileTypes:
      if (this._packageData?.packageType === PackageType.Executable)
        return (<p>The uploaded zip file may not contain symbolic links.</p>);
      else
        return (<p>The uploaded zip file may not contain symbolic links or executables.</p>);
    case VersionStatus.FailedMACOSX:
      return (<p>You only have a __MACOSX directory in your uploaded zip. Ensure your directory structure is correct, and then try again.</p>);
    case VersionStatus.FailedManifestExists:
      return (<p>You can not have a file named <b>manifest.json</b> in your zip file root.</p>);
    case VersionStatus.FailedNoFileDir:
      return (<p>No directory was present with the package id <b>{this._packageData?.packageId}</b>. Ensure your directory structure is correct, and then try again.</p>);
    case VersionStatus.FailedNotEnoughSpace:
      return (<p>You do not own enough storage space to store the package file. Purchase more storage space in order to upload more packages or versions.</p>);
    case VersionStatus.FailedServer:
      return (<p>There was a server error packaging the file.</p>);
    default:
      return (<p style={{ color: 'red' }}>Invalid meta text invocation. Version status: <b>{ this._versionData?.status }</b>. This may be a bug.</p>);
    }
  }

  // The reupload didn't fail, make a reupload request for a package processing job that failed
  private async _reuploadFailed(): Promise<void> {
    this.setState({
      isUploading: true,
      uploadProgress: 0,
      uploadError: void 0
    } as Partial<ModifyState>);

    const formData = new FormData();
    formData.append('packageId', this._packageData?.packageId as string);
    formData.append('packageVersion', this._versionData?.version as string);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formData.append('file', (document.getElementById('package-file') as any).files[0]);

    try {
      await axios({
        url: `${window.REGISTRY_URL}/packages/retry`,
        method: HTTPMethod.POST,
        data: formData,
        headers: {
          Authorization: tokenStorage.checkAuth() as string
        }, 
        onUploadProgress: e  => {
          this.setState({
            uploadProgress: e.progress
          } as Partial<ModifyState>);
        },
      });

      window.location.reload();
    } catch (e) {
      let errorMessage = 'An unknown error occured.';
      
      if (e instanceof AxiosError) {
        switch (e.response?.status) {
        case 400:
          errorMessage = {
            no_file: 'No file was provided.',
            missing_form_data: 'Missing form data.',
            invalid_form_data: 'Invalid form data provided.',
            invalid_version: 'The version provided is invalid.',
            no_package: 'The package does not exist.',
            no_version: 'The package at the specified version version does not exist.',
            cant_retry: 'You can not re-upload this package version.'
          }[e.response?.data as string]
              ?? `An unknown error occured [${e.response?.data}].`;
          break;
        case 500:
          errorMessage = 'An internal server error occured.';
          break;
        }
      }

      this.setState({
        uploadError: errorMessage,
        isUploading: false
      } as Partial<ModifyState>);
    }
  }

  private _reuploadSection(): JSX.Element {
    const status = this._versionData?.status as VersionStatus;
    if (status !== VersionStatus.Processed && status !== VersionStatus.Processing) {

      const fileUploadProps: InputFileProps = {
        label: 'Content File',
        id: 'package-file',
        name: 'package-file',
        types: '.zip',
        onChange: e => {
          if (!e.target.files?.length)
            return;
          this.setState({
            file: e.target.files[0]
          } as Partial<ModifyState>);
        }
      };

      return (
        <section id='reupload-section' className='mt-11'>
          <div id='reupload-left'>
            <h3>Re-upload file</h3>
            {this.state.uploadError && <p className='error-message'>{ this.state.uploadError }</p>}
            <InputFile {...fileUploadProps} />
          </div>
          <div id='reupload-right'>
            <p>Re-upload the zip file that you would like to package. Refer to the documentation to figure out what went wrong, and be sure to make those changes before re-uploading. If necessary, be sure to purchase enough storage to store your package.</p>
            <button
              type='button'
              className='primary-button'
              disabled={!this.state.file || this.state.isUploading}
              onClick={() => this._reuploadFailed()}
            >Upload</button>
          </div>
        </section>
      );
    }
    return (<></>);
  }

  private _getLoadingBarText() {
    if (this.state.uploadProgress < 1)
      return `Uploading -- ${Math.round(this.state.uploadProgress)}%`;
    return 'Waiting for confirmation from registry...';
  }

  render(): ReactNode {
    if (this.state.errorMessage) {
      return (
        <MainContainer>
          <MainContainerError
            message={this.state.errorMessage}
            linkName='Return Home'
            link='/packages'
          />
        </MainContainer>
      );
    }
    else if (this.state.isLoading) {
      return (
        <MainContainer>
          <MainContainerLoading loadingMessage='Fetching version data' />
        </MainContainer>
      );
    } else {
      if (!this._versionData ) {
        this.setState({
          errorMessage: 'Version data not found on client'
        } as Partial<ModifyState>);
        return (<p>Error... please wait</p>); // Will load error page once state is set
      }

      const dependencyListProps: PackageListProps = {
        list: this.state.dependencies,
        title: 'Dependencies',
        noneText: 'No dependencies',
        onChange: () => this.setState({}),
        readonly: true
      };

      const incompatibilityListProps: PackageListProps = {
        list: this.state.incompatibilities,
        title: 'Incompatibilities',
        noneText: 'No incompatibilities',
        onChange: e => this.setState({
          incompatibilityError: e
        } as Partial<ModifyState>)
      };

      return (
        <>
          <LoadingBarPopup
            open={this.state.isUploading}
            progress={this.state.uploadProgress}
            title='Uploading'
            text={this._getLoadingBarText()}
          />
          <MainContainer>
            <MainContainerContent title='Modify Version'>
              <>
                <PackageInfoFields
                  packageId={this._versionData.packageId}
                  packageName={this._packageData?.packageName as string}
                  packageType={this._packageData?.packageType as PackageType}
                  packageVersion={this._versionData.version}
                />
                <section className='mt-7'>
                  <div id='version-meta'>
                    {this._getMetaText()}
                    <aside id='action-buttons'>
                      {
                        this._versionData.isStored && this._versionData.status === VersionStatus.Processed &&
                      <>
                        <button
                          onClick={() => downloadFile(this._versionData?.loc as string, `${this._versionData?.packageId}@${this._versionData?.version}`)}
                          className='primary-button'
                        >Download Package File</button>
                        <button
                          onClick={() => downloadInstallationFile(this._packageData?.packageId as string, this._versionData?.version as string, this._versionData?.privateKey)}
                          className='primary-button'
                        >Download Installation File</button>
                      </>
                      }
                    </aside>
                  </div>
                </section>
                {this._reuploadSection()}
                <section className='mt-11'>     
                  <div className='left-half'>                  
                    <PackageList {...dependencyListProps} />
                  </div>
                  <div className='right-half'>
                    <PackageList {...incompatibilityListProps} />
                  </div>
                </section>
                <section className='mt-9'>
                  <button
                    type='button'
                    className='primary-button float-right'
                    disabled={this.state.incompatibilityError || this.state.isUploading || this._initialIncompatibilities === JSON.stringify(this.state.incompatibilities)}
                  >Update Incompatibilities</button>
                </section>
              </>
            </MainContainerContent>
          </MainContainer>
        </>
      );
    }
  }
}

/**
 * Create and download a package installation xpkg file.
 * 
 * @param {string} packageId The id of the package to install.
 * @param {string} packageVersion The version of the package to install.
 * @param {string} [passkey] The optional passkey (if required) to install the file.
 */
function downloadInstallationFile(packageId: string, packageVersion: string, passkey?: string): void {
  const blob = new Blob([`>>>>${packageId}>${packageVersion}>${passkey || '!'}`], { type: 'text/plain' });
  downloadFile(URL.createObjectURL(blob), `${packageId}@${packageVersion}.xpkg`);
}

export default Modify;