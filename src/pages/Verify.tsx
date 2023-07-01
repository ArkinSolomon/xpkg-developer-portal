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
 * The state of the verify page.
 * 
 * @property {boolean} doneLoading True if the page is done loading.
 * @property {boolean} isLoggedIn True if the user is logged in.
 * @property {string} [errorMessage] The error message of the user. Undefined if there is not error.
 */
type VerifyState = {
  doneLoading: boolean;
  isLoggedIn: boolean;
  errorMessage?: string;
};

/**
 * The properties of the verify page.
 * 
 * @property {string} [params.verificationToken] The token that is used to verify the user. May be undefined.
 */
type VerifyProps = { 
  params: {
    verificationToken: string;
  }
 }

import { Component, ReactNode } from 'react';
import MainContainer from '../components/Main Container/MainContainer';
import { checkAuth } from '../scripts/tokenStorage';
import MainContainerLoading from '../components/Main Container/MainContainerLoading';
import { httpRequest } from '../scripts/http';
import HTTPMethod from 'http-method-enum';
import MainContainerError from '../components/Main Container/MainContainerError';
import { useParams } from 'react-router-dom';

class Verify extends Component {

  state: VerifyState;

  constructor(props: VerifyProps) {
    super(props);

    const token = checkAuth();

    this.state = {
      doneLoading: false,
      isLoggedIn: !!token
    };
  }

  async componentDidMount(): Promise<void> {
    const { verificationToken } = (this.props as VerifyProps).params;
    if (!verificationToken) 
      return this.setState({
        doneLoading: true,
        errorMessage: 'Invalid verification token.'
      } as Partial<VerifyState>);
    
    let errorMessage;
    let response;
    try {
      response = await httpRequest(`${window.REGISTRY_URL}/auth/verify/` + verificationToken, HTTPMethod.POST, void (0), {});
      errorMessage = void 0;
    } catch {
      errorMessage = 'Could not connect to server. Please try again later.';
    }

    this.setState({
      doneLoading: true
    } as Partial<VerifyState>);

    if (response) {
      switch (response.status) {
      case 204:
        return;
      case 401:
        errorMessage = 'Token is invalid or expired.';
        break;
      case 403:
        errorMessage = 'You have already been verified.';
        break;
      case 500:
        errorMessage = 'Internal server error, please try again later.';
        break;
      default:
        errorMessage = 'An unknown error occured.';
        break;
      }
    }

    this.setState({ errorMessage } as Partial<VerifyState>);
  }

  render(): ReactNode {
    return (

      <MainContainer>
        {
          (this.state.doneLoading && !this.state.errorMessage) &&
            <div className='error-container'>
              <div className='text-center'>
                <h2 className='text-[25pt] mb-3'>Success</h2>
                {
                  this.state.isLoggedIn && 
                      <>
                        <p>Your account has been verified. You can now upload packages to the registry.</p>
                        <button onClick={() => window.location.href = '/packages'}>Home</button>
                      </>
                }
                {
                  !this.state.isLoggedIn && 
                    <>
                      <p>Your account has been verified. Please login again.</p>
                      <button onClick={() => window.location.href = '/login'}>Login</button>
                    </>
                }
              </div>
            </div>
        }
        {
          !this.state.doneLoading && 
          <MainContainerLoading loadingMessage='Verifying your account' />
        }
        {
          this.state.errorMessage &&
          <MainContainerError message={this.state.errorMessage} linkName='Home' link='/packages'/>
        }
      </MainContainer>
    );
  }
}

// Since useParams is a state hook, we need a function, so we wrap the class, for some reason params={useParams()} does not work with TypeScript
export default () => <Verify {...{params: useParams()}}></Verify>;