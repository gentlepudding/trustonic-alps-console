import { DeviceConsole } from './components/DeviceConsole';
import { useTenant } from './hooks/useTenant';

export default function App() {
  const { tenantId, setTenantId } = useTenant();

  return (
    <main>
      <h1>ALPS Device Console</h1>

      <label>
        Tenant
        <select
          value={tenantId}
          onChange={(event) => {
            const value = event.target.value;

            if (value === 'tenant-alpha' || value === 'tenant-beta') {
              setTenantId(value);
            }
          }}
        >
          <option value="tenant-alpha">Tenant Alpha</option>
          <option value="tenant-beta">Tenant Beta</option>
        </select>
      </label>

      <DeviceConsole key={tenantId} />
    </main>
  );
}
