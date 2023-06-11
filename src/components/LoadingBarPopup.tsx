/*
 * Copyright (c) 2023. Arkin Solomon.
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
 * The configuration for a loading popup.
 * 
 * @typedef {Object} LoadingPopupConfig
 * @property {boolean} open True if the popup is shown.
 * @property {number} progress The progress of the progress bar, 0 is 0%, 1 is 100%.
 * @property {title} title The large title of the popup.
 * @property {string} text The small text above the progress bar.
 */
export type LoadingPopupConfig = {
  open: boolean;
  progress: number;
  title: string;  
  text: string;
}

import { ReactNode } from 'react';
import Popup from 'reactjs-popup';
import '../css/Popup.scss';
import { nanoid } from 'nanoid/non-secure';

function LoadingBarPopup(props: LoadingPopupConfig & { open: boolean; }) {
  const key = nanoid(8);
  const id = 'loading-bar-popup-progress-' + key;
  return (
    <Popup
      open={props.open}
      modal
      nested
      closeOnDocumentClick={false}
      key={key}
    >{(() => {  
      return (
        <div className='popup-dialog loading-popup'>
          <h2>{props.title}</h2>
          <div className='popup-children'> 
            <div>
              <label htmlFor={id} className='generic-popup-text'>{props.text}</label>
              <progress id={id} className='popup-progress-bar' value={props.progress} max="1"></progress>
            </div>
          </div>
        </div>
      );
        
      // We need this or else TypeScript gets angry, even thought it's written
      // in the docs that you can do this, also see #315 on reactjs-popup 
    }) as unknown as ReactNode}
    </Popup>
  );
}

export default LoadingBarPopup;