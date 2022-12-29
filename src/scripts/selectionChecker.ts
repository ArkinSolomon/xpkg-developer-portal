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

// How selection checking works.
// 
// This process basically works by taking a version and converting it to a 
// float. This float is defined initially by taking the values for the major, 
// minor, and patch numbers, extending each to three digit strings, and
// smushing them together. For instance:
// 
// 4.18.39 becomes 004018039 which evaluates to 4018039.000000
// 
// This method is good enough for regular strings, but it gets slightly more
// complex for version strings that include pre-releases. For this reason, we
// subtract a value less than one from this value. This raises the value of the
// pre-release version above the value of the last patch version, but keeps the
// value below the full release version.
// 
// The specific value subtracted is dependent on whether it's an alpha or beta
// pre-release. If it's an alpha pre-release the pre-release number is 
// subtracted from 999, and it's smushed at the end of another 999 and placed
// after the decimal point. For instance:
// 
// 5.2.4a5 becomes 005002004 - .999994 which evaluates to 5002003.000006
// 
// It's similar for the beta version, where instead of smushing a 999 before,
// it's smushed after. So the process would be to subtract 999 from the 
// pre-release version, and then add a decimal point before, and a 999 after.
// For instance:
//
// 9.5.2b12 becomes 009005002 - .987999 which evaluates to 9005001.012001
// 
// These same operations could be performed using integers alone, and in the
// future it should be considered (as there may be some performance gains).
// However, at the time of development it's 6 am, it works and is good enough.
//
// Note: Big.js is used to get the precision needed for large numbers, without
// floating point errors. If speed becomes a problem, it might be worth looking
// into performing these operations using native numbers.

/**
 * This set defines bounds for a range. If the values of min and max are equal, it represents a single version range.
 * 
 * @typedef {Object} RangeSet 
 * @property {Big} min The minimum value of the set.
 * @property {Big} max The maximum value of the set.
 */
type RangeSet = {
  min: Big;
  max: Big;
  minVersion: Version;
  maxVersion: Version;
};

import Big from 'big.js';
import { Version, isVersionValid } from './validators';

/**
 * This class creates a checker to check if a version matches a selection.
 */
export default class SelectionChecker {

  private _isValid = true;
  private _ranges: RangeSet[] = [];

  /**
   * Check if the provided verison selection string was valid.
   * 
   * @returns {boolean} True if the provided version selection string is valid.
   */
  get isValid(): boolean {
    return this._isValid;
  }

  /**
   * Get a copy of the the ranges (simplified).
   * 
   * @returns {RangeSet[]} A copy of the simplified ranges.
   */
  get ranges(): RangeSet[] {
    return this._ranges.slice();
  }

  /**
   * Create a new selection checker from a string.
   * 
   * @param {string} selectionStr The selection string, comma seperated.
   */
  constructor(selectionStr: string) {
    const selectionSections = selectionStr.split(',');

    for (let selection of selectionSections) {
      const allRanges: RangeSet = {
        min: new Big('0.000002'),
        max: new Big('999999999'),
        minVersion: [0, 0, 1, 'a', 1],
        maxVersion: [999, 999, 999]
      };

      selection = selection.trim();

      const versionParts = selection.split('-');

      if (versionParts.length === 1) {
        if (selection === '*') {
          this._ranges = [allRanges];
          break;
        }

        const version = versionParts[0].trim();
        const validVersion = isVersionValid(version);
        if (!validVersion) {
          this._isValid = false;
          break;
        }

        const float = toFloat(validVersion);
        this._ranges.push({
          max: float,
          min: float,
          maxVersion: validVersion,
          minVersion: validVersion
        });
        continue;
      } else if (versionParts.length !== 2) {
        this._isValid = false;
        break;
      }

      let [lowerVersionStr, upperVersionStr] = versionParts;
      lowerVersionStr = lowerVersionStr.trim();
      upperVersionStr = upperVersionStr.trim();

      let lowerVersion = isVersionValid(lowerVersionStr);
      const upperVersion = isVersionValid(upperVersionStr);
      const hasLower = lowerVersionStr !== '';
      const hasUpper = upperVersionStr !== '';

      if ((!lowerVersion && hasLower) || (!upperVersion && hasUpper) || (!hasLower && !hasUpper)) {
        this._isValid = false;
        break;
      }

      const range = allRanges;

      if (hasLower && lowerVersion) {

        // Since (for instance) 1 really means everything from 1.0.0a1 and up, we can use this hack
        if (!lowerVersion[3])
          lowerVersion = isVersionValid(lowerVersionStr + 'a1') as Version;

        range.min = toFloat(lowerVersion);
        range.minVersion = lowerVersion;
      }

      if (hasUpper && upperVersion) {

        // Similarly, since (for instance) 2 really means everything up to 2.999.999, we can use this hack
        const partLen = upperVersionStr.split('.').length;
        const hasPre = upperVersionStr.includes('a') || upperVersionStr.includes('b');

        if (!hasPre) {
          if (partLen < 2)
            upperVersion[1] = 999;
          if (partLen < 3)
            upperVersion[2] = 999;
        }

        range.max = toFloat(upperVersion);
        range.maxVersion = upperVersion;
      }

      if (range.min.gt(range.max)) {
        this._isValid = false;
        break;
      }

      this._ranges.push(range);
    }

    if (!this._isValid)
      return;

    // // Sort them in order from least to greatest
    // this._ranges = this._ranges.sort((a, b) => {
    //   const diff = a.min.sub(b.max);

    //   if (diff.eq(0))
    //     return 0;

    //   return diff.lt(0) ? -1 : 1;
    // });

    // console.log('--SORTED--');
    // for (const range of this._ranges) {
    //   console.log(versionStr(range.minVersion), versionStr(range.maxVersion));
    // }
    // console.log('--SORTED--');

    // // Range simplification
    // let i = 0;
    // while (i < this._ranges.length - 1) {
    //   const thisRange = this._ranges[i];
    //   const nextRange = this._ranges[i + 1];

    //   // Merge the two ranges if the max of one range is equal to the min of the other.
    //   if (thisRange.max.eq(nextRange.min)) {
    //     this._ranges.splice(i, 2, {
    //       min: thisRange.min,
    //       max: nextRange.max,
    //       minVersion: thisRange.minVersion,
    //       maxVersion: nextRange.maxVersion
    //     });
    //     continue;
    //   }

    //   ++i;
    // }

    for (const range of this._ranges) {
      console.log(range.min.toString(), range.max.toString());
    }
  }

  /**
   * Check to see whether a version falls within this selection.
   * 
   * @param {Version} version Check if a version falls within a version selection.
   * @returns {boolean} True if the number is within the selection.
   */
  isWithinRange(version: Version): boolean {
    for (const range of this._ranges) {
      const versionFloat = toFloat(version);

      if (versionFloat.gte(range.min) && versionFloat.lte(range.max))
        return true;
    }
    return false;
  }
}

/**
 * Convert a version number to a float representation.
 * 
 * @param {Version} version The version to convert to a float.
 * @returns {Big} The version's float representation.
 */
function toFloat(version: Version): Big {

  // The first number does not have to be exactly three digits long, it'll be trimmed off anyway
  const floatStr = `${version[0]}${toThreeDigits(version[1])}${toThreeDigits(version[2])}`;

  const semverFloat = new Big(floatStr);
  const aOrB = version[3];
  if (!aOrB)
    return semverFloat;

  const preReleaseNum = 999 - (version[4] as number);
  let preReleaseFloatStr: string;
  if (aOrB === 'a')
    preReleaseFloatStr = `.999${toThreeDigits(preReleaseNum)}`;
  else
    preReleaseFloatStr = `.${toThreeDigits(preReleaseNum)}999`;
  const preReleaseFloat = new Big(preReleaseFloatStr);

  return semverFloat.sub(preReleaseFloat);
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

/**
 * Convert a version to a string.
 * 
 * @param {Version} version The version to convert to a string.
 * @returns {string} The version represented as a string.
 */
export function versionStr(version: Version): string {
  let finalStr = version.slice(0, 3).join('.');
  if (version[3])
    finalStr += version.slice(3, 5).join('');
  return finalStr;
}