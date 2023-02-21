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

import Header from './components/Header';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login from './pages/Login';
import Create from './pages/Create';
import Packages from './pages/Packages';
import Upload from './pages/Upload';
import NotFound from './pages/NotFound';
import Support from './pages/Support';
import Account from './pages/Account';
import Edit from './pages/Edit';
import Footer from './components/Footer';
import Incompatibility from './pages/Incompatibility';
import Tools from './pages/Tools';
import Verify from './pages/Verify';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/create' element={<Create />} />
        <Route path='/packages' element={<Packages />} />
        <Route path='/packages/upload' element={<Upload />} />
        <Route path='/support' element={<Support />} />
        <Route path='/account' element={<Account />} />
        <Route path='/edit' element={<Edit />} />
        <Route path='/incompatibility' element={<Incompatibility />} />
        <Route path='/tools' element={<Tools />} />
        
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