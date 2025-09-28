import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './context/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LostAndFoundPage from './pages/LostAndFoundPage';
import ReportItemPage from './pages/ReportItemPage';
import ItemDetailsPage from './pages/ItemDetailsPage';
import ProfilePage from './pages/ProfilePage';
import Header from './components/Header';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/lost-found" element={<LostAndFoundPage />} />
              <Route path="/report-item" element={<ReportItemPage />} />
              <Route path="/item/:id" element={<ItemDetailsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </main>
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
