# Implementation notes

## Request ordering and cancellation

Each useQuery instance assigns an increasing ID to its requests.
Only the latest request may update its snapshot, errors and loading state.

Identical requests share a cached Promise. Each consumer has a release
function; the underlying request is aborted only when no consumers remain.
Explicit invalidation can cancel all consumers of a matching query key.

## Tenant isolation

TenantContext is the source of tenantId. useTenantQuery and
useTenantMutation inject it after caller-provided variables, including
when replace is true.

Cache keys contain the query document and serialized variables, including
tenantId. DeviceConsole is keyed by tenantId, so switching tenants removes
the previous local state and releases its pending queries immediately.
Cached responses for other tenants may remain in memory but are not
used for the new tenant.

## Cache policy

The TTL is 30 seconds from successful response completion. It avoids
repeated requests during short navigation sequences while limiting reuse
of older results.

Expired entries revalidate on the next acquisition. There is no background
timer. Explicit refetch requests fresh data, or joins an identical request
already in flight. Network failures and responses without usable data are
not retained for reuse.

## Optimistic locking

useDeviceLock lives in DeviceConsole. Both the list and detail panel read
its per-device state overrides.

Locking immediately displays LOCKED with a pending indicator. On failure,
the previous override is restored and the error is displayed. On success,
the list cache is updated and the affected detail and history queries are
invalidated. Their components reload without automatically refetching
the device list.

I chose a shared override layer over normalized entity storage or
independent optimistic updates in each component. It keeps rollback in
one place and avoids duplicating the mutation logic.

The cache does not notify subscribers. The parent state update triggers
a render, during which useQuery reads the updated cached response.

## Partial GraphQL responses

Data and GraphQL errors are retained independently. The detail panel
renders available fields with warnings; null fields display Unavailable.
A partial response does not blank the panel.

## Query keys and entity invalidation

The cache identity is the query document plus its variables. Logical
queryKey tags group list pages and identify a device's detail and history.

List updates inspect cached query variables and rows. A general
entity-invalidation API would need an index from tenant and entity ID
to affected cache keys.

## Search

The mock combines IMEI and serial-number filters using AND. The UI
therefore provides an explicit search-field selector rather than sending
the same text to both arguments.

## Validation

The automated renderHook test controls response order through MSW rather
than random delays. It also verifies that two consumers share the older
request.

Rollback was checked manually using a temporary one-use failing handler.
That handler was removed afterwards.

## Limitations and next steps

- Removing a device from a filtered page can leave that page shorter.
  Cached page boundaries are not fully redistributed. Refresh list
  explicitly reloads the page.
- Cached queries that gain a matching device are invalidated rather than
  inserting it at an assumed server position. An already mounted view
  requires an explicit refresh.
- The optimistic override changes state only. Other list fields, including
  last check-in, retain their last fetched values until the list refreshes.
- Further checks should cover concurrent list requests during mutations,
  TTL expiry, shared cancellation and tenant changes during mutations.
- No cache eviction, normalization, subscriptions, background revalidation,
  retries, authentication or persistence were added.

## Tooling

MSW 2 is pinned to match the supplied mock API. The gqlError helper has an
explicit response-body type; its runtime behaviour is unchanged.

The set-state-in-effect rule is disabled only for useQuery. The hook
deliberately sets loading when starting a request from an effect, accepting
the additional render to keep the implementation straightforward.

## Assistance

AI assistance was used for implementation examples, debugging, test design
and explanations.
