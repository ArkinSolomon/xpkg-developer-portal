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

/**
 * Make an HTTP post request asynchronously, executing a callback after completion.
 * 
 * @param {string} url The URL to make the request to.
 * @param {string} [authorization=] The token to send in the authorization, null if no token.
 * @param {Record<string, string>} body The body of the request as on object to send as key/value pairs.
 * @param {(err: ProgressEvent | undefined, response: XMLHttpRequest | undefined) => void} cb The callback to execute after the operation completes.
 */
export function postCB(url: string, authorization: string|undefined, body: Record<string, string>, cb: (err: ProgressEvent | undefined, response: XMLHttpRequest | undefined) => void): void {
  const xhttp = new XMLHttpRequest();
  xhttp.onload = function () {
    cb(void (0), this);
  };
  xhttp.onerror = ev => cb(ev, undefined);
  xhttp.open('POST', url, true);
  if (authorization)
    xhttp.setRequestHeader('Authorization', authorization);
  xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhttp.send(encodeURIObject(body));
}

/**
 * Make an HTTP post request asynchronously, returning a promise. 
 * 
 * @param {string} url The URL to make the request to.
 * @param {string} [authorization=] The token to send in the authorization, null if no token.
 * @param {Record<string, string>} body The body of the request as on object to send as key/value pairs.
 * @return {Promise<XMLHttpRequest>} The request after it completes, or errors.
 */
export async function post(url: string, authorization: string|undefined, body: Record<string, string>): Promise<XMLHttpRequest> {
  return new Promise((resolve, reject) => {
    postCB(url, authorization, body, (err, res) => {
      if (err)
        return reject(err);
      resolve(res as XMLHttpRequest);
    });
  });
}

/**
 * Download a file from a URL and save it with a specific name.
 * 
 * @param {string} url The URL to download.
 * @param {string} fileName The file name to save as
 */
export function downloadFile(url: string, fileName: string) {
  // We need this workaround to download as the file name, instead of the gibberish AWS id
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'blob';
  xhr.onload = e => {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blob = (e.currentTarget as any).response;
    saveBlob(blob, fileName);
  };
  xhr.send();
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

/**
 * Save an XHR blob to the local machine.
 * 
 * @param {Blob} blob The blob to save.
 * @param {string} fileName The name of the file to save as.
 */
function saveBlob(blob: Blob, fileName: string) {
  const a = document.createElement('a');
  a.href = window.URL.createObjectURL(blob);
  a.download = fileName;
  a.dispatchEvent(new MouseEvent('click'));
}