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
 * Values for the new package form.
 * 
 * @typedef {Object} NewPackageValues
 * @property {string} packageName The name of the package.
 * @property {string} packageId The identifier of the package.
 * @property {string} packageType The type of the package.
 * @property {string} description The description of the package.
 * @property {string} xplaneVersion The X-Plane compatibility version.
 * @property {boolean} isPublic True if the package is public.
 * @property {boolean} isPrivate True if the package is private.
 * @property {boolean} isStored True if the package is stored in the registry. 
 */
type NewPackageValues = {
  packageName: string;
  packageId: string;
  packageType: string;
  description: string;
};

/**
 * The state of the new package page.
 * 
 * @typedef {Object} NewPackageState
 * @property {Object} errors The errors for each field, the same items in {@link NewPackageValues}, but with all keys optional.
 * @property {string} [submissionError] Any error that occured after pressing the upload button.
 */
type NewPackageState = {
  errors: Partial<NewPackageValues>;
  submissionError?: string;
};

import { Formik, FormikErrors } from 'formik';
import { Component, ReactNode } from 'react';
import InputDropdown from '../components/Input/InputDropdown';
import InputField, { InputFieldProps } from '../components/Input/InputField';
import MainContainer from '../components/Main Container/MainContainer';
import MainContainerContent from '../components/Main Container/MainContainerContent';
import ErrorMessage from '../components/ErrorMessage';
import '../css/Buttons.scss';
import { checkAuth, delToken } from '../scripts/tokenStorage';
import InputArea, { InputAreaProps } from '../components/Input/InputArea';
import axios, { AxiosError } from 'axios';
import { validateId } from '../scripts/validators';

// Compute the default option
export const packageTypes = {
  aircraft: 'Aircraft',
  scenery: 'Scenery',
  plugin: 'Plugin',
  livery: 'Livery',
  executable: 'Executable',
  other: 'Other'
};
const defaultPackage = Object.entries(packageTypes).sort((a, b) => a[1].localeCompare(b[1]))[0][0];

class NewPackage extends Component {

  state: NewPackageState;

  constructor(props: Record<string, never>) {
    super(props);

    this.state = {
      errors: {},
    };

    const token = checkAuth();
    if (!token) {
      sessionStorage.setItem('post-auth-redirect', '/packages');
      window.location.href = '/';
      return;
    }   
  }

  private _validate({ packageName, packageId, description }: NewPackageValues): FormikErrors<NewPackageValues> {
    packageId = packageId.trim().toLowerCase();
    packageName = packageName.trim();
    description = description.trim();
    
    const errors = {} as NewPackageState['errors'];

    if (packageId.length < 6)
      errors.packageId = 'Package identifier too short';
    else if (packageId.length > 32)
      errors.packageId = 'Package identifier too short';
    else if (!validateId(packageId)) 
      errors.packageId = 'Package identifier has invalid characters';
      
    if (packageName.length < 3)
      errors.packageName = 'Package name too short';
    else if (packageName.length > 32)
      errors.packageName = 'Package name too long';
    
    if (description.length < 10)
      errors.description = 'Description too short';
    else if (description.length > 8192)
      errors.description = 'Description too long';
  
    this.setState({
      errors,
      submissionError: '',
    } as Partial<NewPackageState>);
    return {};
  }

  private async _submit(values: NewPackageValues, { setSubmitting } : {setSubmitting: (isSubmitting: boolean) => void}) {
    setSubmitting(true);

    this.setState({
      uploadProgress: 0,
      uploading: true
    } as Partial<NewPackageState>);
  
    const packageId = values.packageId.trim().toLowerCase();
    const packageName = values.packageName.trim();
    const packageType = (values.packageType || defaultPackage).trim().toLowerCase();
    const description = values.description.trim();

    const formData = new FormData();
    formData.append('packageId', packageId);
    formData.append('packageName', packageName);
    formData.append('packageType', packageType);
    formData.append('description', description);

    try {
      await axios({
        url: `${window.REGISTRY_URL}/packages/new`,
        method: 'POST',
        data: formData,
        headers: {
          Authorization: checkAuth() as string
        }
      });

      sessionStorage.setItem('success_message', 'Your package is being processed');
      window.location.href = '/packages';
    } catch (e){
      if (!(e instanceof AxiosError)) {
        this.setState({
          submissionError: 'An unkown error occured.'
        });
      } else {
        switch (e.response?.status) {
        case 400:
          this.setState({
            submissionError: {
              missing_form_data: 'Missing form data.',
              short_id: 'Package identifier is too short.',
              long_id: 'Package identifier is too long',
              invalid_id: 'Package identifier uses invalid characters.',
              short_name: 'Package name is too short',
              long_name: 'Package name is too long',
              short_desc: 'Description is too short',
              long_desc: 'Description is too long',
              profane_id: 'Do not use profanity in package identifier (contact support if you believe this is in error).',
              profane_name: 'Do not use profanity in package name (contact support if you believe this is in error).',
              profane_desc: 'Do not use profanity in description (contact support if you believe this is in error).',
              id_in_use: 'Package identifier already in use.',
              name_in_use: 'Package name already in use.'
            }[e.response?.data as string]
                ?? ('Unkown issue with form: ' + e.response?.data as string + '.'),
            uploading: false
          } as Partial<NewPackageState>);
          break;
        case 401:
          window.location.href = '/';
          delToken();
          break;
        case 500:
          this.setState({
            submissionError: 'Internal server error, try again',
          } as Partial<NewPackageState>);
          break;
        default:
          this.setState({
            submissionError: 'An unknown error occured',
          } as Partial<NewPackageState>);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  render(): ReactNode {
    return (
      <MainContainer>
        <MainContainerContent
          title='New package'
          backButtonText='Packages'
          backButtonURL='/packages'
        >
          <Formik
            validate={this._validate.bind(this)}
            validateOnChange={true}
            validateOnMount={true}
            initialValues={{
              packageName: '',
              packageId: '',
              packageType: '',
              description: '',
            } as NewPackageValues}
            onSubmit={ this._submit.bind(this) }>
            {({
              handleChange,
              handleSubmit,
              isSubmitting,
            }) => {

              // We need this due to TypeScript being weird
              // https://stackoverflow.com/questions/48240449/type-is-not-assignable-to-type-intrinsicattributes-intrinsicclassattribu
              const packageNameData: InputFieldProps = {
                name: 'packageName',
                label: 'Package Name',
                minLength: 3,
                maxLength: 32,
                onChange: handleChange,
                error: this.state.errors.packageName
              };

              const packageIdData: InputFieldProps = {
                name: 'packageId',
                label: 'Package Identifier',
                minLength: 6,
                maxLength: 32,
                onChange: handleChange,
                error: this.state.errors.packageId
              };
              
              const descTextAreaData: InputAreaProps = {
                name: 'description',
                label: 'Description',
                minLength: 10,
                maxLength: 8192,
                onChange: handleChange,
                error: this.state.errors.description
              };

              return (
                <>
                  <ErrorMessage text={this.state.submissionError ?? ''} show={!!this.state.submissionError} />
                  <form
                    onSubmit={handleSubmit}
                    onChange={handleChange}
                    onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                  >
                    <section className='input-section'>
                      <InputField {...packageNameData}/>
                      <InputField {...packageIdData} />
                      <InputDropdown
                        name='packageType'
                        label='Package Type'
                        items={packageTypes}
                        onChange={handleChange}
                      />
                    </section>
                    <section className='mt-9'>
                      <InputArea {...descTextAreaData} />
                    </section>
                    <section className='mt-9'>
                      <input
                        className='primary-button float-right'
                        type="submit"
                        value="Submit"
                        disabled={isSubmitting || !!Object.keys(this.state.errors).length || !!this.state.submissionError}
                      />
                    </section>
                  </form>
                </>
              );  
            }}
          </Formik>
        </MainContainerContent>
      </MainContainer>
    );
  }
}

export default NewPackage;