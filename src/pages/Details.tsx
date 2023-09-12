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
 * The state of the details page.
 * 
 * @typedef {Object} DetailsState
 * @property {boolean} isLoading True if the page is loading (getting data from the registry).
 * @property {string} [errorMessage] Any errors that occured while fetching package data. If not undefined, it will display the error page with this message.
 * @property {[string, string][]} dependencies The dependencies of the version being modified. An array of tuples where the first value is the id of the package that this version depends on, and the second value is the selection string of the dependency. 
 * @property {[string, string][]} incompatibilities The incompatibilities of the version being modified. An array of tuples where the first value is the id of the package that this version is incompatible with, and the second value is the selection string of the incompatibility.
 * @property {string} xpSelectionStr The X-Plane version selection (not parsed).
 * @property {VersionSelection} xpSelection The parsed X-Plane version selection.
 * @property {File} [file] The file that will be re-uploaded in order to re-process.
 * @property {boolean} isSubmitting True if anything is currently being submitted.
 * @property {boolean} isUploading True if the a file is being re-uploaded.
 * @property {number} uploadProgress The upload progress, which is a number between 0 and 1, where 0 is 0% uploaded, and 1 is 100% uploaded. 
 * @property {string} [uploadError] A human-readable message, which is set if there was an error with the upload.
 * @property {boolean} incompatibilityErr True if there is an error with the incompatibility list.
 * @property {string} [popupTitle] If defined, the title to display in the popup.
 * @property {string} [popupText] If defined, the text to display in the popup.
 * @property {() => void} [popupAction] If defined, the action to perform after closing the popup. Only run once, then reset.
 * @property {TimeChartData} [downloadsData] The data for the downloads chart (the current period).
 */
type DetailsState = {
  isLoading: boolean;
  errorMessage?: string;
  dependencies: [string, string][];
  incompatibilities: [string, string][];
  xpSelectionStr: string;
  xpSelection: VersionSelection;
  file?: File;
  isSubmitting: boolean;
  isUploading: boolean;
  uploadProgress: number;
  uploadError?: string;
  incompatibilityErr: boolean;
  popupTitle?: string;
  popupText?: string;
  popupAction?: () => void;
  downloadsData?: TimeChartData[];
};

import { Component, ReactNode } from 'react';
import * as tokenStorage from '../scripts/tokenStorage';
import Version from '../scripts/version';
import { downloadFile, httpRequest } from '../scripts/http';
import HTTPMethod from 'http-method-enum';
import MainContainer from '../components/Main Container/MainContainer';
import MainContainerContent from '../components/Main Container/MainContainerContent';
import MainContainerLoading from '../components/Main Container/MainContainerLoading';
import MainContainerError from '../components/Main Container/MainContainerError';
import PackageInfoFields from '../components/PackageInfoFields';
import PackageList, { PackageListProps } from '../components/PackageList';
import '../css/Details.scss';
import InputFile, { InputFileProps } from '../components/Input/InputFile';
import LoadingBarPopup from '../components/LoadingBarPopup';
import axios, { AxiosError } from 'axios';
import InputField, { InputFieldProps } from '../components/Input/InputField';
import ConfirmPopup from '../components/ConfirmPopup';
import { AuthorSingleVersionPackageData, PackageType, VersionStatus, getAuthorPackageVersion } from '../scripts/author';
import RegistryError from '../scripts/registryError';
import VersionSelection from '../scripts/versionSelection';
import PackageInformation from './PackageInformation';
import {getAnalytics, AnalyticsData, TimeChartData, formatAnalyticsDataToDays } from '../scripts/analytics';
import { Line }  from 'react-chartjs-2';
import { DateTime, Duration } from 'luxon';
import 'chartjs-adapter-luxon';
import {
  Chart as ChartJS,
  LinearScale,
  LineElement,
  Title,
  PointElement,
  Legend,
  Filler,
  TimeScale,
} from 'chart.js';

ChartJS.register(
  LinearScale,
  LineElement,
  Title,
  PointElement,
  Legend,
  Filler,
  TimeScale,
);

const DOWNLOADS_CHART_COLOR = '#1f222a';

class Details extends Component {
  
  state: DetailsState;

  private _data?: AuthorSingleVersionPackageData;

  private _originalIncompatibilities = '[]';
  private _originalSelection = '*';

  private _backURL?: string;
  private _backText?: string;

  private _minDate: DateTime;
  private _maxDate: DateTime;

  constructor(props: Record<string, never>) {
    super(props);

    this.state = {
      isLoading: true,
      dependencies: [],
      incompatibilities: [],
      isSubmitting: false,
      isUploading: false,
      uploadProgress: 0,
      incompatibilityErr: false,
      xpSelectionStr: '*',
      xpSelection: new VersionSelection('*')
    };

    this._maxDate = DateTime.now().startOf('day');
    this._minDate = this._maxDate.minus(Duration.fromObject({ weeks: 2 }));

    const token = tokenStorage.checkAuth();
    if (!token) {
      tokenStorage.delToken();
      sessionStorage.setItem('post-auth-redirect', '/packages');
      window.location.href = '/';
      return;
    }

    this._updateIncompatibilities = this._updateIncompatibilities.bind(this);
    this._updateXpSelection = this._updateXpSelection.bind(this);
  }

  async componentDidMount() {
    const urlParams = new URLSearchParams(location.search);
    let packageId: string;
    let version: string;

    try {
      packageId = urlParams.get('packageId')?.trim().toLowerCase() as string;
      version = urlParams.get('packageVersion')?.trim().toLowerCase() as string;
    } catch (e) {
      return this.setState({
        errorMessage: 'Invalid package identifier or version provided.'
      } as Partial<DetailsState>);
    }

    const referrer = urlParams.get('referrer') || 'packages';
    switch (referrer) {
    case 'package_info':
      this._backText = 'Package Information';
      this._backURL = '/packages/package?packageId=' + packageId;
      break;
    case 'packages':
    default:
      this._backText = 'Packages';
      this._backURL = '/packages';
      break;
    }

    if (!Version.fromString(version)) {
      return this.setState({
        errorMessage: 'Invalid version provided.'
      } as Partial<DetailsState>);
    }

    try {
      let analytics: AnalyticsData[];
      let lastAnalyticsData: AnalyticsData[];
      [this._data, analytics, lastAnalyticsData] = await Promise.all([
        getAuthorPackageVersion(packageId, version),
        getAnalytics(packageId, version, this._minDate),
        getAnalytics(packageId, version, this._minDate.minus({weeks: 2}), this._minDate)
      ]);

      lastAnalyticsData.forEach(d => d.timestamp = d.timestamp.plus({weeks: 2}));
      
      this._originalSelection = this._data.versionData.xpSelection.toString();
      this._originalIncompatibilities = JSON.stringify(this._data.versionData.incompatibilities);
      this.setState({
        errorMessage: void (0),
        isLoading: false,
        dependencies: this._data.versionData.dependencies,
        incompatibilities: this._data.versionData.incompatibilities,
        xpSelectionStr: this._data?.versionData.xpSelection.toString(),
        downloadsData: formatAnalyticsDataToDays(analytics, this._minDate, this._maxDate),
      } as Partial<DetailsState>);
    } catch (e) {
      console.error(e);
      let errorMessage = 'An unknown error occured.';
      if (e instanceof RegistryError) {
        switch (e.status) {
        case 400:
          errorMessage = 'Invalid package identifier or version provided.';
          break;
        case 401:
          tokenStorage.delToken();
          sessionStorage.setItem('post-auth-redirect', '/packages');
          window.location.href = '/';
          return;
        case 404:
          errorMessage = 'Package version not found.';
          break;
        case 409:
        case 429:
          errorMessage = 'You are doing that too much. Please try again later.';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          break;  
        }
      }

      this.setState({ errorMessage } as Partial<DetailsState>);
    }
  }

  // The reupload didn't fail, make a reupload request for a package processing job that failed
  private async _reuploadFailed(): Promise<void> {
    this.setState({
      isSubmitting: true,
      isUploading: true,
      uploadProgress: 0,
      uploadError: void 0
    } as Partial<DetailsState>);

    const formData = new FormData();
    formData.append('packageId', this._data?.packageId as string);
    formData.append('packageVersion', this._data!.versionData.packageVersion.toString());

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
          } as Partial<DetailsState>);
        },
      });

      window.location.reload();
    } catch (e) {
      let errorMessage = 'An unknown error occured.';
      
      if (e instanceof AxiosError) {
        switch (e.response?.status) {
        case 400:
          errorMessage = {
            invalid_or_empty_str: 'Invalid or empty string.',
            no_file: 'File not provided.',
            invalid_id_or_repo: 'Bad identifier, or wrong repository.',
            invalid_version: 'Invalid version format.',
            version_not_exist: 'The package does not contain the provided version.',
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
        isSubmitting: false,
        isUploading: false
      } as Partial<DetailsState>);
    }
  }

  private _reuploadSection(): JSX.Element {
    const status = this._data?.versionData.status as VersionStatus;
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
          } as Partial<DetailsState>);
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
              disabled={!this.state.file || this.state.isSubmitting}
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

  private async _updateXpSelection() {
    this.setState({
      isSubmitting: true
    } as Partial<DetailsState>);

    if (!this.state.xpSelection.isValid) {
      return this.setState({
        popupTitle: 'X-Plane Version Selection Update Error',
        popupText: 'Invalid X-Plane selection provided.',
        isSubmitting: false
      } as Partial<DetailsState>);
    }

    let response;
    try {
      response = await httpRequest(`${window.REGISTRY_URL}/packages/xpselection`, HTTPMethod.PATCH, tokenStorage.checkAuth() as string, {
        packageId: this._data?.packageId as string,
        packageVersion: this._data?.versionData.packageVersion.toString(),
        xpSelection: this.state.xpSelection.toString()
      });
    } catch (e) {
      console.error(e);
      return this.setState({
        popupTitle: 'X-Plane Version Selection Update Error',
        popupText: 'Could not connect to the registry to update the X-Plane selection. Please try again later.',
        isSubmitting: false
      } as Partial<DetailsState>);
    }

    switch (response.status) {
    case 204:
      return this.setState({
        popupTitle: 'X-Plane Version Selection Updated',
        popupText: 'Successfully updated the X-Plane version selection.',
        popupAction: () => window.location.reload(),
      } as Partial<DetailsState>);
    case 400: {
      const humanReadableText = {
        invalid_or_empty_str: 'Invalid or empty string.',
        invalid_id_or_repo: 'Bad identifier, or wrong repository.',
        invalid_selection: 'X-Plane selection provided is invalid.',
        bad_sel_len: 'X-Plane version selection provided is too long',
        invalid_version: 'The version of this package being modified is invalid.',
        unknown: 'An unknown error occured.'
      }[response.responseText ?? 'unknown'] ?? 'An unknown error occured.';
      return this.setState({
        popupTitle: 'X-Plane Version Selection Update Error',
        popupText: humanReadableText,
        isSubmitting: false
      } as Partial<DetailsState>);
    }
    case 401:
      tokenStorage.delToken();
      sessionStorage.setItem('post-auth-redirect', '/packages');
      window.location.href = '/';
      return;
    case 409:
      return this.setState({
        popupTitle: 'X-Plane Version Selection Update Error',
        popupText: 'Unable to uniquely identify user. Please use a different browser, log in again, or try again later.',
        isSubmitting: false
      } as Partial<DetailsState>);
    case 429:
      return this.setState({
        popupTitle: 'X-Plane Version Selection Update Error',
        popupText: 'You are doing that too much. Wait a few seconds, and then try again later.',
        isSubmitting: false
      } as Partial<DetailsState>);
    case 500:
      return this.setState({
        popupTitle: 'X-Plane Version Selection Update Error',
        popupText: 'You are doing that too much. Wait a few seconds, and then try again later.',
        isSubmitting: false
      } as Partial<DetailsState>);
    default:
      return this.setState({
        popupTitle: 'X-Plane Version Selection Update Error',
        popupText: 'An unknown error occured, please try again later.',
        isSubmitting: false
      } as Partial<DetailsState>);
    }
  }

  private async _updateIncompatibilities() {
    this.setState({
      isSubmitting: true
    } as Partial<DetailsState>);

    const { incompatibilities, dependencies } = this.state;
    const dependencyIds = dependencies.map(d => d[0]);
    for (let [incompatibilityId, incompatibilitySelection] of incompatibilities) {
      incompatibilityId = incompatibilityId.trim().toLowerCase();
      incompatibilitySelection = incompatibilitySelection.trim().toLowerCase();

      const originalId = incompatibilityId;
      if (incompatibilityId.includes('xpkg/'))
        incompatibilityId = incompatibilityId.replace('xpkg/', '');

      if (this._data?.packageId === incompatibilityId || this._data?.packageId === originalId)
        return this.setState({
          popupTitle: 'Incompatibility Update Error',
          popupText: 'Package version can not be incompatible with itself.',
          isSubmitting: false,
        } as Partial<DetailsState>);
      
      if (dependencyIds.includes(incompatibilityId) || dependencyIds.includes(originalId)) {
        return this.setState({
          popupTitle: 'Incompatibility Update Error',
          popupText: 'Can not have a package in both the dependency and incompatibility lists. Publish a new package with a narrower dependency selection instead.',
          isSubmitting: false
        } as Partial<DetailsState>);
      }

      if (incompatibilities.length > 128) {
        return this.setState({
          popupTitle: 'Incompatibility Update Error',
          popupText: 'Too many incompatibilities submitted. Please contact support.',
          isSubmitting: false
        } as Partial<DetailsState>);
      }
    }

    let response;
    try {
      response = await httpRequest(`${window.REGISTRY_URL}/packages/incompatibilities`, HTTPMethod.PATCH, tokenStorage.checkAuth() as string, {
        packageId: this._data?.packageId as string,
        packageVersion: this._data?.versionData.packageVersion.toString(),
        incompatibilities
      });
    } catch (e) {
      console.error(e);
      return this.setState({
        popupTitle: 'Incompatibility Update Error',
        popupText: 'Could not connect to the registry to update incompatibilities. Please try again later.',
        isSubmitting: false
      } as Partial<DetailsState>);
    }

    switch (response.status) {
    case 204:
      return this.setState({
        popupTitle: 'Incompatibilities Updated',
        popupText: 'Successfully updated incompatibilities.',
        popupAction: () => window.location.reload(),
      } as Partial<DetailsState>);
    case 400: {
      const humanReadableText = {
        invalid_or_empty_str: 'Invalid or empty string.',
        too_many_incompatibilities: 'Incompatibility list too long.',
        invalid_id_or_repo: 'Bad identifier, or wrong repository.',
        invalid_version: 'The version of this package being modified is invalid.',
        bad_inc_arr: 'Too many incompatibilities provided.',
        bad_inc_tuple: 'Incompatibility list has an invalid tuple.',
        invalid_inc_tuple_types: 'Incompatibility list has a tuple that does not contain only strings.',
        invalid_inc_tuple_id: 'Incompatibility list contains an invalid package identifier.',
        dep_or_self_inc: 'Incompatibility list contains an declared incompatibility on itself, or a dependency.',
        invalid_inc_sel: 'Incompatibility has an invalid selection.',
        unknown: 'An unknown error occured.'
      }[response.responseText ?? 'unknown'] ?? 'An unknown error occured.';
      return this.setState({
        popupTitle: 'Incompatibility Update Error',
        popupText: humanReadableText,
        isSubmitting: false
      } as Partial<DetailsState>);
    }
    case 401: 
      tokenStorage.delToken();
      sessionStorage.setItem('post-auth-redirect', '/packages');
      window.location.href = '/';
      return;
    case 409:
      return this.setState({
        popupTitle: 'Incompatibility Update Error',
        popupText: 'Unable to uniquely identify user. Please use a different browser, log in again, or try again later.',
        isSubmitting: false
      } as Partial<DetailsState>);
    case 429:
      return this.setState({
        popupTitle: 'Incompatibility Update Error',
        popupText: 'You are doing that too much. Wait a few seconds, and then try again later.',
        isSubmitting: false
      } as Partial<DetailsState>);
    case 500:
      return this.setState({
        popupTitle: 'Incompatibility Update Error',
        popupText: 'You are doing that too much. Wait a few seconds, and then try again later.',
        isSubmitting: false
      } as Partial<DetailsState>);
    default:
      return this.setState({
        popupTitle: 'Incompatibility Update Error',
        popupText: 'An unknown error occured, please try again later.',
        isSubmitting: false
      } as Partial<DetailsState>);
    }
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
      if (!this._data?.versionData ) {
        this.setState({
          errorMessage: 'Version data not found on client'
        } as Partial<DetailsState>);
        return (<p>Error... please wait</p>); // Will load error page once state is set
      }

      const dependencyListProps: PackageListProps = {
        list: this.state.dependencies,
        title: 'Dependencies',
        noneText: 'No dependencies',        
        readonly: true
      };

      const incompatibilityListProps: PackageListProps = {
        list: this.state.incompatibilities,
        onChange: err => {
          this.setState({
            incompatibilityErr: err
          } as Partial<DetailsState>);
        },
        title: 'Incompatibilities',
        noneText: 'No incompatibilities'
      };

      const xpSelectionFieldProps: InputFieldProps = {
        classes: ['w-full'],
        label: 'X-Plane Selection',
        placeholder: 'x.x.x-x.x.x',
        defaultValue: this._data?.versionData.xpSelection.toString(),
        hiddenError: !this.state.xpSelection.isValid,
        minLength: 0,
        maxLength: 256,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          this.setState({
            xpSelectionStr: e.target.value,
            xpSelection: new VersionSelection(e.target.value)
          } as Partial<DetailsState>);
        }
      };

      return (
        <>
          <LoadingBarPopup
            open={this.state.isUploading}
            progress={this.state.uploadProgress}
            title='Uploading'
            text={this._getLoadingBarText()}
          />

          <ConfirmPopup
            open={!!(this.state.popupText || this.state.popupTitle)}
            title={this.state.popupTitle ?? '<NO POPUP TITLE>'}
            confirmText='Ok'
            showClose={false}
            onClose={() => {
              if (this.state.popupAction)
                this.state.popupAction();

              this.setState({
                popupTitle: void 0,
                popupText: void 0,
                popupAction: void 0
              } as Partial<DetailsState>);
            }}
          >
            <p className='generic-popup-text'>{this.state.popupText ?? '<NO POPUP TEXT>'}</p>
          </ConfirmPopup>

          <MainContainer>
            <MainContainerContent
              title='Version Details'
              backButtonText={this._backText}
              backButtonURL={this._backURL}
            >
              <>
                <PackageInfoFields
                  packageId={this._data.packageId}
                  packageName={this._data?.packageName as string}
                  packageType={this._data?.packageType as PackageType}
                  packageVersion={this._data.versionData.packageVersion.toString()}
                />
                
                <section className='mt-7'>
                  <div id='version-meta'>
                    {PackageInformation.getVersionInfoText(this._data.packageId, this._data.packageType, this._data.versionData)}
                    <aside id='action-buttons'>
                      {
                        this._data.versionData.isStored && this._data.versionData.status === VersionStatus.Processed &&
                      <>
                        <button
                          onClick={() => downloadFile(this._data?.versionData.loc as string, `${this._data?.packageId}@${this._data?.versionData.packageVersion}`)}
                          className='primary-button'
                        >Download Package File</button>
                        <button
                          onClick={() => downloadInstallationFile(this._data!.packageId, this._data!.versionData.packageVersion.toString()!, this._data?.versionData.privateKey)}
                          className='primary-button'
                        >Download Installation File</button>
                      </>
                      }
                    </aside>
                  </div>
                </section>
                {this._data.versionData.status === VersionStatus.Processed && <section className='mt-7 h-18'>
                  <Line datasetIdKey='downloads-data'
                    options={{
                      maintainAspectRatio: false,
                      elements: {
                        point: {
                          radius: 0,
                        }
                      },
                      scales: {
                        x: {
                          type: 'time',
                          min: this._minDate.valueOf(),
                          max: this._maxDate.valueOf(),
                          time: {
                            minUnit: 'day',
                          }
                        },
                        y: {
                          min: 0
                        }
                      }
                    }}
                    data={{
                      datasets: [{
                        data: this.state.downloadsData,
                        borderColor: DOWNLOADS_CHART_COLOR,
                        backgroundColor: DOWNLOADS_CHART_COLOR + '90',
                        label: 'Downloads Over the past 2 Weeks',
                        fill: true
                      }]
                    }}
                  />
                </section>}
                {this._reuploadSection()}
                <section className='mt-7 no-border'>
                  <div className='left-half'>
                    <InputField {...xpSelectionFieldProps} />
                    <button
                      className='primary-button mt-6 float-right'
                      disabled={this.state.isSubmitting || !this.state.xpSelection.isValid || this._originalSelection === this.state.xpSelection.toString()}
                      onClick={this._updateXpSelection}
                    >Update X-Plane Selection</button>
                  </div>
                </section>
                <section className='mt-11'>     
                  <div className='left-half'>                  
                    <PackageList {...dependencyListProps} />
                  </div>
                  <div className='right-half'>
                    <PackageList {...incompatibilityListProps} />
                  </div>
                </section>
                <section className='mt-9 no-border'>
                  <div className='float-right'>
                    <button
                      className='primary-button'
                      disabled={this._originalIncompatibilities === JSON.stringify(this.state.incompatibilities) || this.state.incompatibilityErr || this.state.isSubmitting}
                      onClick={this._updateIncompatibilities}
                    >Update Incompatibilities</button>
                  </div>
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

export default Details;