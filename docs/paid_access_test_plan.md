# True Vine OS Paid Access Test Plan

Status: local Stripe sandbox lifecycle validated; public test deployment pending sandbox ownership

## Boundary

Paid access is enforced by the True Vine OS server, not by the Android APK or
browser JavaScript. The APK contains no Stripe secret and cannot grant itself an
entitlement.

Server-generated voice audio has a direct provider/runtime cost, so it is
metered for free accounts and unlimited for paid accounts. The complete clock,
runtime state, Scripture, study tools, guided prompts, discussion handoff, and
local browser history remain free.

## Plans And Entitlements

| Plan | Included access | Optional Keycloak role | Stripe lookup key |
| --- | --- | --- | --- |
| Free | Complete clock and study experience; 3 generated voice requests per UTC day after sign-in | none | none |
| Starter | Free features plus unlimited generated voice | `truevineos_starter` | `truevineos_starter_monthly` |
| Pro | Starter access; future premium capabilities may be added only when implemented | `truevineos_pro` | `truevineos_pro_monthly` |
| Organization | Pro access and organization entitlement | `truevineos_org` | `truevineos_org_monthly` |

`truevineos_admin` receives organization-level access for operational testing.
Stripe webhooks are the normal billing source. The central billing service
verifies Stripe's raw-body signature and sends an HMAC-signed normalized event
to `POST /api/billing/fulfillment`; True Vine stores the resulting account
entitlement durably in `SOLOMONIC_BILLING_STORE_PATH`. Keycloak roles remain an
administrative/manual fallback. Only `active` and `trialing` states grant paid
access.

## Enforcement Modes

Set `SOLOMONIC_BILLING_ENFORCEMENT` to:

- `disabled`: preserve existing behavior while billing is unconfigured;
- `audit`: calculate and expose entitlement state but do not deny requests;
- `enforce`: enforce the free daily voice allowance and require an active paid entitlement for unlimited voice.

An invalid mode fails closed with HTTP 503. Production should remain in `audit`
until test Checkout and webhook fulfillment demonstrably grant and revoke
access.

## Same-Origin Billing Routes

- `GET /api/billing/catalog`
- `GET /api/billing/entitlement`
- `GET /api/billing/invoices`
- `POST /api/billing/checkout`
- `POST /api/billing/portal`
- `POST /api/stripe/webhook` (raw proxy to the central billing service)
- `POST /api/billing/fulfillment` (central-service HMAC only)

The browser and APK never receive Stripe API keys, the central-service API key,
the Stripe webhook secret, or the fulfillment secret.

## Test Endpoint

`GET /api/billing/entitlement` returns the current authenticated account's tier,
subscription status, enforcement mode, free feature list, daily generated voice
limit/usage/remaining values, and whether voice would be denied. It returns no
Stripe secret or payment data.

Local fake-auth testing is permitted only when `SOLOMONIC_DEV_FAKE_AUTH=true`:

```bash
curl -sS \
  -H 'X-Dev-Auth-Sub: paid-test-user' \
  -H 'X-Dev-Auth-Roles: truevineos_starter' \
  http://127.0.0.1:8086/api/billing/entitlement
```

## Promotion Gates

1. Run automated entitlement tests in `audit` and `enforce` modes.
2. Create or verify the three Prices in Stripe test mode.
3. Create Checkout Sessions server-side through the central billing service.
4. Verify webhook signatures and idempotent event handling.
5. Confirm an active test subscription grants the correct local entitlement.
6. Confirm cancellation and failed-payment policy remove or restrict access.
7. Exercise the Customer Portal and invoice history.
8. Switch deployed True Vine OS from `disabled` to `audit` and inspect results.
9. Confirm a signed-in free account receives three successful generated voice jobs, the fourth returns HTTP 429, and a failed upstream voice request refunds its reservation.
10. Switch to `enforce` only after paid, free, exhausted-free, and guest accounts behave correctly.

Do not enable Stripe Tax merely by setting `automatic_tax`; registrations must
be established for the jurisdictions where tax collection is required first.

## 2026-08-22 Sandbox Evidence

The isolated unclaimed sandbox completed the entire Starter lifecycle with
`livemode=false` before the usable-free-tier adjustment: free voice returned 402, Checkout charged the Stripe test card
$9.00, `checkout.session.completed` and `customer.subscription.created`
webhooks returned 200, local access became active, voice returned 202, one paid
invoice appeared, the Customer Portal cancelled immediately, the
`customer.subscription.deleted` webhook returned 200, and voice returned 402
again. Starter/Pro/Organization amounts in that sandbox are $9/$29/$99 monthly
fixtures only; they are not approved live prices.

The current free-tier contract supersedes that pre-adjustment denial: a
signed-in free account receives three generated voice jobs per UTC day by
default, configured with `SOLOMONIC_FREE_VOICE_DAILY_LIMIT`; paid accounts are
unlimited. Local HTTP verification returned 202 with remaining counts 2, 1,
and 0 for the first three free jobs, then returned 429 with
`free_voice_limit_reached` for the fourth request.
