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