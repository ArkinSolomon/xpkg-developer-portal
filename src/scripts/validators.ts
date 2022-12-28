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
 * A version decomposed into sub-items.
 * 
 * @typedef {[number, number, number, ('a'|'b')?, number?]} Version
 */
export type Version = [number, number, number, ('a' | 'b')?, number?];

/**
 * Check if an email is valid.
 * 
 * @param {string} email The email address to validate.
 * @returns {boolean} True if the email is valid.
 */
export function validateEmail(email: string): boolean {
  return /^\S+@\S+\.\S+$/.test(
    email
      .toLowerCase()
      .trim()
  ) && (email && typeof email === 'string' && email.length >= 4 && email.length <= 64) as boolean;
}

/**
 * Check if a password is valid. Same function as in /routes/auth.ts on the registry.
 * 
 * @param {string} password The password to validate.
 * @returns {boolean} True if the password is valid.
 */
export function validatePassword(password: string): boolean {
  return (password && typeof password === 'string' && password.length >= 8 && password.length <= 64 && password.toLowerCase() !== 'password') as boolean;
}

/**
 * Check if a name is valid. Same function as in /routes/auth.ts on the registry.
 * 
 * @param {string} name The name to validate.
 * @returns {boolean} True if the name is valid.
 */
export function validateName(name: string): boolean {
  return (name && typeof name === 'string' && name.length > 3 && name.length <= 32) as boolean;
}

/**
 * Check if a version string is valid.
 * 
 * @param {string} version The version string to check for validity.
 * @returns {Version|undefined} The version decomposed if the version is valid, otherwise none.
 */
export function isVersionValid(version: string): Version | undefined {
  if (version !== version.trim().toLowerCase() || version.length < 1 || version.length > 15 || version.endsWith('.'))
    return;

  const versionDecomp: Version = [0, 0, 0, void (0), void (0)];

  // Quick function to make sure that a number only has 3 digits and are all *actually* digits
  const testNumStr = (s: string) => /^\d{1,3}$/.test(s);

  let semanticPart = version;
  if (version.includes('a') || version.includes('b')) {
    const matches = version.match(/([ab])/);
    const aOrB = matches?.[1] as 'a' | 'b';

    versionDecomp[3] = aOrB;
    const parts = version.split(new RegExp(aOrB));

    semanticPart = parts[0];
    const aOrBNumPart = parts[1];

    if (!testNumStr(aOrBNumPart))
      return;

    const aOrBNum = parseInt(aOrBNumPart, 10);
    if (aOrBNum <= 0)
      return;
    versionDecomp[4] = aOrBNum;
  }

  let major, minor, patch;

  const semanticParts = semanticPart.split(/\./g);
  if (semanticParts.length === 3) {
    [major, minor, patch] = semanticParts;
  } else if (semanticParts.length === 2) {
    [major, minor] = semanticParts;
  } else if (semanticParts.length === 1)
    [major] = semanticParts;
  else
    return;

  if (!testNumStr(major) || (minor && !testNumStr(minor)) || (patch && !testNumStr(patch)))
    return;
  
  const majorNum = parseInt(major, 10);
  const minorNum = minor ? parseInt(minor, 10) : 0;
  const patchNum = patch ? parseInt(patch, 10) : 0;

  if (majorNum < 0 || minorNum < 0 || patchNum < 0 || (majorNum | minorNum | patchNum) === 0)
    return;
  
  versionDecomp[0] = majorNum;
  versionDecomp[1] = minorNum;
  versionDecomp[2] = patchNum;

  return versionDecomp;
}