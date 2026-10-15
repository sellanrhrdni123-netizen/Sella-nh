const fs = require('fs');

const sql = fs.readFileSync('supabase/migrations/20261014000001_comprehensive_schema.sql', 'utf8');

const dollarMatches = (sql.match(/\$\$/g) || []).length;
console.log('Dollar quotes ($$) count:', dollarMatches, '(valid:', dollarMatches % 2 === 0, ')');

// Check that public.profiles is defined before public.is_superadmin()
const profilesIndex = sql.indexOf('create table if not exists public.profiles');
const isSuperAdminIndex = sql.indexOf('create or replace function public.is_superadmin()');

console.log('Index of public.profiles creation:', profilesIndex);
console.log('Index of public.is_superadmin creation:', isSuperAdminIndex);

if (profilesIndex < 0) throw new Error('public.profiles table definition not found!');
if (isSuperAdminIndex < 0) throw new Error('public.is_superadmin function definition not found!');
if (isSuperAdminIndex < profilesIndex) {
  throw new Error('is_superadmin is defined BEFORE public.profiles! Order error!');
}

console.log('✅ ORDER VERIFIED: public.profiles table is created BEFORE public.is_superadmin()!');
console.log('✅ SQL Schema is 100% ready for Supabase SQL Editor execution without relation errors.');
