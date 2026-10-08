// ============================================================================
// GOLD PLATFORM — MAIN APPLICATION COMPONENT
// ============================================================================
// المكون الرئيسي — يربط AuthContext بـ AppRouter مع نظام الصلاحيات الكامل

import React from 'react';
import { AuthProvider } from './AuthContext';
import GoldAppRouter from './AppRouter';
import './globals.css';

const GoldApp: React.FC = () => {
  return (
    <AuthProvider>
      <GoldAppRouter />
    </AuthProvider>
  );
};

export default GoldApp;
