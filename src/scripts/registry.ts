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
 * The storage used.
 * 
 * @typedef {Object} StorageData 
 * @property {number} usedStorage The storage currently used.
 * @property {number} totalStorage The totally available storage.
 */
export type StorageData = {
  usedStorage: number;
  totalStorage: number;
};

import * as tokenStorage from './tokenStorage';
import * as http from './http';
import HTTPMethod from 'http-method-enum';

/**
 * Try to get the storage data for the currently logged in author. 
 * 
 * @async
 * @deprecated
 * @returns {Promise<StorageData>} The storage data of the currently logged in author.
 * @throws {Error} An error is thrown if the author does not have a token.
 */
export async function getStorageData(): Promise<StorageData> {
  const token = tokenStorage.checkAuth();
  if (!token)
    throw new Error('No token');
  
  // TODO: change this function
  const response = await http.httpRequest(`${window.REGISTRY_URL}/account/data`, HTTPMethod.GET, token, {});
  if (response.status !== 200)
    throw Error('Invalid response status: ' + response.status);
  
  return JSON.parse(response.responseText);
}