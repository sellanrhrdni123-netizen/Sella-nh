'use client';

import React from 'react';
import LoginPage from '@/app/login/page';
import DevOTPBanner from '@/components/auth/DevOTPBanner';

/**
 * Route Alias & Auth Flow: /auth/login
 * Resolves /auth/login cleanly per R5 & M5 specifications.
 * Includes floating Dev OTP Simulator banner showing active test OTP: 789123.
 */
export default function AuthLoginPage() {
  return (
    <>
      <LoginPage />
      <DevOTPBanner currentOtp="789123" targetPhone="+6281234567890" />
    </>
  );
}
