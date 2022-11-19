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
 * The data recieved from the server about the user/author.
 * 
 * @typedef {Object} AccountData
 * @property {string} name The display name of the user/author.
 */
type AccountData = {
  name: string;
};

/**
 * The state used by the account element.
 * 
 * @typedef {Object} AccountState
 * @property {ReactElement} rendered The element to render on the right side.
 * @property {AccountData} accountData The data received from the server concerning the user/author's account.
 */
type AccountState = {
  rendered: ReactElement;
  accountData: AccountData;
};

// import loadingGIF from '../..';
import { Component, ReactElement } from 'react';
import MainContainer from '../components/MainContainer';
import '../css/Account.scss';
import * as tokenStorage from '../scripts/tokenStorage';
import { postCB } from '../scripts/http';
import * as SB from '../components/SideBar';
const { default: SideBar } = SB;

class Account extends Component {

  mounted = false;
  state: AccountState;

  constructor(props: Record<string, never>) {
    super(props);

    this.state = {
      rendered: this.loading(),
      accountData: {}
    } as AccountState;

    const token = tokenStorage.checkAuth();
    if (!token) {
      sessionStorage.setItem('post-auth-redirect', '/account');
      window.location.href = '/';
      return;
    }   

    this.updateRendered = this.updateRendered.bind(this);
    this.loading = this.loading.bind(this);
    this.error = this.error.bind(this);
  }

  componentDidMount(): void {
    this.mounted = true;

    // This request will fire twice in development, during production it'll be fine
    const token = tokenStorage.checkAuth() as string;
    postCB('http://localhost:5020/account/data', { token }, (err, resp) => {
      if (err || resp?.status !== 200) 
        return this.updateRendered(this.error(`Could not get data: ${resp?.status} (${resp?.statusText})`));
      
      // Pass the data directly into basicInformation() since state probably won't update before basicInformation() is called
      this.setState({
        rendered: this.basicInformation(JSON.parse(resp.response) as AccountData)
      } as AccountState);
    });
  }

  componentWillUnmount(): void {
    this.mounted = false;
  }

  loading(): ReactElement {
    return (
      <div className="error-screen">
        <h3>Loading Account</h3>
        <img src="/loading.gif" alt="Loading GIF" />
      </div>
    );
  }

  error(error: string): ReactElement {
    return (
      <div className="error-screen">
        <h3>There was an error</h3>
        <p>{ error }</p>
      </div>
    );
  }

  basicInformation(accountData?: AccountData): ReactElement {

    // Ensure that the state is kept up to date
    if (accountData) 
      this.setState({ accountData });
    else 
      accountData = this.state.accountData;

    return (
      <>
        <p>Basic Information</p>
        <p>{accountData.name}</p>
      </>
    );
  }

  updateRendered(newElement: ReactElement) {
    if (this.mounted) {
      return this.setState({
        rendered: newElement
      });
    } 
    (this.state as AccountState).rendered = newElement;
  }

  render() {
    return (
      <MainContainer left={
        (
          <SideBar items={[
            {
              text: 'Basic Information',
              type: SB.ItemType.ACTION,
              action: () => { 
                this.updateRendered(this.basicInformation());
              }
            },
            {
              text: 'Change Email',
              type: SB.ItemType.ACTION,
              action: () => { 
                this.updateRendered((
                  <>
                    <p>Change Email</p> 
                    <p>Change Email</p> 
                  </>
                ));
              }
            },
            {
              text: 'Change Password',
              type: SB.ItemType.ACTION,
              action: () => { 
                this.updateRendered((
                  <>
                    <p>Change Password</p> 
                    <p>Change Password</p> 
                  </>
                ));
              }
            },
            {
              text: 'Logout',
              type: SB.ItemType.ACTION,
              action: function () { 
                tokenStorage.delToken();
                window.location.href = '/';
              }
            }
          ]} />
        )
      } right={
        (
          <>
            {(this.state as AccountState).rendered}
          </>
        )
      } />
    );
  }
}

export default Account;
