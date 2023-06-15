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

function MainContainerError({ message, subtext, linkName, link }: { message: string; subtext?: string; linkName?: string; link?: string; }) {
  return (
    <div className='error-screen'>
      <h2 className='text-[24pt] pt-7 mb-6'>{subtext ? message : 'There was an error'}</h2>
      <p className='text-[15pt] mb-4'>{subtext ?? message}</p>
      {
        link && 
          <button onClick={() => window.location.href = link}>{linkName || link}</button>
      }
    </div>
  );
}

export default MainContainerError;