/*
 * Copyright (c) 2022-2023. Arkin Solomon.
 * 
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied limitations under the License.
 */
import { Component, ReactNode } from 'react';
import MainContainer from '../components/Main Container/MainContainer';
import SideBar from '../components/Main Container/SideBar';
import MainContainerContent from '../components/Main Container/MainContainerContent';
import { Formik } from 'formik';
import InputField, { InputFieldProps } from '../components/Input/InputField';
import '../css/Tools.scss';
import Version from '../scripts/version';
import SelectionChecker from '../scripts/versionSelection';

/**
 * An enumeration for all of the different tools available.
 * 
 * @name ToolPages
 * @enum {number}
 */
export enum ToolPages {
  VersionStrings = 0,
  IncompatibilityGenerator,
  HiddenPackages
}

/**
 * Values for the version testing page.
 * 
 * @typedef {Object} VersionTesterValues
 * @property {string} testVersion The version that's being tested.
 * @property {string} testVersionSelection The version selection string.
 */
type VersionTesterValues = {
  testVersion: string;
  testVersionSelection: string;
};

/**
 * The state of the tools page.
 * 
 * @typedef {Object} ToolsState
 * @property {ToolPages} currentPage The current page.
 * @property {Partial<VersionTesterValues>} versionTesterErrors Any errors that occur with the version tester form.
 * @property {string} versionTesterOutput The output of the version tester.
 */
type ToolsState = {
  currentPage: ToolPages;
  versionTesterErrors: Partial<VersionTesterValues>;
  versionTesterOutput: string;
};

const DEFAULT_VERSION_OUTPUT = 'Input a valid version into the \'Version\' field, and a valid selection into the \'Version Selection\' field to see how version strings and version selection strings are parsed.';

export default class Tools extends Component {

  state: ToolsState;

  constructor(props: never) {
    super(props);

    let defaultPage = ToolPages.VersionStrings;
    const storedDefault = sessionStorage.getItem('defaultTool');
    if (storedDefault) {
      defaultPage = parseInt(storedDefault, 10) as ToolPages;
      sessionStorage.removeItem('defaultTool');

    // if (defaultPage === ToolPages.IncompatibilityGenerator)
    //TODO load default values
    }

    this.state = {
      currentPage: defaultPage,
      versionTesterErrors: {},
      versionTesterOutput: DEFAULT_VERSION_OUTPUT
    };
  }

  setCurrentPage(page: ToolPages) {
    this.setState({
      currentPage: page
    });
  }

  render(): ReactNode {
    return (
      <MainContainer left={
        <SideBar
          items={[
            {
              text: 'Version Testing',
              action: () => this.setCurrentPage(ToolPages.VersionStrings)
            },
            // {
            //   text: 'Hidden Packages',
            //   action: () => this.setCurrentPage(ToolPages.HiddenPackages)
            // },
            // {
            //   text: 'Incompatibility Strings',
            //   action: () => this.setCurrentPage(ToolPages.IncompatibilityGenerator)
            // }
          ]}
        />}

      right={
        <>
          {
            this.state.currentPage === ToolPages.VersionStrings &&
          <MainContainerContent title='Version Testing'>
            <Formik
              validate={({ testVersion: testVersionStr, testVersionSelection: testVersionSelectionStr }) => {
                const versionTesterErrors: Partial<VersionTesterValues> = {};
                const testVersion = Version.fromString(testVersionStr);
                const selectionChecker = new SelectionChecker(testVersionSelectionStr);
                let versionTesterOutput = DEFAULT_VERSION_OUTPUT;
                    
                if (testVersionStr.length === 0)
                  versionTesterErrors.testVersion = 'No version string given';
                else if (testVersionStr.length > 15)
                  versionTesterErrors.testVersion = 'Version string too long';
                else if (!testVersion)
                  versionTesterErrors.testVersion = 'Invalid version string';

                if (testVersionSelectionStr.length === 0)
                  versionTesterErrors.testVersionSelection = 'Version selection required';
                if (testVersionSelectionStr.length > 256)
                  versionTesterErrors.testVersionSelection = 'Version selection too long';
                else if (!selectionChecker.isValid)
                  versionTesterErrors.testVersionSelection = 'Invalid version selection';

                if (!versionTesterErrors.testVersionSelection) {
                  let isWithinRange = false;
                  if (!versionTesterErrors.testVersion)
                    isWithinRange = selectionChecker.containsVersion(testVersion as Version);

                  const ranges = selectionChecker.ranges;
                  let rangeStr = '';
                  for (const i in ranges) {
                    const range = ranges[i];

                    // Double tilde converts string to a number
                    if (ranges.length > 1 && ~~i === ranges.length - 1) 
                      rangeStr += ' and ';

                    // Since we're using bold tags here we have to set the HTML dangerously
                    if (range.max.eq(range.min))
                      rangeStr += '<b>' + range.maxVersion.toString() + '</b>';
                    else
                      rangeStr += `<b>${range.minVersion.toString()}&#8211;${range.maxVersion.toString()}</b>`;
                      
                    if (ranges.length !== 2)
                      rangeStr += ', ';
                  }

                  rangeStr = rangeStr.substring(0, ranges.length !== 2 ? rangeStr.length - 3 : rangeStr.length - 1);
                  if (!versionTesterErrors.testVersion)
                    versionTesterOutput = `The version <b>${(testVersion as Version).toString()}</b> is ${isWithinRange ? '' : '<b>not</b> '} within the range. The range you have specified covers versions ${rangeStr}.`;
                  else
                    versionTesterOutput = `The range you have specified covers ${rangeStr}.`;
                }
                    
                this.setState({
                  versionTesterErrors,
                  versionTesterOutput
                } as Partial<ToolsState>);
                return {};
              }}
              validateOnChange
              validateOnMount
              initialValues={{
                testVersion: '',
                testVersionSelection: ''
              }as VersionTesterValues}
              onSubmit={() => void (0)}
            >{({ handleChange }) => {
                const testVersionField: InputFieldProps = {
                  label: 'Version',
                  name: 'testVersion',
                  placeholder: 'x.x.x',
                  minLength: 1,
                  maxLength: 15,
                  onChange: handleChange,
                  error: this.state.versionTesterErrors.testVersion
                };
                    
                const testVersionSelectionField: InputFieldProps = {
                  label: 'Version Selection',
                  name: 'testVersionSelection',
                  placeholder: 'x.x.x-x.x.x',
                  minLength: 1,
                  maxLength: 256,
                  onChange: handleChange,
                  error: this.state.versionTesterErrors.testVersionSelection
                };

                return (
                  <>
                    <p id='version-selection-output' dangerouslySetInnerHTML={{__html: this.state.versionTesterOutput}}></p>
                    <section className='input-section no-border my-6'>
                      <div className='left-half'>
                        <InputField {...testVersionField} />
                      </div>
                      <div className='right-half'>
                        <InputField {...testVersionSelectionField} />
                      </div>
                    </section>
                  </>
                );     
              }}
            </Formik>
          </MainContainerContent>
          }
        </>
      }
      />
    );
  }
}