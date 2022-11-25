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
type Elements = ReactNode | ReactNode[];

import { ReactNode } from 'react';
import '../css/MainContainer.scss';

function MainContainer(props: { right?: Elements; left?: Elements; children?: Elements; }) {
  let children = props.children;
  const left = props.left;
  const right = props.right;
  if (!left && !children)
    children = right;

  if (!right && !children)
    children = left;
  
  if (left && right)
    return (
      <div id='main-container'>
        <div id='left'>
          {left}
        </div>
        <div id="right">
          {right}
        </div>
      </div>
    );
  else
    return (
      <div id='main-container'>
        {children}
      </div>
    );
}

export default MainContainer;