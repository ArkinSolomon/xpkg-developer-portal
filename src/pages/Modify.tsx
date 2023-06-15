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
 */
type ModifyState = {
  isLoading: boolean;
  errorMessage?: string;
};

import { Component, ReactNode } from 'react';
import * as tokenStorage from '../scripts/tokenStorage';
import Version from '../scripts/version';
import { httpRequest } from '../scripts/http';
import HTTPMethod from 'http-method-enum';
import { PackageData, PackageType, VersionData } from './Packages';
import MainContainer from '../components/Main Container/MainContainer';
import MainContainerContent from '../components/Main Container/MainContainerContent';
import MainContainerLoading from '../components/Main Container/MainContainerLoading';
import MainContainerError from '../components/Main Container/MainContainerError';
import PackageInfoFields from '../components/PackageInfoFields';

class Modify extends Component {
  
  state: ModifyState;

  private _packageData?: PackageData;
  private _versionData?: VersionData;

  constructor(props: Record<string, never>) {
    super(props);

    this.state = {
      isLoading: true
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

    httpRequest('http://localhost:5020/account/packages', HTTPMethod.GET, token , { }, (err, res) => {
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
      
      this.setState({
        errorMessage: void (0),
        isLoading: false,
      } as Partial<ModifyState>);
    });
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
        return (<p>Error... please wait</p>);
      }

      return (
        <MainContainer>
          <MainContainerContent title='Modify version'>
            <PackageInfoFields
              packageId={this._versionData.packageId}
              packageName={this._packageData?.packageName as string}
              packageType={this._packageData?.packageType as PackageType}
            />
          </MainContainerContent>
        </MainContainer>
      );
    }
  }
}

export default Modify;