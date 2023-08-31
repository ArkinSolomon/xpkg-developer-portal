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

import {getBestUnits} from '../scripts/displayUtil';
import '../css/StorageBar.scss';

function StorageBar(props: {
  totalStorage: number;
  usedStorage: number;
}) {
  let storageUsageClass = 'okay';
  if (props.usedStorage / props.totalStorage > 0.9)
    storageUsageClass = 'near-full';
  else if (props.usedStorage / props.totalStorage > 0.7)
    storageUsageClass = 'approaching-full';

  return (
    <div className='storage-bar'>
      <p><b>{getBestUnits(props.usedStorage)}</b> of <b>{getBestUnits(props.totalStorage)}</b> used</p>
      <div className={'progress ' + storageUsageClass} >
        <div style={{
          width: (props.usedStorage / props.totalStorage) * 100 + '%',
        }}></div>
      </div>
    </div>
  );
}

export default StorageBar;