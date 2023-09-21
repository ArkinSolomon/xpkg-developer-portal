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

import Cookies from 'js-cookie';
import { DateTime } from 'luxon';

const COOKIE_NAME = 'xpkg_tok';

/**
 * Check if we have a token in session storage or localstorage.
 * 
 * @return {string | null} The token if the token exists, or null if it doesn't exist.
 */
export function checkAuth(): string | null {
  return Cookies.get(COOKIE_NAME) ?? null;
}

/**
 * Save a token as a cookie.
 *  
 * @param {string} token The token to save.
 * @param {boolean} rememberMe True if the cookie should not be a session cookie.
 */
export function saveToken(token: string, rememberMe: boolean): void {
  Cookies.set(COOKIE_NAME, token, {
    // secure: true, // Make sure this is true in production
    expires: rememberMe ? DateTime.now().plus({ hours: 6 }).toJSDate() : void 0,
  });
}

/**
 * Delete any stored token, or do nothing if none exists.
 */
export function delToken(): void {
  Cookies.remove(COOKIE_NAME);
}