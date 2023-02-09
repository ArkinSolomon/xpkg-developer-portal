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

import Big from 'big.js';

/**
 * A version decomposed into sub-items. The way a version is stored internally.
 * 
 * @typedef {[number, number, number, ('a'|'b')?, number?]} Version
 */
type InternalVersion = [number, number, number, ('a' | 'b')?, number?];

/**
 * This class represents a single version.
 */
export default class Version {

  private _versionParts: InternalVersion;

  /**
   * Get the major number of this version.
   * 
   * @returns {number} The major number of this version.
   */
  get major(): number {
    return this._versionParts[0];
  }

  /**
   * Set the major number of this version.
   * 
   * @param {number} majorNum The new major number of this version.
   */
  set major(majorNum: number) {
    this._versionParts[0] = majorNum;
  }

  /**
   * Get the minor number of this version.
   * 
   * @returns {number} The minor number of this version.
   */
  get minor(): number {
    return this._versionParts[1];
  }

  /**
   * Set the minor number of this version.
   * 
   * @param {number} minorNum The new major number of this version.
   */
  set minor(minorNum: number) {
    this._versionParts[1] = minorNum;
  }

  /**
   * Get the patch number of this version.
   * 
   * @returns {number} The patch number of this version.
   */
  get patch(): number {
    return this._versionParts[2];
  }

  /**
   * Set the minor number of this version.
   * 
   * @param {number} patchNum The new patch number of this version.
   */
  set patch(patchNum: number) {
    this._versionParts[2] = patchNum;
  }

  /**
   * Get whether this is an alpha or beta or not a pre-release of this version.
   * 
   * @returns {'a'|'b'|undefined} 'a' if the version is an alpha pre-release, 'b' if the version is a beta pre-release, or undefined if it is not a pre-release.
   */
  get aOrB(): 'a' | 'b' | undefined {
    return this._versionParts[3];
  }

  /**
   * Set whether this is an alpha or beta pre-release. Sets the pre-release number to one if it is not set.
   * 
   * @param {'a'|'b'} [aOrB] Whether this is an alpha or beta pre-release.
   */
  set aOrB(aOrB: 'a' | 'b' | undefined) {
    this._versionParts[3] = aOrB;
    if (aOrB)
      this._versionParts[4] ??= 1;
  }

  /**
   * Get the pre-release number.
   * 
   * @returns {number|undefined} The pre-release number if this version is a pre-release, otherwise undefined.
   */
  get preReleaseNum(): number | undefined {
    return this._versionParts[4];
  }

  /**
   * Set the pre-release number if aOrB is set.
   * 
   * @param {number} [preReleaseNum] The pre-release number.
   */
  set preReleaseNum(preReleaseNum: number | undefined) {
    if (this._versionParts[3])
      this._versionParts[4] = preReleaseNum;
  }

  /**
   * Check if this version is a pre-release.
   * 
   * @returns {boolean} True if this version is a pre-release.
   */
  get isPreRelease(): boolean {
    return !!this._versionParts[3];
  }

  /**
   * Create a new version explicitly.
   * 
   * @param {number} major The major version number.
   * @param {number} [minor=0] The minor verison number.
   * @param {number} [patch=0] The patch version number.
   * @param {('a'|'b')?} [aOrB] Whether this is an alpha or beta pre-release. Omit if it's a full release version.
   * @param {number?} [preRelease] The pre-release number. Only include if aOrB is not undefined.
   * @throws {Error} Thrown if the version is invalid.
   */
  constructor(major: number, minor = 0, patch = 0, aOrB?: ('a' | 'b'), preRelease?: number) {
    if (typeof preRelease !== 'undefined' && !aOrB)
      throw new Error('Pre-release number provided without specifying alpha or beta');
    else if (typeof preRelease === 'undefined' && aOrB)
      throw new Error('Pre-release number not provided but version specified as ' + aOrB === 'a' ? 'alpha' : 'beta');
    else if (preRelease === 0)
      throw new Error('Pre-release number can not be zero');

    if ((major | minor | patch) === 0)
      throw new Error('Major, minor, and patch are all zero');

    this._versionParts = [major, minor ?? 0, patch ?? 0, aOrB, preRelease];
  }

  /**
   * Create a new version from a string representation.
   * 
   * @param {string} versionStr The string to parse into a version.
   * @returns {Version|undefined} The version created from the string, or null if the version string is invalid.
   */
  static fromString(versionStr: string): Version | undefined {
    if (versionStr !== versionStr.trim().toLowerCase() || versionStr.length < 1 || versionStr.length > 15 || versionStr.endsWith('.'))
      return;

    const versionDecomp: InternalVersion = [0, 0, 0, void (0), void (0)];

    // Quick function to make sure that a number only has 3 digits and are all *actually* digits
    const testNumStr = (s: string) => /^\d{1,3}$/.test(s);

    let semanticPart = versionStr;
    if (versionStr.includes('a') || versionStr.includes('b')) {
      const matches = versionStr.match(/([ab])/);
      const aOrB = matches?.[1] as 'a' | 'b';

      versionDecomp[3] = aOrB;
      const parts = versionStr.split(new RegExp(aOrB));

      semanticPart = parts[0];
      const aOrBNumPart = parts[1];

      if (semanticPart.endsWith('.'))
        return;

      if (!testNumStr(aOrBNumPart))
        return;

      const aOrBNum = parseInt(aOrBNumPart, 10);
      if (aOrBNum <= 0)
        return;
      versionDecomp[4] = aOrBNum;
    }

    let major, minor, patch;

    const semanticParts = semanticPart.split(/\./g);
    if (semanticParts.length === 3)
      [major, minor, patch] = semanticParts;
    else if (semanticParts.length === 2)
      [major, minor] = semanticParts;
    else if (semanticParts.length === 1)
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

    return new Version(...versionDecomp);
  }

  /**
   * Convert this version to it's float representation.
   * 
   * @returns {Big} This version's float representation.
   */
  toFloat(): Big {

    // The first number does not have to be exactly three digits long, it'll be trimmed off anyway
    const floatStr = `${this._versionParts[0]}${toThreeDigits(this._versionParts[1])}${toThreeDigits(this._versionParts[2])}`;

    const semverFloat = new Big(floatStr);
    const aOrB = this._versionParts[3];
    if (!aOrB)
      return semverFloat;

    const preReleaseNum = 999 - (this._versionParts[4] as number);
    let preReleaseFloatStr: string;
    if (aOrB === 'a')
      preReleaseFloatStr = `.999${toThreeDigits(preReleaseNum)}`;
    else
      preReleaseFloatStr = `.${toThreeDigits(preReleaseNum)}999`;
    const preReleaseFloat = new Big(preReleaseFloatStr);

    return semverFloat.sub(preReleaseFloat);
  }

  /**
   * Get the string representation of this version.
   * 
   * @returns {string} This version represented as a string.
   */
  toString(): string {
    let finalStr = this._versionParts.slice(0, 3).join('.');
    if (this._versionParts[3])
      finalStr += this._versionParts.slice(3, 5).join('');
    return finalStr;
  }

  /**
   * Create a copy of the version.
   * 
   * @returns {Version} A copy of this version.
   */
  copy(): Version {
    return new Version(this.major, this.minor, this.patch, this.aOrB, this.preReleaseNum);
  }
}

/**
 * Convert a number string that is smaller than three digits in length to a fixed length of three digits
 * 
 * @param {number|string} num The number to bring to three digits.
 * @returns {string} The number as a three digit string.
 * @throws {Error} If the number is greater than three digits or is given an empty string.
 */
function toThreeDigits(num: number | string): string {
  if (typeof num === 'number')
    num = num.toString();

  if (num.length === 1)
    return '00' + num;
  else if (num.length === 2)
    return '0' + num;
  else if (num.length === 3)
    return num;
  else
    throw new Error('Number too long');
}