'use client';

import React from 'react';
import LaporanPage from '../laporan/page';

/**
 * Route Alias: /dashboard/reports -> renders native reports component (/dashboard/laporan)
 * Guarantees HTTP 200 without 404 per specification R3 & M4.
 */
export default function ReportsAliasPage() {
  return <LaporanPage />;
}
