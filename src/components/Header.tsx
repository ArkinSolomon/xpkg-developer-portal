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
import '../css/Header.scss';
import HeaderButton from './HeaderButton';

function Header() {
  return (
    <header>
      <img id='header-logo' src='/box-logo.png' alt='X-Pkg Box Logo' className='inline'/>
      <h1>X-Pkg Developer Portal</h1>

      <div id='header-buttons'>
        <HeaderButton text='Packages' link='/packages' />
        <HeaderButton text='Tools' link='/tools' />
        <HeaderButton text='Documentation' link='https://documentation.x-pkg.net' />
        <HeaderButton text='Support' link='/support' />
        <HeaderButton text='Account' link='/account' />
      </div>
    </header>
  );
}
export default Header;