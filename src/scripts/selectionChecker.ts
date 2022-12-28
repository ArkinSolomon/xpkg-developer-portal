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
import semver, { Range, SemVer } from 'semver';
import { Version, isVersionValid } from './validators';

/**
 * This class creates a checker to check if a version matches a selection.
 */
export default class SelectionChecker {

  private _isValid = true;
  private _range?: Range;
  private _rangeStr?: string;

  /**
   * Check if the provided verison selection string was valid.
   * 
   * @returns {boolean} True if the provided version selection string is valid.
   */
  get isValid() {
    return this._isValid;
  }

  /**
   * Create a new selection checker from a string.
   * 
   * @param {string} selectionStr The selection string, comma seperated.
   */
  constructor(selectionStr: string) {
    const selectionSections = selectionStr.split(',');

    let rangeStr = '';
    for (let selection of selectionSections) {
      selection = selection.trim();

      if (rangeStr !== '')
        rangeStr += ' || ';

      const versionParts = selection.split('-');

      if (versionParts.length === 1) {

        const version = versionParts[0].trim();
        const validVersion = isVersionValid(version);
        if (!validVersion) {
          this._isValid = false;
          break;
        }

        rangeStr += '=' + replaceAOrB(hasPre(version) ? versionStr(validVersion) : version);
        continue;
      } else if (versionParts.length !== 2) {
        this._isValid = false;
        break;
      }

      let [lowerVersionStr, upperVersionStr] = versionParts;
      lowerVersionStr = lowerVersionStr.trim();
      upperVersionStr = upperVersionStr.trim();

      const lowerVersion = isVersionValid(lowerVersionStr);
      const upperVersion = isVersionValid(upperVersionStr);
      const hasLower = lowerVersionStr !== '';
      const hasUpper = upperVersionStr !== '';

      if ((!lowerVersion && hasLower) || (!upperVersion && hasUpper) || (!hasLower && !hasUpper)) {
        this._isValid = false;
        break;
      }

      if (lowerVersion)
        lowerVersionStr = hasPre(lowerVersionStr) ?  versionStr(lowerVersion) : lowerVersionStr;
      if (upperVersion)
        upperVersionStr = hasPre(upperVersionStr) ? versionStr(upperVersion) : upperVersionStr;

      if (hasLower && !hasUpper)
        rangeStr += '>=' + replaceAOrB(lowerVersionStr);
      else if (hasUpper && !hasLower)
        rangeStr += ' <=' + replaceAOrB(upperVersionStr);
      else
        rangeStr += replaceAOrB(lowerVersionStr) + ' - ' + replaceAOrB(upperVersionStr);
    }
    if (this._isValid) {
      this._range = new Range(rangeStr, {
        // includePrerelease: true
      });
      this._rangeStr = rangeStr;
    }
  }

  isWithinRange(version: string): boolean {
    if (!this._isValid)
      throw new Error('Range string provided not valid');

    const versionValid = isVersionValid(version);
    if (!versionValid)
      throw new Error('Version not valid');

    version = replaceAOrB(versionStr(versionValid));
    console.log(version);
    return this._range?.test(version) as boolean;
  }
}

function hasPre(versionStr: string): boolean {
  return versionStr.includes('a') || versionStr.includes('b');
}

function replaceAOrB(versionStr: string): string {
  if (!hasPre(versionStr))
    return versionStr;
  
  const version = isVersionValid(versionStr);
  if (!version)
    throw new Error('Invalid version');
  
  return `${version[0]}.${version[1]}.${version[2]}-pre.${version[4] as number * (version[3] === 'b' ? 1000 : 1)}`;
}

/**
 * Convert a version to a string.
 * 
 * @param {Version} version The version to convert to a string.
 */
export function versionStr(version: Version) {
  let finalStr = version.slice(0, 3).join('.');
  if (version[3])
    finalStr += version.slice(3, 5).join('');
  return finalStr;
}