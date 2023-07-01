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
 * Enumeration of subpages in the packages page.
 * 
 * @name PackagePage
 * @enum {string}
 */
enum PackagePage {
  Packages,
  Resources,
  Reports
}

/**
 * Enumeration of all possible package types. Same as in /src/packages/packageDatabase.ts on the registry.
 * 
 * @name PackageType
 * @enum {string}
 */
export enum PackageType {
  Aircraft = 'aircraft',
  Executable = 'executable',
  Scenery = 'scenery',
  Plugin = 'plugin',
  Livery = 'livery',
  Other = 'other'
}

/**
 * Enumeration of all statuses for package versions. Same as in /src/packages/packageDatabase.ts on the registry. See registry source code for more information.
 * 
 * @name VersionStatus
 * @enum {string}
 */
export enum VersionStatus {
  Processing = 'processing', 
  Processed = 'processed',
  Removed = 'removed',
  FailedMACOSX = 'failed_macosx',
  FailedNoFileDir = 'failed_no_file_dir', 
  FailedManifestExists = 'failed_manifest_exists', 
  FailedInvalidFileTypes = 'failed_invalid_file_types',
  FailedFileTooLarge = 'failed_file_too_large',
  FailedNotEnoughSpace = 'failed_not_enough_space',
  FailedServer = 'failed_server',
  Aborted = 'aborted'
}

/**
 * The data for a single package which is sent to the client.
 * 
 * @typedef {Object} PackageData
 * @property {string} packageId The identifier of the package.
 * @property {string} packageName The name of the package.
 * @property {string} authorId The id of the author that uploaded the package.
 * @property {string} authorName The name of the author that uploaded the package.
 * @property {string} description The description of the package.
 * @property {PackageType} packageType The type of the package.
 * @property {VersionData[]} versions The version data of the package;
 */
export type PackageData = {
  packageId: string;
  packageName: string;
  authorId: string;
  authorName: string;
  description: string;
  packageType: PackageType;
  versions: VersionData[]
};

/**
 * The data for a specific version of a package.
 * 
 * @typedef {Object} VersionData
 * @property {string} packageId The identifier of the package.
 * @property {string} version The semantic version string of the package.
 * @property {string} hash The hexadecimal hash of the package files.
 * @property {boolean} isPublic True if the version is public.
 * @property {boolean} isStored True if the version is stored.
 * @property {string} loc The URL from which to download the package version.
 * @property {number} installs The number of installs for this version.
 * @property {string} uploadDate The upload timestamp of the package as an ISO string.
 * @property {VersionStatus} status The status of the version.
 * @property {[string, string][]} dependencies The dependencies of the version.
 * @property {[string, string][]} incompatibilities The incompatibilities of the version.
 * @property {number} size The size of the file in bytes.
 * @property {number} installedSize The size of the xpkg file unzipped directory in bytes.
 * @property {string} xpSelection The X-Plane selection string.
 */
export type VersionData = {
  packageId: string;
  version: string;
  hash: string;
  isPublic: boolean;
  isStored: boolean;
  loc: string;
  privateKey: string;
  installs: string;
  uploadDate: string;
  status: VersionStatus;
  dependencies: [string, string][];
  incompatibilities: [string, string][];
  size: number;
  installedSize: number;
  xpSelection: string;
};

/**
 * State of the packages page.
 * 
 * @typedef {Object} PackagesState
 * @property {PackagePage} page The current page
 * @property {boolean} isLoading True if the packages are currently loading.
 * @property {string} [errorMessage] Undefined if there is no error, otherwise has the error message.
 * @property {string} [successMessage] The success message passed in through the query parameters.
 * @property {Object} data The data returned from the server concerning the packages.
 * @property {PackageData[]} [packages] The packages returned from the server.
 */
type PackagesState = {
  page: PackagePage;
  isLoading: boolean;
  errorMessage?: string;
  successMessage?: string;
  data: {
    packages?: PackageData[];
    // resources?: Resource[];
    // bug reports
  };
}

import { Component, ReactElement, ReactNode } from 'react';
import MainContainer from '../components/Main Container/MainContainer';
import MainContainerContent from '../components/Main Container/MainContainerContent';
import MainContainerError from '../components/Main Container/MainContainerError';
import MainContainerLoading from '../components/Main Container/MainContainerLoading';
import SideBar from '../components/Main Container/SideBar';
import {  downloadFile, httpRequest } from '../scripts/http';
import * as tokenStorage from '../scripts/tokenStorage';
import '../css/Packages.scss';
import '../css/Buttons.scss';
import '../css/SubrowStyles.scss';
import Table, { TableProps } from '../components/Table';
import { nanoid } from 'nanoid';
import $ from 'jquery';
import Version from '../scripts/version';
import Big from 'big.js';
import HTTPMethod from 'http-method-enum';
import { StorageData, getStorageData } from '../scripts/registry';
import StorageBar from '../components/StorageBar';

class Packages extends Component {

  state: PackagesState;
  
  // This doesn't need to be part of the state since we get it before we finish loading anyway
  private _storageData?: StorageData;

  constructor(props: Record<string, never>) {
    super(props);

    const successMessage = sessionStorage.getItem('success_message') ?? void 0;
    const errorMessage = sessionStorage.getItem('error_message') ?? void 0;

    sessionStorage.removeItem('success_message');
    sessionStorage.removeItem('error_message');

    this.state = {
      page: PackagePage.Packages,
      isLoading: true,
      data: {},
      successMessage,
      errorMessage
    };

    const token = tokenStorage.checkAuth();
    if (!token) {
      tokenStorage.delToken();
      sessionStorage.setItem('post-auth-redirect', '/packages');
      window.location.href = '/';
      return;
    }   
  } 

  private _storageBar(): JSX.Element {
    return (
      <div id='table-top-storage-disp'>
        <StorageBar {...this._storageData as StorageData} />
      </div>
    );
  }
  
  private _packagesPage(): JSX.Element {
    const data = [] as string[][];
    const subrowData = [] as PackageData[];
    
    for (const pkg of this.state.data.packages as PackageData[]) {
      if (!pkg.versions.length)
        data.push([
          pkg.packageName,
          pkg.packageId, '---',
          pkg.versions.length.toString(),
          pkg.description.slice(0, 9) + '...'
        ]);
      else 
        data.push([
          pkg.packageName,
          pkg.packageId,
          pkg.versions[0].version,
          pkg.versions.length.toString(),
          pkg.description.slice(0, 9) + '...'
        ]);
      subrowData.push(pkg);
    }

    // Columns and their percentage of width
    const columns = {
      Package: 25,
      Identifier: 25,
      'Latest Version': 20,
      Versions: 15,
      Description: 15
    };

    const tableParams = {
      columns,
      data,
      subrowData,
      emptyMessage: 'No packages',
      subrowRender: (pkg: PackageData): ReactElement => {

        const versions = [] as JSX.Element[];
        if (pkg.versions.length){
          for (const version of pkg.versions) {

            const uploadDate = new Date(version.uploadDate);

            versions.push(
              <tr key={nanoid()}>
                <td>{version.version}</td>
                <td>{version.installs}</td>
                <td>{version.isPublic ? 'Yes' : 'No'}</td>
                <td>{version.isStored ? 'Yes' : 'No'}</td>
                <td>{uploadDate.toLocaleDateString()} { uploadDate.toLocaleTimeString() }</td>
                <td>{getStatusTextShort(version.status)}</td>
                <td><a className='subtable-link' href={`/packages/details?packageId=${version.packageId}&packageVersion=${version.version}`}>Details</a></td>
              </tr>
            );
          }
        } else {
          versions.push(
            <tr key={nanoid()}>
              <td colSpan={6}>
                <p>No versions</p>
              </td>
            </tr>
          );
        }

        return (
          <div className='package-subrow'>
            <h2>{pkg.packageName}</h2>
            <h3>{pkg.packageId}</h3>
            
            <button
              className='subrow-top-right primary-button'
              onClick={() => window.location.href = '/packages/package?packageId=' + pkg.packageId}
            >Package Information</button>

            <p className='package-description'>{pkg.description.length > 1024 ? pkg.description.substring(0, 1021) + '...' : pkg.description}</p>
            
            <div className='subtable-wrapper'>
              <table>
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Installs</th>
                    <th>Public</th>
                    <th>Stored</th>
                    <th>Uploaded</th>
                    <th>Status</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {versions}
                </tbody>
              </table>
            </div>
          </div>
        );
      }
    } as TableProps<PackageData>;

    return (

      // Packages page
      <MainContainerContent title='Packages'>
        <>
          {this.state.successMessage && <p className='success-message'>{this.state.successMessage}</p>}
          <button className='primary-button' onClick={() => window.location.href = '/packages/new'}><span className='leading-4 text-[24pt]'>+</span>&nbsp;Create a new package</button>

          {this._storageBar()}
          <Table {...tableParams} />
        </>

      </MainContainerContent>
    );
  }

  componentDidMount(): void {
    getStorageData().then(data => {
      this._storageData = data;
      const token = tokenStorage.checkAuth() as string;
      httpRequest(`${window.REGISTRY_URL}/account/packages`, HTTPMethod.GET, token , { }, (err, res) => {
        if (err)
          return this.setState({
            errorMessage: 'An unknown error occured'
          } as Partial<PackagesState>);
      
        if (res?.status !== 200) {
          const errorMessage = 'An unknown error occured';

          if (res?.status === 401) {
            tokenStorage.delToken();
            window.location.href = '/';
          }

          return this.setState({ errorMessage } as Partial<PackagesState>);
        }

        // We need to spread so that we can update the sub properties (data.packages instead of updating data all at once)
        const data = { ...this.state.data };
        data.packages = JSON.parse(res.response);

        data.packages?.forEach(pkg => {
          pkg.versions.sort((a, b) => {
            const aVer = Version.fromString(a.version);
            const bVer = Version.fromString(b.version);

            // Flipping a and b reverses the sort
            return bVer?.toFloat().cmp(aVer?.toFloat() as Big).valueOf() as number;
          });
        });

        this.setState({
          errorMessage: void (0),
          isLoading: false,
          data
        } as Partial<PackagesState>);
      });
    })
      .catch(err => {
        console.error(err);
        this.setState({
          errorMessage: 'Could not retrieve storage data'
        } as Partial<PackagesState>);
      });
  }

  render(): ReactNode {
    const isPackagePageActive = this.state.page === PackagePage.Packages;
    const isResourcesPageActive = this.state.page === PackagePage.Resources;

    return (
      <MainContainer
        left={(
          <SideBar items={[
            {
              text: 'Packages',
              action: () =>
                this.setState({
                  page: PackagePage.Packages
                })
            },
            {
              text: 'Resources',
              action: () =>
                this.setState({
                  page: PackagePage.Resources
                })
            },
            {
              text: 'Bug Reports',
              action: () =>
                this.setState({
                  page: PackagePage.Reports
                })
            }
          ]}
          />
        )}

        right={
          // We wrap this in a function just to use regular JS stuff
          ((): ReactNode => {
            if (this.state.errorMessage) {
              return (
                <MainContainerError
                  message={this.state.errorMessage}
                  linkName='Return Home'
                  link='/packages'
                />
              );
            } else if (this.state.isLoading) {
              return (
                <MainContainerLoading loadingMessage='Loading Packages and Resources'/>
              );
            } else if (isPackagePageActive) 
              return this._packagesPage();
            else if (isResourcesPageActive) {
              return (

                // Resources page
                <MainContainerContent title='Resources'>
                  <p>Resources</p>
                </MainContainerContent>
              );
            } else {
              return (

                // Reports page
                <MainContainerContent title='Bug Reports'>
                  <p>Reports</p>
                </MainContainerContent>
              );
            }
          })()
        }
      />
    );
  }
}

/**
 * Get a short version of the status, that doesn't specify the failure reason.
 * 
 * @param {VersionStatus} status The status to get the text of.
 * @return {string} The human-readable status.
 */
export function getStatusTextShort(status: VersionStatus) {
  switch (status) {
  case VersionStatus.Processing: return 'Processing';
  case VersionStatus.Processed: return 'Processed';
  case VersionStatus.Removed: return 'Removed';
  case VersionStatus.Aborted: return 'Aborted';
  case VersionStatus.FailedInvalidFileTypes:
  case VersionStatus.FailedMACOSX:
  case VersionStatus.FailedManifestExists:
  case VersionStatus.FailedNoFileDir:
  case VersionStatus.FailedFileTooLarge:
  case VersionStatus.FailedNotEnoughSpace:
  case VersionStatus.FailedServer:
    return 'Failed';
  default:
    return 'Unknown';
  }
}

export default Packages;