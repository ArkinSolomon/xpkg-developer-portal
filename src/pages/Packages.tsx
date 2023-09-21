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
 */
type PackagesState = {
  page: PackagePage;
  isLoading: boolean;
  errorMessage?: string;
  successMessage?: string;
}

import { Component, ReactElement, ReactNode } from 'react';
import MainContainer from '../components/Main Container/MainContainer';
import MainContainerContent from '../components/Main Container/MainContainerContent';
import MainContainerError from '../components/Main Container/MainContainerError';
import MainContainerLoading from '../components/Main Container/MainContainerLoading';
import SideBar from '../components/Main Container/SideBar';
import * as tokenStorage from '../scripts/tokenStorage';
import '../css/Packages.scss';
import '../css/Buttons.scss';
import '../css/SubrowStyles.scss';
import Table, { TableProps } from '../components/Table';
import { nanoid } from 'nanoid';
import Big from 'big.js';
import { AuthorData, AuthorPackageData, PackageType, VersionStatus, getAllAuthorPackages, getAuthorData } from '../scripts/author';
import StorageBar from '../components/StorageBar';
import RegistryError from '../scripts/registryError';

class Packages extends Component {

  state: PackagesState;
  
  private _authorData?: AuthorData;
  private _packageData?: AuthorPackageData[];

  constructor(props: Record<string, never>) {
    super(props);

    const successMessage = sessionStorage.getItem('success_message') ?? void 0;
    const errorMessage = sessionStorage.getItem('error_message') ?? void 0;

    sessionStorage.removeItem('success_message');
    sessionStorage.removeItem('error_message');

    this.state = {
      page: PackagePage.Packages,
      isLoading: true,
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
        <StorageBar {...this._authorData as AuthorData} />
      </div>
    );
  }
  
  private _packagesPage(): JSX.Element {
    const data: string[][] = [];
    
    for (const pkg of this._packageData!) {
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
          pkg.versions[0].packageVersion.toString(),
          pkg.versions.length.toString(),
          pkg.description.slice(0, 9) + '...'
        ]);
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
      subrowData: this._packageData,
      emptyMessage: 'No packages',
      subrowRender: (pkg: AuthorPackageData): ReactElement => {

        const versions: JSX.Element[] = [];
        if (pkg.versions.length){
          for (const version of pkg.versions) {

            const uploadDate = new Date(version.uploadDate);
            const versionStr = version.packageVersion.toString();
            versions.push(
              <tr key={nanoid()}>
                <td>{versionStr}</td>
                <td>{version.downloads}</td>
                <td>{version.isPublic ? 'Yes' : 'No'}</td>
                <td>{version.isStored ? 'Yes' : 'No'}</td>
                <td>{uploadDate.toLocaleDateString()} { uploadDate.toLocaleTimeString() }</td>
                <td>{getStatusTextShort(version.status)}</td>
                <td><a className='subtable-link' href={`/packages/details?packageId=${pkg.packageId}&packageVersion=${versionStr}`}>Details</a></td>
              </tr>
            );
          }
        } else {
          versions.push(
            <tr key={nanoid()}>
              <td colSpan={7}>
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
                    <th>Downloads</th>
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
    } as TableProps<AuthorPackageData>;

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

  async componentDidMount(): Promise<void> {
    try {
      [this._authorData, this._packageData] = await Promise.all([
        getAuthorData(),
        getAllAuthorPackages()
      ]);

      this._packageData.forEach(pkg => {
        pkg.versions.sort((a, b) => {
          return b.packageVersion.toFloat().cmp(a.packageVersion.toFloat() as Big).valueOf() as number;
        });
      });

      this.setState({
        isLoading: false
      } as Partial<PackagesState>);
    } catch (e) {
      console.error(e);
      this.setState({
        errorMessage: 'Could not retrieve data from the registry.'
      } as Partial<PackagesState>);

      if (e instanceof RegistryError && e.status === 401) {
        tokenStorage.delToken();
        window.location.href = '/';
      }
    }
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
                  linkName='Try Again'
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