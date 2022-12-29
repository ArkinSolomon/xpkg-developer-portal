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
 * Enumeration of subpages in the packages page.
 * 
 * @name PackagePage
 * @enum {string}
 */
enum PackagePage {
  PACKAGES,
  RESOURCES,
  REPORTS
}

/**
 * Enumeration of all possible package types.
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
 * @property {boolean} approved True if the version is approved.
 * @property {boolean} published True if the version has been published.
 * @property {boolean} private True if the version will be published later.
 * @property {string} loc The URL from which to download the package version.
 * @property {number} installs The number of installs for this version.
 * @property {string} uploadDate The upload time of the package as a string.
 */
export type VersionData = {
  packageId: string;
  version: string;
  hash: string;
  approved: boolean;
  published: boolean;
  private: boolean;
  loc: string;
  privateKey: string;
  installs: string;
  uploadDate: string;
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
import MainContainerRight from '../components/Main Container/MainContainerRight';
import MainContainerRightError from '../components/Main Container/MainContainerRightError';
import MainContainerRightLoading from '../components/Main Container/MainContainerRightLoading';
import SideBar from '../components/SideBar';
import { postCB, downloadFile } from '../scripts/http';
import * as tokenStorage from '../scripts/tokenStorage';
import '../css/Packages.scss';
import '../css/SubrowStyles.scss';
import Table from '../components/Table';
import { nanoid } from 'nanoid';
import $ from 'jquery';

class Packages extends Component {

  state: PackagesState;

  constructor(props: Record<string, never>) {
    super(props);

    const urlParams = new URLSearchParams(window.location.search);
    let successMessage;
    if (urlParams.has('s')) {
      successMessage = atob(urlParams.get('s') as string);
    }

    this.state = {
      page: PackagePage.PACKAGES,
      isLoading: true,
      data: {},
      successMessage
    };

    const token = tokenStorage.checkAuth();
    if (!token) {
      sessionStorage.setItem('post-auth-redirect', '/packages');
      window.location.href = '/';
      return;
    }   
  } 

  componentDidMount(): void {
    const token = tokenStorage.checkAuth() as string;
    postCB('http://localhost:5020/account/packages', token , { }, (err, res) => {
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

      const data = { ...this.state.data };
      data.packages = JSON.parse(res.response);

      this.setState({
        errorMessage: void (0),
        isLoading: false,
        data
      } as Partial<PackagesState>);
    });
  }

  render(): ReactNode {
    const isPackagePageActive = this.state.page === PackagePage.PACKAGES;
    const isResourcesPageActive = this.state.page === PackagePage.RESOURCES;

    return (
      <MainContainer
        left={(
          <SideBar items={[
            {
              text: 'Packages',
              action: () =>
                this.setState({
                  page: PackagePage.PACKAGES
                })
            },
            {
              text: 'Resources',
              action: () =>
                this.setState({
                  page: PackagePage.RESOURCES
                })
            },
            {
              text: 'Bug Reports',
              action: () =>
                this.setState({
                  page: PackagePage.REPORTS
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
                <MainContainerRightError message={this.state.errorMessage} />
              );
            } else if (this.state.isLoading) {
              return (
                <MainContainerRightLoading loadingMessage='Loading Packages & Resources'/>
              );
            } else if (isPackagePageActive) {

              const columns = {
                Package: 25,
                Identifier: 25,
                'Latest Version': 20,
                Versions: 15,
                Description: 15
              };

              const data = [] as string[][];
              const subrowData = [] as PackageData[];
              
              for (const pkg of this.state.data.packages as PackageData[]) {
                data.push([pkg.packageName, pkg.packageId, pkg.versions[0].version, pkg.versions.length.toString(), pkg.description.slice(0, 9) + '...']);
                subrowData.push(pkg);
              }

              const tableParams = {
                columns,
                data,
                subrowData,
                subrowRender: (pkg: PackageData): ReactElement => {

                  const versions = [] as ReactElement[];
                  for (const version of pkg.versions) {

                    let isApproved = version.approved ? 'Yes' : 'No';
                    if (!version.private && !version.published)
                      isApproved = 'N/A';  

                    versions.push(
                      <tr key={nanoid()}>
                        <td>{version.version}</td>
                        <td>{version.installs}</td>
                        <td>{isApproved}</td>
                        <td>{version.published ? 'Yes' : 'No'}</td>
                        <td>{version.private ? <a className='subtable-link' onClick={e => {
                          e.preventDefault();
                          $(e.target).parent().text(version.privateKey);
                          
                        }}>Click to reveal</a> : '---'}</td>
                        <td>{version.private || version.published ? <a className='subtable-link' onClick={e => {
                          e.preventDefault();
                          downloadFile(version.loc, `${version.packageId}@${version.version}.xpkg`);
                        }}>Download</a> : '---'}</td>
                      </tr>
                    );
                  }

                  return (
                    <div className='package-subrow'>
                      <h2>{pkg.packageName}</h2>
                      <h3>{pkg.packageId}</h3>
                      
                      <button className='subrow-top-right upload-button action-button' onClick={() => window.location.href = '/edit?packageId=' + pkg.packageId}>Edit</button>

                      <p className='package-description'>{pkg.description.length > 1024 ? pkg.description.substring(0, 1024) + '...' : pkg.description}</p>
                      
                      <div className='subtable-wrapper'>
                        <table>
                          <thead>
                            <tr>
                              <th>Version</th>
                              <th>Installs</th>
                              <th>Approved</th>
                              <th>Published</th>
                              <th>Private Key</th>
                              <th>Download</th>
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
              };

              return (

                // Packages page
                <MainContainerRight title='Packages'>
                  <>
                    {this.state.successMessage && <p className='success-message'>{this.state.successMessage}</p>}
                    <button className='upload-button' onClick={() => window.location.href = '/packages/upload'}><span>+</span>&nbsp;Upload a new package</button>

                    <Table {...tableParams} />
                  </>

                </MainContainerRight>
              );
            } else if (isResourcesPageActive) {
              return (

                // Resources page
                <MainContainerRight title='Resources'>
                  <p>Resources</p>
                </MainContainerRight>
              );
            } else {
              return (

                // Reports page
                <MainContainerRight title='Bug Reports'>
                  <p>Reports</p>
                </MainContainerRight>
              );
            }
          })()
        }
      />
    );
  }
}

export default Packages;