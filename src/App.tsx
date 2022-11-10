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
import './css/reset.css';
import './css/index.scss';
import Header from './components/Header';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login from './pages/Login';
import Create from './pages/Create';
import Packages from './pages/Packages';
import NotFound from './pages/NotFound';
import Support from './pages/Support';
import Account from './pages/Account';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/create' element={<Create />} />
        <Route path='/packages' element={<Packages />} />
        <Route path='/support' element={<Support />} />
        <Route path='/account' element={<Account />} />
        <Route path='*' element={<NotFound />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;