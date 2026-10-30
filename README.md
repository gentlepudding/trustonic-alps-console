# ALPS Device Console

A local device management console built with React and TypeScript.
GraphQL requests use plain fetch and custom hooks. MSW provides the API.

## Run locally

```bash
npm ci
npm run dev
```

Open the address printed by Vite.

No backend service or credentials are required. MSW intercepts GraphQL
requests in development. Reloading the page resets the mock data.

Use the development server to try the application. The production preview
does not enable the mock API.

## Features

- Tenant switching with separate device sets.
- Debounced search by serial number or IMEI.
- State filtering and server-driven pagination.
- Independently loaded device details and paginated history.
- Optimistic device locking with rollback on failure.
- Shared request cache with deduplication, a 30-second TTL and reactive updates
  for independent consumers.

## Checks

```bash
npm run test
npm run lint
npm run format:check
npm run build
```

Three hook tests check response ordering, shared request deduplication, cache
updates across independent consumers, tenant isolation and subscriptions
surviving a refetch. See NOTES.md for the design trade-offs and remaining gaps.

## Useful scenarios

- Switch tenants while requests are pending.
- Select several devices quickly.
- Open SN-0000-POISON in Tenant Alpha to inspect partial GraphQL errors.
- Lock an unlocked device and check its row, details and history.
- Use Refresh list to reload filtered page boundaries after a state change.

See NOTES.md for implementation decisions and limitations.
