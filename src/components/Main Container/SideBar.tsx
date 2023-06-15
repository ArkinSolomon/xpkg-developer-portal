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
 * An item that can go in the sidebar.
 * 
 * @typedef {Object} SideBarItem
 * @property {string} text The text to display for the item.
 * @property {Action} action The function to execute when the item is clicked.
 */
export type SideBarItem = {
  text: string;
  action: () => void;
};

import SBI from './SideBarItem';
import '../../css/SideBar.scss';
import { nanoid } from 'nanoid';

function SideBar({ items }: { items: SideBarItem[] | SideBarItem; }) {
  if (!Object.hasOwnProperty.call(items, 'length'))
    items = [items as SideBarItem];
  
  const nodes: JSX.Element[] = [];
  for (const item of items as SideBarItem[]) 
    nodes.push(<SBI {...item} key={nanoid(5)} />);
  
  return (
    <div id='side-bar'>
      {nodes}
    </div>
  );
}

export default SideBar;