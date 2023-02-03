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
import { ReactElement } from 'react';
import '../../css/MainContainerRight.scss';

function MainContainerRight(props: { title: string; children: ReactElement; }) {
  return (
    <div className="main-container-right">
      <h1>{props.title}</h1>
      {props.children}
    </div>
  );
}

export default MainContainerRight;