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
  return (name && typeof name === 'string' && name.length >= 3 && name.length <= 32) as boolean;
}

/**
 * Check if a package identifier is valid. Same function as in /util/validators.ts on the registry.
 * 
 * @param {unknown} packageId The identifier to validate.
 * @returns {boolean} True if the identifier is valid.
 */
export function validateId(packageId: unknown): boolean {
  if (typeof packageId !== 'string')
    return false;

  // We declare this new variable otherwise TS complains saying packageId is unknown
  let pId = packageId;
  if (packageId.includes('/')) {
    const parts = packageId.split('/');
    const [repo] = parts;
    pId = parts[1] as string;
    if (!/^[a-z]{3,8}$/i.test(repo))
      return false;
  }

  if (pId.length > 32 || pId.length < 6)
    return false;

  return /^([a-z][a-z0-9_-]*\.)*[a-z][a-z0-9_-]+$/i.test(pId);
}