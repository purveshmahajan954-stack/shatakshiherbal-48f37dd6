---
name: CKShip payload quirks
description: Confirmed working payload rules for CKShip /api/shipment/add-update endpoint
---

# CKShip Payload Quirks

**Why:** CKShip API has non-obvious per-type rules confirmed by the account owner.

## Endpoint
Always use `/api/shipment/add-update` — `/api/shipment/create` returns 404.

## address_id
Differs by payment type:
- Prepaid → `335`
- COD → `195`

## parcel_type
- `1` = Prepaid
- `0` = COD

## collectable_amount
- **Prepaid**: DO NOT send this field at all
- **COD**: Send as string, e.g. `"499"` (the order total)

## shipment_weight_unit
Must be the weight value repeated as a string. e.g. `shipment_weight: 50` → `shipment_weight_unit: "50"`.

## dimension units
Always `"cm"` as string.

**How to apply:** Any change to `server/ckship.ts` or `shipping/server.js` shipment payload must follow these exact rules.
