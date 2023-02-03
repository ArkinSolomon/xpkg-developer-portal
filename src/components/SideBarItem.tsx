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

import { Component} from 'react';
import * as SideBar from './SideBar';

class SideBarItem extends Component {

  action: () => void;

  constructor(props: SideBar.SideBarItem) {
    super(props);
    
    this.action = props.action;
  }

  render() {
    const props = this.props as SideBar.SideBarItem;
    return (
      <div className='side-bar-item'>
        <button onClick={this.action}>{props.text}</button>
      </div>
    );
  }
}

export default SideBarItem;