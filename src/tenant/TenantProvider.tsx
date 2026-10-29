import { useState } from 'react';
import type { ReactNode } from 'react';
import { TenantContext } from './TenantContext';
import type { TenantId } from './TenantContext';

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenantId, setTenantId] = useState<TenantId>('tenant-alpha');

  return (
    <TenantContext.Provider value={{ tenantId, setTenantId }}>
      {children}
    </TenantContext.Provider>
  );
}
