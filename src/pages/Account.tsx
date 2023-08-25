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
 * The data recieved from the server about the user/author.
 * 
 * @typedef {Object} AccountData
 * @property {string} id The id of the user/author.
 * @property {string} name The display name of the user/author.
 * @property {boolean} isVerified True if the user/author is verified.
 */
type AccountData = {
  id: string;
  name: string;
  isVerified: boolean;
};

/**
 * The state used by the account element.
 * 
 * @typedef {Object} AccountState
 * @property {ReactElement} rendered The element to render on the right side.
 * @property {AccountData} [accountData] The data received from the server concerning the user/author's account.
 * @property {boolean} invalidNameChangeForm True if the form data for the name change form is invalid.
 * @property {ConfirmPopupConfig} [popupConfig] True if a popup is currently open.
 * @property {string} [nameValue] The value of the name field after pressing submit.
 * @property {string} isSubmitting True if a form is currently submitting something.
 * @property {string} [nameChangeError] Has a value if there was an error changing the name.
 * @property {boolean} isPopupOpen True if the popup is open.
 * @property {boolean} verificationSent True if the verification email has been sent.
 * @property {boolean} sendingVerification True if the verification email is being sent.
 */
type AccountState = {
  rendered?: ReactElement;
  accountData?: AccountData;
  invalidNameChangeForm: boolean;
  popupConfig?: ConfirmPopupConfig;
  nameValue?: string;
  isSubmitting: boolean;
  nameChangeError?: string;
  isPopupOpen: boolean;
  verificationSent: boolean;
  sendingVerification: boolean;
};

/**
 * The values used for name changes.
 * 
 * @typedef {Object} NameChangeValues
 * @property {string} name The new name.
 */
type NameChangeValues = {
  name: string;
}

import { Component, ReactElement } from 'react';
import MainContainer from '../components/Main Container/MainContainer';
import '../css/Account.scss';
import 'reactjs-popup/dist/index.css';
import * as tokenStorage from '../scripts/tokenStorage';
import { httpRequest } from '../scripts/http';
import * as util from '../scripts/validators';
import MainContainerContent from '../components/Main Container/MainContainerContent';
import InputField from '../components/Input/InputField';
import { Formik, FormikErrors } from 'formik';
import * as SB from '../components/Main Container/SideBar';
import ConfirmPopup, { ConfirmPopupConfig } from '../components/ConfirmPopup';
import HTTPMethod from 'http-method-enum';
import MainContainerLoading from '../components/Main Container/MainContainerLoading';
const { default: SideBar } = SB;

class Account extends Component {

  mounted = false;
  state: AccountState;

  constructor(props: Record<string, never>) {
    super(props);

    this.state = {
      rendered: this.loading(),
      invalidNameChangeForm: false,
      isSubmitting: false,
      isPopupOpen: false,
      accountData: {
        name: '',
        id: '',
        isVerified: false
      },
      verificationSent: false,
      sendingVerification: false
    };

    const token = tokenStorage.checkAuth();
    if (!token) {
      sessionStorage.setItem('post-auth-redirect', '/account');
      window.location.href = '/';
      return;
    }   

    // this.updateRendered = this.updateRendered.bind(this);
    // this.loading = this.loading.bind(this);
    // this.error = this.error.bind(this);
    this.validateNameChange = this.validateNameChange.bind(this);
  }

  componentDidMount(): void {
    this.mounted = true;

    // This request will fire twice in development, during production it'll be fine
    const token = tokenStorage.checkAuth() as string;
    httpRequest(`${window.REGISTRY_URL}/account/data`, HTTPMethod.GET, token, {}, (err, resp) => {
      if (err || resp?.status !== 200) {
      
        if (resp?.status === 401) {
          tokenStorage.delToken();
          sessionStorage.setItem('post-auth-redirect', '/account');
          window.location.href = '/';
          return;
        }

        return this.updateRendered(
          this.error(!resp?.status ?
            'Could not connect to backend' :
            `Could not get data: ${resp?.status} (${resp?.statusText})`
          )
        );
      }
      
      // Pass the data directly into basicInformation() since state probably won't update before basicInformation() is called
      this.setState({
        rendered: this.basicInformation(JSON.parse(resp.response) as AccountData)
      } as AccountState);
    });
  }

  componentWillUnmount(): void {
    this.mounted = false;
  }

  loading(): ReactElement {
    return (
      <MainContainerLoading loadingMessage='Loading account details' />
    );
  }

  // TODO swtich this and loading page to new component
  error(error: string): ReactElement {
    return (
      <div className="error-screen">
        <h3>There was an error</h3>
        <p>{ error }</p>
      </div>
    );
  }

  validateNameChange({ name }: NameChangeValues): FormikErrors<NameChangeValues> {
    const isValid = name.trim() !== this.state.accountData?.name &&
      util.validateName(name.trim());
  
    this.setState({
      nameChangeError: void(0),
      invalidNameChangeForm: isValid,
      nameValue: name
    } as Partial<AccountState>);
    return {};
  }

  basicInformation(accountData?: AccountData): ReactElement {

    // Ensure that the state is kept up to date
    if (accountData)
      this.setState({ accountData });
    else 
      accountData = this.state.accountData;
    
    let verificationButtonText = 'Resend verification email';
    if (this.state.sendingVerification)
      verificationButtonText = 'Please wait...';
    else if (this.state.verificationSent)
      verificationButtonText = 'Verification sent';

    return (
      <MainContainerContent title="Basic Information">
        <div className='account-page'>
          <Formik
            validate={this.validateNameChange}
            validateOnChange={true}
            validateOnMount={true}
            initialValues={{
              name: ''
            } as NameChangeValues}
            onSubmit={
              (values, { setSubmitting }) => {
                this.setState({
                  isPopupOpen: true,
                  popupConfig: {
                    title: 'Confirm name change',
                    confirmText: 'Confirm',
                    closeText: 'Cancel',
                    onClose:  () => this.setState({
                      isPopupOpen: false
                    } as Partial<AccountState>),
                    onConfirm:   () => {
                      if (this.state.isSubmitting)
                        return;
                      this.setState({
                        isSubmitting: true
      
                        // Force a rerender of the basic information page to gray out the change button
                      } as AccountState, () => this.updateRendered(this.basicInformation()));
      
                      httpRequest(`${window.REGISTRY_URL}/account/changename`, HTTPMethod.PATCH, tokenStorage.checkAuth() as string, {
                        newName: this.state.nameValue as string,
                      }, (err, res) => {
                        if (err)
                          return console.error(err);
                      
                        let nameChangeError: string | undefined = void (0);
                        let popupConfig: ConfirmPopupConfig | undefined = void (0);
                        if (res?.status !== 204) {
                          switch (res?.status) {
                          case 400:
                            nameChangeError = 'Invalid username';
                            break;
                          case 406:
                            nameChangeError = 'You changed your username within the last 30 days';
                            break;
                          }
                        } else {

                          popupConfig = {
                            title: 'Name changed successfully',
                            showClose: false,
                            confirmText: 'Ok',
                            onConfirm: () => {
                              window.location.href = '/';
                            },
                            children: <p className='generic-popup-text'>Your name has been changed successfully. You will be logged out in 5 seconds, or when you press ok.</p>
                          } as ConfirmPopupConfig;
                      
                          tokenStorage.delToken();
                          setTimeout(() => window.location.href = '/', 5000);
                        }
                        this.setState({
                          nameChangeError,
                          popupConfig,
                          isPopupOpen: popupConfig !== void(0), 
                          isSubmitting: false,
                        } as AccountState, () => this.updateRendered(this.basicInformation()));
                      });
                    },
                    children: <p className='generic-popup-text'>Are you sure you want to change your name from <b>{ this.state.accountData?.name }</b> to <b>{this.state.nameValue}</b>. Your name can not be changed again for 30 days.</p>
                  },
                  nameValue: values.name,
                  isSubmitting: false
                } as Partial<AccountState>, () => {
                  setSubmitting(false);
                }); 
              }
            }>
            {({
              handleChange,
              handleSubmit,
              isSubmitting
            }) => {
              const nameChangeFieldData = {
                name: 'name',
                title: 'Name',
                placeholder: this.state.accountData?.name,
                width: '60%',
                defaultValue: this.state.accountData?.name,
                onChange: handleChange
              };

              return (
                <div className='inline-block float-left w-1/2'>
                  <form className="account-form" onSubmit={handleSubmit}>
                    <InputField {...nameChangeFieldData} />
                    <input
                      type="submit"
                      value="Change"
                      disabled={isSubmitting || this.state.isSubmitting || !this.state.invalidNameChangeForm}
                    />
                    {this.state.nameChangeError && <p className='error-text'>{this.state.nameChangeError}</p>}
                  </form>
                </div>
              );
            }} 
          </Formik>
          <div className='inline-block float-right w-1/2'>
            <p>Verification status: {this.state.accountData?.isVerified ? 'YES' : 'NO'}</p>
            <button disabled={this.state.accountData?.isVerified || this.state.verificationSent || this.state.sendingVerification} className='reverify-button mt-3' onClick={async () => {
              this.setState({
                sendingVerification: true
              } as Partial<AccountState>, () => this.updateRendered(this.basicInformation()));
              
              const response = await httpRequest(`${window.REGISTRY_URL}/account/reverify`, HTTPMethod.POST, tokenStorage.checkAuth() as string, {});

              let errorMessage: string;
              switch (response.status) {
              case 204:
                this.setState({
                  isPopupOpen: true,
                  verificationSent: true,
                  sendingVerification: false,
                  popupConfig: {
                    title: 'Verification Email Sent',
                    children: <p className='generic-popup-text'>The verification email has been sent to the email associated with this account. The link will be valid for 24 hours.</p>,
                    showClose: true,
                    onClose: () =>
                      this.setState({
                        isPopupOpen: false
                      } as Partial<AccountState>),
                  }
                } as Partial<AccountState>, () => this.updateRendered(this.basicInformation()));
                return;
              case 400:
                errorMessage = 'Could not resend the verification email, you have already verified your account.';
                break;
              case 500:
                errorMessage = 'Could not resend the verification email, an internal server error occured. Please try again later.';
                break;
              default:
                errorMessage = 'An unknown error occured trying to resend the verification email. Please try again later.';
                break;
              }
              
              this.setState({
                isPopupOpen: true,
                sendingVerification: false,
                popupConfig: {
                  title: 'Error Resending Verification Email',
                  children: <p className='generic-popup-text'>{ errorMessage }</p>,
                  showClose: true,
                  onClose: () =>
                    this.setState({
                      isPopupOpen: false
                    } as Partial<AccountState>),
                }
              } as Partial<AccountState>);
            }}>{verificationButtonText}</button>
          </div>
        </div>
      </MainContainerContent>
    );
  }

  updateRendered(newElement: ReactElement) {
    if (this.mounted) {
      return this.setState({
        rendered: newElement
      });
    } 
    (this.state as AccountState).rendered = newElement;
  }

  render() {
    return (
      <>
        <ConfirmPopup {...this.state.popupConfig as ConfirmPopupConfig} open={this.state.isPopupOpen} />
        <MainContainer
          left={
            (
              <SideBar items={[
                {
                  text: 'Basic Information',
                  action: () => { 
                    this.updateRendered(this.basicInformation());
                  }
                },
                {
                  text: 'Change Email',
                  action: () => { 
                    this.updateRendered((
                      <>
                        <p>Change Email</p> 
                        <p>Change Email</p> 
                      </>
                    ));
                  }
                },
                {
                  text: 'Change Password',
                  action: () => { 
                    this.updateRendered((
                      <>
                        <p>Change Password</p> 
                        <p>Change Password</p> 
                      </>
                    ));
                  }
                },
                {
                  text: 'Logout',
                  action: function () { 
                    tokenStorage.delToken();
                    window.location.href = '/';
                  }
                }
              ]} />
            )
          }
          right={
            (
              <>
                {(this.state as AccountState).rendered}
              </>
            )
          } />
      </>
    );
  }
}

export default Account;
