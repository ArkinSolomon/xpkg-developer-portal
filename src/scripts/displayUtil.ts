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

const kib = 1024;
const mib = 1024 * kib;
const gib = 1024 * mib;
const tib = 1024 * gib;

/**
 * Find the best unit to represent the size in bytes.
 * 
 * @param {number} size The size to represent.
 * @returns {string} The number formatted in the best unit.
 */
export function getBestUnits(size: number): string {
  if (size > tib) 
    return `${Math.round(size * 10 / gib) / 10} TiB`; 
  if (size > gib)
    return `${Math.round(size * 10 / gib) / 10 } GiB`; 
  if (size > mib)
    return `${Math.round(size * 10 / mib) / 10} MiB`;
  if (size > kib) 
    return `${Math.round(size * 10 / kib) / 10} KiB`;
  return `${size} B`;
}