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
import MainContainer from '../components/Main Container/MainContainer';
import MainContainerError from '../components/Main Container/MainContainerError';

function NotFound() {
  return (
    <MainContainer>
      <MainContainerError
        message='404'
        subtext='Page not found, you may have followed a broken link.'
        link='/packages'
        linkName='Return Home'
      />
    </MainContainer>
  );
}

export default NotFound;
