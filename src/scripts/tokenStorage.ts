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

/**
 * Check if we have a token in session storage or localstorage.
 * 
 * @return {string | null} The token if the token exists, or null if it doesn't exist.
 */
export function checkAuth(): string | null {
  let token = localStorage.getItem('token');
  if (!token)
    token = sessionStorage.getItem('token');
  return token;
}

/**
 * Set the token.
 * 
 * @param {string} token The token we received from the server.
 * @param {boolean} save True if we should save the token in local storage rather than session storage.
 */
export function saveToken(token: string, save: boolean): void {
  let storage: Storage = sessionStorage;
  if (save)
    storage = localStorage;
  storage.setItem('token', token);
}

/**
 * Delete any stored token, or do nothing if none exists.
 */
export function delToken(): void {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
}