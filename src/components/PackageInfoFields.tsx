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
 * Properties for the readonly package information field elements.
 * 
 * @typedef {Object} PackageInfoFieldsProps
 * @property {string} packageId The id of the package.
 * @property {string} packageName The name of the package.
 * @property {PackageType} packageType The type of the package.
 * @property {string} [packageVersion] The version of the package. Only displayed if provided.
 */

import { packageTypes } from '../pages/NewPackage';
import { PackageType } from '../scripts/author';
import InputDropdown, { InputDropdownProps } from './Input/InputDropdown';
import InputField, { InputFieldProps } from './Input/InputField';

function PackageInfoFields(props: {
  packageId: string;
  packageName: string;
  packageType: PackageType
  packageVersion?: string;
}) {
  const { packageId, packageName, packageType, packageVersion } = props;

  const dispVersion = !!packageVersion;

  const packageNameData: InputFieldProps = {
    name: 'packageName',
    label: 'Package Name',
    readonly: true,
    defaultValue: packageName,
  };

  const packageIdData: InputFieldProps = {
    name: 'packageId',
    label: 'Package Identifier',
    readonly: true,
    defaultValue: packageId,
  };

  const packageTypeData: InputDropdownProps = {
    name: 'packageType',
    label: 'Package Type',
    items: packageTypes,
    defaultValue: packageType,
    readonly: true
  };

  const packageVersionData: InputFieldProps = {
    name: 'packageVersion',
    label: 'Package Version',
    readonly: true,
    defaultValue: packageVersion ?? '<you should not see this>',
  };

  return (
    <section className='input-section'>
      <InputField {...packageNameData}/>
      <InputField {...packageIdData} />
      {dispVersion && <InputField {...packageVersionData} />}
      <InputDropdown {...packageTypeData} />
    </section>
  );
}

export default PackageInfoFields;