---
name: CKShip payload quirks
description: Confirmed working payload rules for CKShip /api/shipment/add-update endpoint
---

# CKShip Payload Quirks

**Why:** CKShip API behavior differs from its own docs. These rules are confirmed from live API responses.

## Endpoint
Always use `/api/shipment/add-update` — `/api/shipment/create` returns 404.

## address_id
Always use `335` for ALL shipment types (prepaid and COD both).
- `195` was tried for COD but returns `404 {"message":"Pickup address not found."}`.

## parcel_type
- `1` = Prepaid
- `0` = COD

## collectable_amount
CKShip always requires this field — even for prepaid (parcel_type=1).
- **Prepaid**: Send `"0"` (string)
- **COD**: Send the order total as string, e.g. `"499"`
- Omitting it for prepaid causes `422 {"errors":{"collectable_amount":["The collectable amount field is required."]}}`

## shipment_weight_unit
Must be the weight value repeated as a string, e.g. if `shipment_weight: 200` then `shipment_weight_unit: "200"`.

## dimension units
Always `"cm"` as string.

**How to apply:** Any change to `server/ckship.ts` or `shipping/server.js` shipment payload must follow these exact rules.
