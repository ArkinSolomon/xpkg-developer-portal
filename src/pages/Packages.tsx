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
  RESOURCES
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
  };
}

import { Component, ReactElement, ReactNode } from 'react';
import MainContainer from '../components/Main Container/MainContainer';
import MainContainerRight from '../components/Main Container/MainContainerRight';
import MainContainerRightError from '../components/Main Container/MainContainerRightError';
import MainContainerRightLoading from '../components/Main Container/MainContainerRightLoading';
import SideBar from '../components/SideBar';
import { postCB } from '../scripts/http';
import * as tokenStorage from '../scripts/tokenStorage';
import '../css/Packages.scss';
import Table from '../components/Table/Table';
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

        switch (res?.status) {
        case 401:
          tokenStorage.delToken();
          window.location.href = '/';
          break;
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
                Versions: 10,
                Description: 15
              };

              const data = [] as string[][];
              const subrowData = [] as PackageData[];
              for (let i = 1; i <= 50; ++i){
                for (const pkg of this.state.data.packages as PackageData[]) {
                  data.push([pkg.packageName, pkg.packageId, '000.000.000b' + i, pkg.versions.length.toString(), pkg.description.slice(0, 9) + '...']);
                  subrowData.push(pkg);
                }
              }

              const tableParams = {
                columns,
                data,
                subrowData,
                subrowRender: (pkg: PackageData): ReactElement => {

                  const versions = [] as ReactElement[];
                  for (const version of pkg.versions) {

                    versions.push(
                      <tr key={nanoid()}>
                        <td>{version.version}</td>
                        <td>{version.installs}</td>
                        <td>{version.published ? 'Yes' : 'No'}</td>
                        <td>{version.private ? 'Yes' : 'No'}</td>
                        <td>{version.private ? <a className='subtable-link' onClick={e => {
                          e.preventDefault();
                          $(e.target).parent().text(version.privateKey);
                          
                        }}>Click to reveal</a> : '---'}</td>
                        <td>{version.private || version.published ? <a className='subtable-link' onClick={e => {
                          e.preventDefault();

                          // We need this workaround to download as the file name, instead of the gibberish AWS id
                          const xhr = new XMLHttpRequest();
                          xhr.open('GET', version.loc, true);
                          xhr.responseType = 'blob';
                          xhr.onload = e => {
                            
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const blob = (e.currentTarget as any).response;
                            const fileName = `${version.packageId}@${version.version}.xpkg`;
                            saveBlob(blob, fileName);
                          };
                          xhr.send();
                        }}>Download</a> : '---'}</td>
                      </tr>
                    );
                  }

                  return (
                    <div className='package-subrow'>
                      <h2>{pkg.packageName}</h2>
                      <h3>{pkg.packageId}</h3>
                      
                      <button className='upload-button'>Edit</button>

                      <p className='package-description'>{pkg.description.length > 1024 ? pkg.description.substring(0, 1024) + '...' : pkg.description}</p>
                      
                      <div className='subtable-wrapper'>
                        <table>
                          <thead>
                            <tr>
                              <th>Version</th>
                              <th>Installs</th>
                              <th>Published</th>
                              <th>Private</th>
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
            } else {
              return (

                // Resources page
                <MainContainerRight title='Resources'>
                  <p>Resources</p>
                </MainContainerRight>
              );
            }
          })()
        }
      />
    );
  }
}

function saveBlob(blob: Blob, fileName: string) {
  const a = document.createElement('a');
  a.href = window.URL.createObjectURL(blob);
  a.download = fileName;
  a.dispatchEvent(new MouseEvent('click'));
}

export default Packages;