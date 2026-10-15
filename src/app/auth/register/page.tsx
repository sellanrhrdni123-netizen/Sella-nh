'use client';

import React from 'react';
import RegisterPage from '@/app/register/page';
import DevOTPBanner from '@/components/auth/DevOTPBanner';

/**
 * Route Alias & Auth Flow: /auth/register
 * Resolves /auth/register cleanly per R5 & M5 specifications.
 * Includes floating Dev OTP Simulator banner showing active test OTP: 456123.
 */
export default function AuthRegisterPage() {
  return (
    <>
      <RegisterPage />
      <DevOTPBanner currentOtp="456123" targetPhone="+6281234567890" />
    </>
  );
}
