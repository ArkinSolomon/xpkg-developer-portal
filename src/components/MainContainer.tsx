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

function MainContainer(props: { right?: Elements; left?: Elements; children?: Elements; }) {
  if (!props.left)
    props.children = props.right;

  if (!props.right)
    props.children = props.left;
  
  if (props.left && props.right)
    return (
      <div id='main-container'>
        <div id='left'>
          {props.left}
        </div>
        <div id="right">
          {props.right}
        </div>
      </div>
    );
  else
    return (
      <div id='main-container'>
        {props.children}
      </div>
    );
}

export default MainContainer;