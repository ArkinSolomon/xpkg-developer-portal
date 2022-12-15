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
 * Make an HTTP post request asynchronously, executing a callback after completion.
 * 
 * @param {string} url The URL to make the request to.
 * @param {Record<string, string>} body The body of the request as on object to send as key/value pairs.
 * @param {(err: ProgressEvent | undefined, response: XMLHttpRequest | undefined) => void} cb The callback to execute after the operation completes.
 */
export function postCB(url: string, body: Record<string, string>, cb: (err: ProgressEvent | undefined, response: XMLHttpRequest | undefined) => void): void {
  const xhttp = new XMLHttpRequest();
  xhttp.onload = function () {
    cb(void (0), this);
  };
  xhttp.onerror = ev => cb(ev, undefined);
  xhttp.open('POST', url, true);
  // xhttp.setRequestHeader('Content-Type', 'multipart/form-data');
  xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhttp.send(encodeURIObject(body));
}

/**
 * Make an HTTP post request asynchronously, returning a promise. 
 * 
 * @param {string} url The URL to make the request to.
 * @param {Record<string, string>} body The body of the request as on object to send as key/value pairs.
 * @return {Promise<XMLHttpRequest>} The request after it completes, or errors.
 */
export async function post(url: string, body: Record<string, string>): Promise<XMLHttpRequest> {
  return new Promise((resolve, reject) => {
    postCB(url, body, (err, res) => {
      if (err)
        return reject(err);
      resolve(res as XMLHttpRequest);
    });
  });
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