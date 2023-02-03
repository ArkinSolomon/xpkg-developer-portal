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
import { Component, ReactNode } from 'react';
import * as tokenStorage from '../scripts/tokenStorage';

export default class Incompatibility extends Component {

  private _packageId?: string;
  private _packageVersion?: string;

  constructor(props: never) {
    super(props);

    const params = new URLSearchParams(window.location.search);
    this._packageId = params.get('id') ?? void (0);
    this._packageVersion = params.get('v') ?? void (0);

    if (!this._packageId || !this._packageVersion) {
      window.location.href = '/packages';
      return;
    }

    const token = tokenStorage.checkAuth();
    if (!token) {
      sessionStorage.setItem('post-auth-redirect', '/packages');
      window.location.href = '/';
      return;
    }   
  }

  render(): ReactNode {
    return (
      <p>Incompatibility report</p>
    );
  }
}