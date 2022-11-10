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

export function post(url: string, body: Record<string, string>, cb: (err: ProgressEvent | undefined, response: XMLHttpRequest | undefined) => void): void {
  const xhttp = new XMLHttpRequest();
  xhttp.onload = function () {
    cb(void (0), this);
  };
  xhttp.onerror = ev => cb(ev, undefined);
  xhttp.open('POST', url, true);
  xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhttp.send(encodeURIObject(body));
}

/**
 * Encode an object as URI components.
 * 
 * @param {Record<string, string>} obj The object to encode.
 * @returns {string} The object URI encoded.
 */
function encodeURIObject(obj: Record<string, string>): string {
  let retStr = '';
  for (const [k, v] of Object.entries(obj))
    retStr += encodeURIComponent(k) + '=' + encodeURIComponent(v) + '&';
  return retStr.length === 0 ? '' : retStr.slice(0, -1);
}