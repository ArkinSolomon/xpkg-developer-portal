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

import { Component } from 'react';
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
  }

  render() {
    return (
      <MainContainer left={
        (
          <SideBar items={[
            {
              text: 'Logout',
              type: SB.ItemType.ACTION,
              action: (function () { 
                console.log('Logout');
              }).bind(this)
            } as SB.SideBarActionItem
          ]} />
        )
      } right={
        (
          <p>Right</p>
        )
      } />
    );
  }
}

export default Account;
