# Strings — End-to-End Encryption Design

**Status: design only.** Messaging is **not** end-to-end encrypted in the current build.
This document is the approved scope for the future implementation batch.

## What is not implemented today

- Messages, voice notes, media, and calls are not E2EE.
- Data is protected by HTTPS in transit and by the database's at-rest protection, but
  the server can read message content while it is stored.
- The "Safety & encryption" screen (MSG-05) says this plainly. Do not change that copy
  until this document's plan is actually implemented and reviewed.

## Threat model

| Adversary | Impact today | After E2EE |
|---|---|---|
| Server compromise | Messages readable | Messages unreadable (no keys on server) |
| Network MITM | Prevented by HTTPS | Prevented by HTTPS + integrity check |
| Malicious recipient | Can leak received messages | Unchanged (out of scope) |
| Device theft | Depends on OS lock | Depends on OS lock + key protection |
| Backup exposure | Messages in plaintext | Depends on backup strategy (see below) |

## Recommended protocol

**Signal Protocol** (X3DH key agreement + Double Ratchet) via an audited library
such as `libsignal-client` or a fully reviewed implementation of the same spec.

Why this and not a homegrown scheme:
- Forward secrecy (a leaked long-term key does not decrypt past messages).
- Post-compromise security (the session heals after key compromise).
- Multi-device, multi-session, asynchrony (recipients can be offline).
- Widely studied. "Do not roll your own crypto" is non-negotiable.

## Key lifecycle

1. **Registration** — device generates an identity key pair (long-term Ed25519 or
   Curve25519). Public half is uploaded; private half stays on the device.
2. **Prekey bundle** — device also generates a signed prekey and a batch of one-time
   prekeys. Server stores only the public halves.
3. **Session establishment (X3DH)** — sender fetches the recipient's prekey bundle
   and derives a shared secret; a Double Ratchet session begins.
4. **Ratchet** — each message advances the ratchet; a new key per message.
5. **Prekey replenishment** — the server tracks remaining one-time prekeys; the client
   uploads new ones as the pool drains.

## Multi-device

Each device is a separate identity. A message from Alice to Bob fans out to Bob's
devices: the sender derives one session per device. This is exactly how Signal and
WhatsApp work. Adding a device does not compromise existing sessions.

## Backup and recovery

Two options, both must be decided before implementation:

**Option A (recommended for privacy):** No server-side backup. Local backup via
OS-level encrypted backup (iOS Keychain / Android Keystore). Losing the device loses
the history. Users are warned during onboarding.

**Option B (recommended for usability):** Encrypted backup with a passphrase the user
sets. The server stores ciphertext + KDF salt; the passphrase never leaves the client.
Recovery from a new device requires the passphrase.

Do not silently choose one. This is a security-relevant product decision.

## What this means for messaging UI

- **MSG-05 "Safety & encryption"** shows one of:
  - "Encryption: not implemented in this build" (today)
  - "Encryption: active. Verify safety numbers with your contact."
- Safety numbers / QR verification requires a live session key — only after implementation.
- **Read receipts** and **typing indicators** leak metadata. They are server-visible
  even under E2EE. UI should acknowledge this once implemented.

## What is not E2EE by design

- **Group calls**: transported over LiveKit's SFU (WebRTC DTLS-SRTP). Server sees
  streams. If group E2EE is required, insert an encryption layer (SFrame or a client-side
  insertable-streams transformer) — separate design.
- **1:1 calls**: default WebRTC uses DTLS-SRTP (end-to-end between peers unless a TURN
  relay is used; in that case TURN sees only ciphertext).
- **Status updates**: current implementation is server-side. If E2EE is required,
  same encryption layer as messaging.

## Implementation phases

1. **Library selection + audit** — choose `libsignal-client` or equivalent. Review
   version pinning and supply chain.
2. **Key storage** — platform keychain (iOS Secure Enclave, Android Keystore, browser
   IndexedDB with hardware-backed wrapping where available).
3. **Backend prekey endpoints** — `/api/e2ee/prekey-bundle`, `/api/e2ee/identity`.
4. **Client session layer** — encrypt/decrypt before send/receive; wrap the message
   API payloads.
5. **Verification UI** — safety numbers, QR, "keys changed" banner.
6. **Migration** — existing plaintext messages are marked as such; new messages use E2EE.
7. **Security review** — external review before any E2EE claim is made in marketing or UI.

## Timeline in the current build

- **Today**: honest UI. No claim of E2EE.
- **Batch X (future)**: library selection + key storage + backend endpoints.
- **Batch Y**: client session layer + verification UI.
- **Batch Z**: external review + activation.

Do not shorten this without a written security decision.
