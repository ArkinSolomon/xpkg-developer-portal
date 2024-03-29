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
import '../../css/MainContainer.scss';

function MainContainerLoading({ loadingMessage }: { loadingMessage: string; }) {
  return (
    <div className='error-screen'>
      <h3>{ loadingMessage }</h3>
      <img src='/loading.gif' alt='Loading GIF' />
    </div>
  );
}

export default MainContainerLoading;