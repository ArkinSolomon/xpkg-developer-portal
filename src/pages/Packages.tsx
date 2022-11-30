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
 * @enum {PackagePage}
 */
enum PackagePage {
  PACKAGES,
  RESOURCES
}

// The following types are the same found in /routes/account.ts on the registry

/**
 * The data given from the server for a package version.
 * 
 * @typedef {Object} VersionData
 * @property {string} version The version string.
 * @property {string} hash The hash of the data in the package.
 * @property {boolean} approved True if the package is approved.
 * @property {boolean} published True if the package is published.
 * @property {string} loc The URL from which to download the package.
 */
type VersionData = {
  version: string;
  hash: string;
  approved: boolean;
  publishd: boolean;
  loc: string;
};

/**
 * The data given from the server for a single package.
 * 
 * @typedef {Object} PackageData
 * @property {string} packageId The id of the package.
 * @property {string} packageName The name of the package.
 * @property {string} packageDescription The description of the package.
 * @property {number} installs The number of installations the package has.
 * @property {string} packageType The type of the package.
 * @property {VersionData[]} versions The versions of the package.
 */
type PackageData = {
  packageId: string;
  packageName: string;
  packageDescription: string;
  installs: number;
  packageType: string;
  versions: VersionData[];
};

/**
 * State of the packages page.
 * 
 * @typedef {Object} PackagesState
 * @property {PackagePage} page The current page
 * @property {boolean} isLoading True if the packages are currently loading.
 * @property {string} [errorMessage] Undefined if there is no error, otherwise has the error message.
 * @property {Object} data The data returned from the server concerning the packages.
 * @property {PackageData[]} [packages] The packages returned from the server.
 */
type PackagesState = {
  page: PackagePage;
  isLoading: boolean;
  errorMessage?: string;
  data: {
    packages?: PackageData[];
    // resources?: Resource[];
  };
}

import { Component, ReactNode } from 'react';
import MainContainer from '../components/MainContainer';
import MainContainerRight from '../components/MainContainerRight';
import MainContainerRightError from '../components/MainContainerRightError';
import MainContainerRightLoading from '../components/MainContainerRightLoading';
import SideBar from '../components/SideBar';
import { postCB } from '../scripts/http';
import * as tokenStorage from '../scripts/tokenStorage';
import '../css/Packages.scss';

class Packages extends Component {

  state: PackagesState;

  constructor(props: Record<string, never>) {
    super(props);

    this.state = {
      page: PackagePage.PACKAGES,
      isLoading: true,
      data: {}
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
    postCB('http://localhost:5020/account/packages', { token }, (err, res) => {
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

      console.log(res.response);

      this.setState({
        errorMessage: void (0),
        isLoading: false
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

          // We wrapp this in a function just to use regular JS stuff
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
              return (

                // Packages page
                <MainContainerRight title='Packages'>
                  <button className='upload-button' onClick={() => window.location.href = '/packages/upload'}><span>+</span>&nbsp;Upload a new package</button>
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

export default Packages;