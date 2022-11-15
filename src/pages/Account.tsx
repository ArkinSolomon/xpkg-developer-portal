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

type AccountState = {
  rendered: ReactElement;
};

import { Component, ReactElement } from 'react';
import MainContainer from '../components/MainContainer';
import * as tokenStorage from '../scripts/tokenStorage';
import '../css/MainContainer.scss';
import * as SB from '../components/SideBar';
const { default: SideBar } = SB;

class Account extends Component {

  constructor(props: Record<string, never>) {
    super(props);

    const token = tokenStorage.checkAuth();
    if (!token) {
      sessionStorage.setItem('post-auth-redirect', '/account');
      window.location.href = '/';
    }   

    this.basicInformation = this.basicInformation.bind(this);
    this.updateRendered = this.updateRendered.bind(this);
    
    this.state = {
      rendered: this.basicInformation()
    } as AccountState;
  }

  basicInformation(): ReactElement {
    return (
      <>
        <p>Basic Information</p> 
        <p>Basic Information</p>
      </>
    );
  }

  updateRendered(newElement: ReactElement) {
    this.setState({
      rendered: newElement
    });
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
            } as SB.SideBarActionItem,
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
            } as SB.SideBarActionItem,
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
            } as SB.SideBarActionItem,
            {
              text: 'Logout',
              type: SB.ItemType.ACTION,
              action: function () { 
                tokenStorage.delToken();
                window.location.href = '/';
              }
            } as SB.SideBarActionItem
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
