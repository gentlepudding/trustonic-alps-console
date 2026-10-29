import { useContext } from 'react';
import { TenantContext } from '../tenant/TenantContext';
import type { TenantContextValue } from '../tenant/TenantContext';

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);

  if (context === undefined) {
    throw new Error('useTenant must be used within TenantProvider');
  }

  return context;
}
