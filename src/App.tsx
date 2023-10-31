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
import './css/reset.css';
import './css/tailwind.css';
import './css/index.scss';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';
import Login from './pages/Login';
import Create from './pages/Create';
import Packages from './pages/Packages';
import NewPackage from './pages/NewPackage';
import NotFound from './pages/NotFound';
import Support from './pages/Support';
import Account from './pages/Account';
import PackageInformation from './pages/PackageInformation';
import Tools from './pages/Tools';
import Verify from './pages/Verify';
import Upload from './pages/Upload';
import Details from './pages/Details';

declare global {
  interface Window {
    grecaptcha: ReCaptchaV2.ReCaptcha;
    SITE_KEY: string;
    REGISTRY_URL: string;
  }
}

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/create' element={<Create />} />

        <Route path='/support' element={<Support />} />
        <Route path='/account' element={<Account />} />
        <Route path='/tools' element={<Tools />} />

        <Route path='/packages' element={<Packages />} />
        <Route path='/packages/package' element={<PackageInformation />} />
        <Route path='/packages/details' element={ <Details />} />
        <Route path='/packages/new' element={<NewPackage />} />
        <Route path='/packages/upload' element={<Upload />} />
        
        {/* We use /verify twice because /verify/ is not caught by /verify/:verificationToken */}
        <Route path='/verify' element={<Verify />} />
        <Route path='/verify/:verificationToken' element={<Verify />} />
        
        <Route path='*' element={<NotFound />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;