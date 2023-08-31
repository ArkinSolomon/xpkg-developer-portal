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

/**
 * An instance of this class represents a status code returned by the registry.
 */
export default class RegistryError extends Error {

  private _status;
  private _message;

  /**
   * The status code that was sent which caused this error.
   */
  get status() {
    return this._status;
  }

  /**
   * The message from the registry.
   */
  get message() {
    return this._message;
  }

  /**
   * Create a new error with its status code and message.
   * 
   * @constructor
   * @param {string} status The registry status code.
   * @param {string} message The error message from the registry.
   */
  constructor(status: number, message: string) {
    super(`[Status Code ${status}] ${message}`);
    this._status = status;
    this._message = message;
  }
}