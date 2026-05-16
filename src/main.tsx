import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import { Marketplace } from './pages/Marketplace.tsx';
import { Profile } from './pages/Profile.tsx';
import { Notifications } from './pages/Notifications.tsx';
import { Support } from './pages/Support.tsx';
import { Subscription } from './pages/Subscription.tsx';
import { Community } from './pages/Community.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/explore" element={<Marketplace />} />
          <Route path="/community" element={<Community />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/support" element={<Support />} />
          <Route path="/subscription" element={<Subscription />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
