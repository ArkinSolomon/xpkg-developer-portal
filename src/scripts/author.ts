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
 * Enumeration of all possible package types. Same as in /src/packages/packageDatabase.ts on the registry.
 * 
 * @name PackageType
 * @enum {string}
 */
export enum PackageType {
  Aircraft = 'aircraft',
  Executable = 'executable',
  Scenery = 'scenery',
  Plugin = 'plugin',
  Livery = 'livery',
  Other = 'other'
}

/**
 * Enumeration of all statuses for package versions. Same as in /src/packages/packageDatabase.ts on the registry. See registry source code for more information.
 * 
 * @name VersionStatus
 * @enum {string}
 */
export enum VersionStatus {
  Processing = 'processing', 
  Processed = 'processed',
  Removed = 'removed',
  FailedMACOSX = 'failed_macosx',
  FailedNoFileDir = 'failed_no_file_dir', 
  FailedManifestExists = 'failed_manifest_exists', 
  FailedInvalidFileTypes = 'failed_invalid_file_types',
  FailedFileTooLarge = 'failed_file_too_large',
  FailedNotEnoughSpace = 'failed_not_enough_space',
  FailedServer = 'failed_server',
  Aborted = 'aborted'
}

/**
 * The storage used.
 * 
 * @typedef {Object} AuthorData 
 * @property {string} id The author's identifier.
 * @property {string} name The author's name.
 * @property {string} email The author's email.
 * @property {boolean} isVerified True if the author's email is verified.
 * @property {number} usedStorage The storage currently used.
 * @property {number} totalStorage The totally available storage.
 */
export type AuthorData = {
  id: string;
  name: string;
  email: string;
  isVerified: string;
  usedStorage: number;
  totalStorage: number;
};

/**
 * The data returned for a single author's package.
 * 
 * @typedef {Object} AuthorPackageData
 * @property {string} packageId The partial identifier of the package.
 * @property {string} packageName The name of the package.
 * @property {string} description The description of the package.
 * @property {PackageType} packageType The type of the package.
 * @property {AuthorVersionData[]} versions All of the versions of the package, including failed or removed.
 */
export type AuthorPackageData = {
  packageId: string;
  packageName: string;
  description: string;
  packageType: PackageType;
  versions: AuthorVersionData[];
};

/**
 * All of the data that the version owner can see when requesting their version data, after it has been parsed.
 * 
 * @typedef {Object} AuthorVersionData
 * @property {Version} packageVersion The version that this data is for.
 * @property {boolean} isPublic True if the package is public.
 * @property {boolean} isStored True if the package is stored.
 * @property {number} installs The number of total installations of the package.
 * @property {VersionStatus} status The current status of the package.
 * @property {[string, string][]} dependencies The package dependencies.
 * @property {[string, string][]} incompatibilities The package incompatibilities.
 * @property {number} size The storage size that the version takes up on the server in bytes.
 * @property {number} installedSize The approximate size that the package will take once installed (in bytes).
 * @property {VersionSelection} xpSelection The X-Plane selection.
 * @property {Date} uploadDate The last date of when this version was uploaded.
 * @property {string} [privateKey] The private key of the package. Only provided if the package is not public.
 * @property {string} [hash] The checksum of the processed file. Only present if this version was processed successfully.
 * @property {string} [loc] The location of the processed file. Only present if this version was successfully processed and if the version is public.
 * @property {Object} platforms The platform that the package version supports.
 * @property {boolean} platforms.macOS True if MacOS is supported.
 * @property {boolean} platforms.windows True if Windows is supported.
 * @property {boolean} platforms.linux True if Linux is supported.
 */
export type AuthorVersionData = {
  packageVersion: Version;
  isPublic: boolean;
  isStored: boolean;
  downloads: number;
  status: VersionStatus;
  dependencies: [string, string][];
  incompatibilities: [string, string][];
  size: number;
  installedSize: number;
  xpSelection: VersionSelection;
  uploadDate: Date;
  privateKey?: string;
  hash?: string;
  loc?: string;
  platforms: {
    macOS: boolean;
    windows: boolean;
    linux: boolean;
  }
};

// When only one version is retrieved, the 'versions' key is replaced with 'versionData', and contains only the data for one version.
export type AuthorSingleVersionPackageData = Omit<AuthorPackageData, 'versions'> & {
  versionData: AuthorVersionData;
};

// The data retrieved from the registry which needs to be parsed
type RegistryPackageData = Omit<AuthorPackageData, 'versions'> & {
  versions: RegistryVersionData[];
}
type RegistryVersionData = Omit<Omit<Omit<AuthorVersionData, 'packageVersion'>, 'xpSelection'>, 'uploadDate'> & {
  packageVersion: string;
  xpSelection: string;
  uploadDate: string;
};

type RegistrySinglePackageData = Omit<AuthorSingleVersionPackageData, 'version'> & {
  versionData: RegistryVersionData;
};

import * as tokenStorage from './tokenStorage';
import * as http from './http';
import HTTPMethod from 'http-method-enum';
import VersionSelection from './versionSelection';
import Version from './version';
import RegistryError from './registryError';

/**
 * Try to get the storage data for the currently logged in author. 
 * 
 * @async
 * @returns {Promise<AuthorData>} The storage data of the currently logged in author.
 * @throws {Error} An error is thrown if the author does not have a token, or if the request fails.
 */
export async function getAuthorData(): Promise<AuthorData> {
  const token = tokenStorage.checkAuth();
  if (!token)
    throw new RegistryError(401, 'Unauthorized');
  
  const response = await http.httpRequest(`${window.REGISTRY_URL}/account/data`, HTTPMethod.GET, token, {});
  if (response.status !== 200)
    throw new RegistryError(response.status, response.responseText ?? response.statusText);
  
  return JSON.parse(response.responseText);
}

/**
 * Try to get all package data for the currently logged in author.
 * 
 * @async
 * @returns {Promise<AuthorPackageData[]>} A promise which resolves to all of the package data for the author.
 * @throws {RegistryError} An error is thrown if the author does not have a token, or if the request fails for any other reason.
 */
export async function getAllAuthorPackages(): Promise<AuthorPackageData[]> {
  const token = tokenStorage.checkAuth();
  if (!token)
    throw new RegistryError(401, 'Unauthorized');

  const response = await http.httpRequest(`${window.REGISTRY_URL}/account/packages`, HTTPMethod.GET, token, {});
  if (response.status !== 200)
    throw new RegistryError(response.status, response.responseText ?? response.statusText);
  
  const responseData = JSON.parse(response.responseText).packages as RegistryPackageData[];
  const retData: AuthorPackageData[] = [];

  for (const pkgData of responseData) {

    const versions: AuthorVersionData[] = pkgData.versions.map(v => ({
      ...v,
      uploadDate: new Date(v.uploadDate),
      xpSelection: new VersionSelection(v.xpSelection),
      packageVersion: Version.fromString(v.packageVersion)!
    }));

    retData.push({
      ...pkgData,
      versions
    });
  }
  return retData;
}

/**
 * Get the data for all versions of the specified package.
 * 
 * @param {string} packageId The id of the package to get the versions of.
 * @returns {Promise<AuthorPackageData>} The data of the specified package.
 * @throws {RegistryError} An error is thrown if the author does not have a token, or if the request fails for any other reason.
 */
export async function getAuthorPackage(packageId: string): Promise<AuthorPackageData> {
  const token = tokenStorage.checkAuth();
  if (!token)
    throw new RegistryError(401, 'Unauthorized');

  const response = await http.httpRequest(`${window.REGISTRY_URL}/account/packages/${packageId}`, HTTPMethod.GET, token, {});
  if (response.status !== 200)
    throw new RegistryError(response.status, response.responseText ?? response.statusText);
  
  const responseData = JSON.parse(response.responseText) as RegistryPackageData;
  const versions: AuthorVersionData[] = responseData.versions.map(v => ({
    ...v,
    packageVersion: Version.fromString(v.packageVersion)!,
    xpSelection: new VersionSelection(v.xpSelection),
    uploadDate: new Date(v.uploadDate)
  }));

  return {
    ...responseData,
    versions
  };
}

/**
 * Get the data for the specified package version.
 * 
 * @param {string} packageId The id of the package to get the version data of.
 * @param {string} packageVersion The version string of the version to get the data of.
 * @returns {Promise<AuthorSingleVersionPackageData>} The data of the package at the specified version.
 * @throws {RegistryError} An error is thrown if the author does not have a token, or if the request fails for any other reason.
 */
export async function getAuthorPackageVersion(packageId: string, packageVersion: string): Promise<AuthorSingleVersionPackageData> {
  const token = tokenStorage.checkAuth();
  if (!token)
    throw new RegistryError(401, 'Unauthorized');

  const response = await http.httpRequest(`${window.REGISTRY_URL}/account/packages/${packageId}/${packageVersion}`, HTTPMethod.GET, token, {});
  if (response.status !== 200)
    throw new RegistryError(response.status, response.responseText ?? response.statusText);
  
  const responseData = JSON.parse(response.responseText) as RegistrySinglePackageData;
  const versionData: AuthorVersionData = {
    ...responseData.versionData,
    packageVersion: Version.fromString(responseData.versionData.packageVersion)!,
    uploadDate: new Date(responseData.versionData.uploadDate),
    xpSelection: new VersionSelection(responseData.versionData.xpSelection)
  };

  return {
    ...responseData,
    versionData
  };
}