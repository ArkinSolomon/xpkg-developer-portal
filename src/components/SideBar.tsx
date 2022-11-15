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
export enum ItemType {
  ACTION,
  RENDER
}

export type SideBarItem = {
  text: string;
  type: ItemType;
};

export type SideBarActionItem = SideBarItem & {
  action: () => void;
};

export type SideBarRenderItem = SideBarItem & {
  render: () => Component | Component[];
}

import { Component } from 'react';
import SBI from './SideBarItem';
import '../css/SideBar.scss';

function SideBar({ items }: { items: SideBarItem[] | SideBarItem; }) {
  if (!Object.hasOwnProperty.call(items, 'length'))
    items = [items as SideBarItem];
  
  const nodes: JSX.Element[] = [];
  for (const item of items as SideBarItem[]) 
    nodes.push(<SBI {...item} />);
  
  return (
    <div id='side-bar'>
      {nodes}
    </div>
  );
}

export default SideBar;