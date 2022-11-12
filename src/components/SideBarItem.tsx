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

import { Component, createRef, RefObject } from 'react';
import * as SideBar from './SideBar';

class SideBarItem extends Component {

  ref: RefObject<HTMLDivElement>;
  action: () => void;

  constructor(props: SideBar.SideBarItem) {
    super(props);
    if (props.type === SideBar.ItemType.ACTION && !Object.hasOwnProperty.call(props, 'action'))
      throw new Error('SideBarItem: Props has no action function, but is declared as a render item');
    else if (props.type === SideBar.ItemType.RENDER && !Object.hasOwnProperty.call(props, 'render'))
      throw new Error('SideBarItem: Props has no render function, but is declared as a render item');
    
    this.action = (props as SideBar.SideBarActionItem).action ?? (props as SideBar.SideBarRenderItem).render;
    this.ref = createRef<HTMLDivElement>();
  }

  render() {
    const props = this.props as SideBar.SideBarItem;
    return (
      <div ref={this.ref}>
        <button onClick={this.action}>{props.text}</button>
      </div>
    );
  }
}

export default SideBarItem;