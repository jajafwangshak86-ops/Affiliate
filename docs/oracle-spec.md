# Oracle API Specification

## Base URL

`http://localhost:3001` (development)

## Endpoints

### `GET /health`

Returns oracle service status.

**Response**
```json
{ "status": "ok" }
```

---

### `POST /sale`

Submit a verified sale event for on-chain payout.

**Request Body**
```json
{
  "saleId": "hex string (32 bytes)",
  "affiliate": "Stacks principal address",
  "campaignId": 1,
  "amount": 10000000,
  "signature": "hex string — secp256k1 signature of sha256(saleId+affiliate+campaignId+amount)",
  "merchantPubkey": "hex string — merchant's compressed public key (33 bytes)",
  "tokenContract": "SP...contract-address.token-name"
}
```

**Response — 200**
```json
{ "txid": "0x..." }
```

**Response — 400** Missing fields  
**Response — 401** Invalid signature  
**Response — 409** Duplicate sale  
**Response — 500** Broadcast error  

## Signing Spec

The merchant plugin signs:

```
sha256(saleId_bytes + affiliate_utf8 + campaignId_string + amount_string)
```

Using secp256k1. The oracle verifies this signature before signing its own attestation for the Stacks contract.

The oracle's attestation uses the same message format, signed with the oracle private key. The Stacks contract recovers the signer via `secp256k1-recover?` and compares against the stored oracle pubkey.
