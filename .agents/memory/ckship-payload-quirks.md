---
name: CKShip payload quirks
description: Confirmed working payload rules for CKShip /api/shipment/add-update endpoint
---

# CKShip Payload Quirks

**Why:** CKShip API behavior differs from its own docs. These rules are confirmed from actual working payloads.

## Endpoint
Always use `/api/shipment/add-update` — `/api/shipment/create` returns 404.

## address_id
Different values depending on payment type:
- Prepaid → `335`
- COD → `195`

## parcel_type
- `1` = Prepaid
- `0` = COD

## collectable_amount
- **Prepaid**: Omit entirely (do NOT send `"0"` — causes validation errors)
- **COD**: Send as string, e.g. `"499"`

## shipment_weight_unit
Must be the weight value repeated as a string, e.g. if `shipment_weight: 50` then `shipment_weight_unit: "50"`.

## dimension units
Always `"cm"` as string.

**How to apply:** Any change to `server/ckship.ts` or `shipping/server.js` shipment payload must follow these exact rules.
