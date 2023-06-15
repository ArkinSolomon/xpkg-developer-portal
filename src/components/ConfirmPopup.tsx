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
 * An action to execute. No parameters, return value is ignored.
 * 
 * @callback Action
 */

/**
 * Configuration for a popup.
 * 
 * @typedef {Object} ConfirmPopupConfig
 * @property {string} title The title to appear at the top of the popup.
 * @property {string} [confirmText=Confirm] The text to display on the confirm button.
 * @property {boolean} [showClose=true] Whether or not to display the close button.
 * @property {string} [closeText=Close] The text to display on the close button.
 * @property {Action} [onConfirm] The action to execute when the confirm button is pressed. Executed after onClose().
 * @property {Action} [onCancel] The action to execute when the cancel button is pressed. Executed after onClose().
 * @property {Action} [onClose] The action to execute when the popup closes.
 * @property {boolean} open True if the popup should be open.
 * @property {ReactElement} children The elements to go within the modal.
 */
export type ConfirmPopupConfig = {
  title: string
  confirmText?: string;
  showClose?: boolean;
  closeText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  children: ReactElement;
};

import { ReactElement, ReactNode } from 'react';
import Popup from 'reactjs-popup';
import '../css/Popup.scss';
import '../css/Buttons.scss';

function ConfirmPopup(props: ConfirmPopupConfig & { open: boolean; }) {

  const showClose = props.showClose ?? true;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const onClose = props.onClose ?? (() => { });

  return (
    <Popup
      
      // Now, this is always true, but for some reason if you get rid of this, and hardcode it as true, it doesn't work
      open={props.open}

      modal
      nested
      closeOnDocumentClick={false}
    >{((close: () => void) => {
      
      const closeButtonClicked = props.onCancel ? () => {
        close();
        onClose();
        props.onCancel?.();
      } : () => {
        close();
        onClose();
      };
        
      const confirmButtonClicked = props.onConfirm ? () => {
        close();
        onClose();
        props.onConfirm?.();
      } : () => {
        close();
        onClose();
      };
      
      return (
        <div className='popup-dialog'>
          <h2>{props.title}</h2>
          <div className='popup-children'>
            {props.children}
          </div>
          <div className='buttons'>
            {
              (props.confirmText || props.onConfirm) &&
                <button className='primary-button mx-4' onClick={confirmButtonClicked}> 
                  {props.confirmText ?? 'Confirm'}
                </button>
            }
            {showClose &&
                <button className='secondary-button' onClick={closeButtonClicked}>
                  {props.closeText ?? 'Close'}
                </button>
            }
          </div>
        </div>
      );
        
      // We need this or else TypeScript gets angry, even thought it's written
      // in the docs that you can do this, also see #315 on reactjs-popup 
    }) as unknown as ReactNode}
    </Popup>
  );
}

export default ConfirmPopup;