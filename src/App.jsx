import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import MoomooUsCalculator from './pages/MoomooUsCalculator';
import BursaCalculator from './pages/BursaCalculator';
import SavedTrades from './pages/SavedTrades';
import Settings from './pages/Settings';

/**
 * Main application routing index.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/moomoo-us" element={<MoomooUsCalculator />} />
          <Route path="/bursa" element={<BursaCalculator />} />
          <Route path="/saved-trades" element={<SavedTrades />} />
          <Route path="/settings" element={<Settings />} />
          {/* Fallback redirection */}
          <Route path="*" element={<Home />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
