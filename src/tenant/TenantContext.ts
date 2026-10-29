import { createContext } from 'react';

export type TenantId = 'tenant-alpha' | 'tenant-beta';

export type TenantContextValue = {
  tenantId: TenantId;
  setTenantId: (tenantId: TenantId) => void;
};

export const TenantContext = createContext<TenantContextValue | undefined>(
  undefined,
);
