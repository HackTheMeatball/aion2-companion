# Sync design (0.4 S0, old Y0)

Status: **proposed**, waiting on the owner (§6). Docs only: no code, no account, no service contacted, no web fetch.
Inputs: docs/ARCHITECTURE.md §1 ("Change times and `merge()`"), docs/DATA-FORMAT-V2.md §13, PRIVACY.md, the v5 save
plan `docs/plans/0.4/P3c-save-v5.md`, `src/core/sync.js` (at `706e8a8`), DECISIONS ("Accounts / sign-in": no accounts,
an anonymous, end-to-end encrypted sync code), review note 5 on #134.

Builds from this: **0.6 lane C** (sync client on `merge()`, against a fake server, no UI) and **0.7 lane C** (server and
UI). Words: **device** = one browser profile on one address; **cloud copy** = the one encrypted object on the server;
**synced part** = what `syncedPart()` returns (§2).

## 1. Model

**No accounts, no email, no sign-in.** Sync is off until the player turns it on. Turning it on makes a **sync code** on
the device; that code is the only secret. Whoever has the code can read and change the cloud copy; nobody else can,
including the server and its operator.

**The code.** 16 bytes from `crypto.getRandomValues` (128 bits), written in Crockford base32 (26 symbols, no `I L O U`,
case-insensitive, `-` and spaces ignored on input) plus one Crockford check symbol (mod 37), shown in groups:
`DC1-7M2QK-9XH4T-B0RZD-W8JNC-6PF3V-E` (`DC1` = code format 1, not secret). The check symbol catches a typo on the device,
before any request. The code is random, never chosen by the player and never derived from the name, class, level or
slot id, so a slow password hash buys nothing: 2^128 guesses are out of reach either way.

**Key derivation** (all WebCrypto, no library): HKDF-SHA-256 with `ikm` = the 16 code bytes, `salt` = the ASCII bytes
`daeva-companion sync v1`, and three `info` strings, each giving an independent value:

| `info` | Length | Used as |
|---|---|---|
| `id` | 16 bytes | **sync id**: base64url, 22 characters; the server's only name for the cloud copy |
| `enc` | 256 bits | **content key**: AES-256-GCM, imported non-extractable (`extractable: false`), never leaves the device |
| `auth` | 32 bytes | **write token**: sent as `Authorization: Bearer <base64url>`; the server keeps only `SHA-256(token)` |

The id and the token reveal nothing about the content key (HKDF outputs with different `info` are independent), so the
server, holding the id and the token's hash, still can't decrypt.

**Encryption.** AES-256-GCM, a fresh 96-bit IV from `crypto.getRandomValues` on every upload, 128-bit tag. Additional
authenticated data = `dc-sync|1|<sync id>`, so a cloud copy moved to another id fails to decrypt. Envelope (binary,
`application/octet-stream`): 1 byte format version (`0x01`), 1 byte flags (bit 0 = gzip), 12 bytes IV, ciphertext + tag.
Plaintext: the synced part as JSON (§2), gzip-compressed with `CompressionStream` where the browser has it (flag bit 0;
browser support to verify against a support table in lane C), then padded with zero bytes after a 4-byte length prefix
to the next multiple of 4 KiB, so the size says little about how far a character is. Compressing first is safe here:
nothing in the plaintext is attacker-controlled.

**Where the code lives.** Its own `localStorage` key `companion-sync-v1` (`{ code, lastSyncAt, etag }`), next to the save,
not inside it: P3c's v5 shape stays untouched (no-go), and the code is never in an Export file, the *Report a problem*
link, a URL or a log. Export files can be shared; the code must not travel with them.

**Lose the code = lose the cloud copy.** There is no reset and no recovery, by design: the server can't tell whose copy
is whose, and nobody can decrypt it without the code. Progress on any device that still syncs stays on that device; it
can show its code again ("Show sync code") or make a new one ("New sync code": a new id; the old copy is deleted with its
token, which this device still has). If every device has lost the code, the old copy expires (§4 retention). The UI shows
the code once at creation with "Save this code (a password manager works). Without it, the cloud copy can't be opened."
and a "Copy" button, and asks the player to type the last group back before sync starts.

**A second device joins** with "Use a sync code": type (or paste) the code → check symbol → derive id, key, token →
`GET`. Then:

- **404**: "No cloud copy for this code. Check the code." Nothing is created and nothing local changes.
- **Decrypt fails** (a wrong code lands on another existing id with odds of about 2^-128, so in practice this means a
  damaged copy or an unknown envelope version): "This code doesn't open the cloud copy." The cloud copy is never overwritten after a failed decrypt.
- **Opens:** the joining device has no progress of its own (`hasProgress` false for every slot) → it **adopts** the
  cloud copy's synced part (its own default slot is dropped, not merged, see §2 "Slots on join"). It has progress → it
  asks: "Keep both" (merge: both devices' characters, §2) or "Use the cloud copy" (adopt; the local save first goes to
  `:before-import`, as Import does).

Sync then runs by itself: on load, 30 s after a progress save (debounced), on `visibilitychange` to hidden, on the
`online` event, and from a "Sync now" button. It never blocks the page and never stops local saves.

## 2. Merge

**What travels:** the whole v5 save's synced part, every slot. The plaintext is
`{ "format": "dc-sync", "v": 5, "savedAt": …, "flags": {…}, "chars": { "<slot id>": { …character… } } }`. Every slot
carries its `mt` change times and its `id`, `pack`, `class`, `name`, `created`.

**Stays on the device, never in the payload:** the view settings (`mode`, `open`, `hide`, `hideCards`, `hideOpt`,
`areaLv`, …: owner decision Q2), `backup` (this browser's backup times, 0.2.5), `current` (which character this device
shows), the local-only character fields (`dvLast`, `dvLastAt`), `:before-import`, and the sync key itself.

**One round** (`syncOnce`, pure apart from `fetch` and storage, injectable for tests):

1. `GET` → ciphertext + `ETag` (or 404 on the first upload).
2. Decrypt, parse, check `format` and `v`. A `v` newer than this build reads: stop, "Update the app to sync" (reload
   picks up the new build); nothing is written either way.
3. `merged = merge(local, remote)`: **per slot id** (P3c): a slot on one side only is kept; a slot on both sides merges
   per item by change time (DATA-FORMAT-V2 §13.2–13.3: the later stamp wins, tombstones survive, one-time flags OR).
   View settings come from `local` (the remote has none).
4. Store `merged` locally if it differs from `local` (one `storeState()`; `stampSave` adds no stamps because nothing
   was edited, so `savedAt` follows the merge rule).
5. If `syncedPart(merged)` differs from the remote's: encrypt and `PUT` with `If-Match: <ETag>` (first upload:
   `If-None-Match: *`). **412** (another device uploaded in between) → go back to 1, at most 3 times, then wait for the
   next trigger. Because `merge()` is commutative, associative and idempotent, every order of rounds ends in the same
   synced part on every device once each has synced after the last edit.

**Correctness rests on what `merge()` already guarantees** (the `core` suite): un-ticks survive (per-item change time,
owner decision Q1), a device with a slow clock still wins with a newer edit (per-item Lamport bump), a fresh device's
default story position never resets another's (story tie-break). One condition is new for sync: the quest register's
tie-break reads the build's `QUESTS` order, so two devices on different data versions can pick different winners for
an equal-time story stamp. They converge once both run the same build; the payload carries no build id (§3), so the
client simply re-syncs on load after an update.

**Findings for the planner** (no change to the v5 shape here; P3c owns it):

- **F1 `syncedPart()` per slot.** Today it returns one character's fields at the top level. With v5 it must return
  `{ v, savedAt, flags, chars }` with `current`, view settings and `backup` left out. Function change in
  `src/core/sync.js` (P3c or 0.6 lane C), not a shape change.
- **F2 `name` needs a change time.** The name (0.5 lane C) must be a timed register in `mt` (`SYNC_REGS` gets
  `name`), or a rename on one device is lost or flip-flops. `id`, `pack`, `class`, `created` never change after the slot
  is made; merge keeps the local value and the core suite checks both sides agree.
- **F3 Deleting a character resurrects it.** "A slot on one side only is kept" means a slot deleted on device A comes
  back from the cloud copy. 0.5 lane C (if the switcher can delete) or 0.6 lane C needs a dated slot tombstone (for
  example `chars[id] = { id, deletedAt }`, or a top-level `mt.chars{id}`). That **is** a save-shape addition: a decision
  for the planner before 0.5 lane C, not taken here.
- **F4 Slots on join.** A fresh browser makes its own random slot id, so a plain merge on join would add an empty
  `assassin-lvl1` character next to the synced one. §1's adopt rule avoids it; lane C's tests pin it.

## 3. Privacy

**Requirement (review note 5 on #134):** the player name and the save label (`<name>-<class>-lvl<level>`) travel only
inside the encrypted payload. The server sees an opaque sync id, ciphertext, its size and times; no name, label, class,
level or pack id in a URL, header, file or object name, log line or metric.

Every place a name or label could leak, and what prevents it:

| Place | What it carries | How the design keeps names, labels, class, level and pack id out |
|---|---|---|
| URL (path, query) | `/v1/s/<sync id>` only, no query string | The id is an HKDF output of the random code, never of the name, class, level or slot id; the client builds the URL from the id alone. The code is never in a URL (no join links in 0.6/0.7; a later QR or link must use the `#` fragment and remove it with `history.replaceState`). |
| Request headers | `Authorization: Bearer <token>`, `Content-Type: application/octet-stream`, `If-Match` / `If-None-Match` | No custom headers (no app version, pack, class or level header). `fetch` with `credentials: "omit"` (no cookies) and `referrerPolicy: "no-referrer"`. The browser adds `Origin` (the site's address): not personal, the same for every player. |
| Response headers | `ETag` (opaque), `Content-Length` | The server sets no other header from stored data. |
| Body | AES-GCM ciphertext, padded to 4 KiB steps | Names, labels, slot ids, `pack`, `class`, `level` sit only in the plaintext. Padding hides the exact size; times of uploads stay visible (inherent). |
| Object / file / key name in the store | the sync id | No other naming input exists on the server. Metadata stored with the object: `SHA-256(token)`, created / updated / last-read time, size. |
| Server log lines | method, route template (`/v1/s/:id`), status, size bucket | The handler logs nothing else and never the id, body, token or IP; the platform's own request logs are turned off or set to the shortest retention the host allows (owner setting, §5), and PRIVACY.md says what remains. |
| Metrics | counts per status code and size bucket, stored-object total | No per-id metric, no label dimensions. |
| Error reports | none | No error-reporting service on client or server. Server errors return a fixed message; client errors stay on the page ("Sync failed, will retry"). Exceptions are never logged with the payload. |
| *Report a problem* link | today's fields only | Sync adds nothing to it: not the code, the id, "sync on" or any sync status. A `site` check pins the link's fields. |
| Export file, storage keys | P3c: `companion-save-<date>.json`, `companion-save-v5` | The sync key `companion-sync-v1` has no name in it, and the code is never written into an export. |
| Browser console | nothing | The sync module never logs plaintext, the code, the token or the key. |

Not hidden, by nature: the IP address of each request (needed to answer it; rate limits keep counters by IP in memory
or in a short-lived store, §4), the times of uploads and reads, the padded size, and that one id keeps coming back.

**PRIVACY.md changes** (in the 0.7 PR that ships sync UI, before it goes live, per its own "Changes" promise):

- Short version: "Your progress stays in your browser" gains "unless you turn on sync".
- New section **Sync (optional, off by default)**: what is sent (an encrypted copy of your progress, including any
  character names, made with a code only your devices hold); what the server sees (a random sync id, the encrypted data,
  its rough size, when it was written and read, and the IP address of each request); who runs it (the host from §5, with
  its privacy policy link); retention (deleted after N days unused, §6); "Delete cloud copy" in the app; "If you lose
  the code, nobody can open or find the copy, including us; it is deleted after N days unused".
- "What is stored": the new key `companion-sync-v1` and that it holds the sync code.
- "Requests to other sites": the sync host's address, only while sync is on.

## 4. Server

Small, dumb, content-blind: it stores bytes under an id and never parses them.

| Request | Behaviour |
|---|---|
| `GET /v1/s/{id}` | 200 + body + `ETag`, or 404. Needs the bearer token (401 on mismatch); updates last-read time at most once a day. |
| `PUT /v1/s/{id}` | Create: `If-None-Match: *` → stores `SHA-256(token)`, 201. Update: `If-Match: <etag>` + matching token → 200 + new `ETag`; stale etag → 412; wrong token → 401; no precondition → 428. |
| `DELETE /v1/s/{id}` | Matching token → object and metadata removed, 204 (also 204 when already gone). |
| anything else | 404, fixed body. `OPTIONS` answers CORS for the allowed origins only (`https://daevacompanion.com`; the artifact origin only if §6 says so). |

- **Validation:** `id` must match `^[A-Za-z0-9_-]{22}$`, token `^[A-Za-z0-9_-]{43}$`; anything else 400 before any
  store access. Token compare in constant time.
- **Size limits:** body ≤ 256 KiB (a fully played Lv 45 character is ~25 KB of `mt` uncompressed, DATA-FORMAT-V2 §13.3;
  eight characters still fit uncompressed); 413 above. Body must be a multiple of 4 KiB plus the 14-byte header and
  16-byte tag, else 400 (catches a client that forgot to encrypt or pad).
- **Retention:** an object neither read nor written for **180 days** (recommended, owner decision §6) is deleted. The
  client refreshes it by syncing; a device that only reads does a no-change `PUT` once the last write is 30 days old.
- **Abuse limits** (numbers are starting points, tuned in 0.7): per IP 60 requests / 10 min and 5 new ids / day; per id
  1 `PUT` / 10 s and 500 `PUT` / day; 429 with `Retry-After`. A total-storage ceiling (for example 1 GiB) above which new
  ids get 507 and the owner gets the host's usage alert. No account means nothing to ban but IPs and ids.
- **Deletion on request:** "Delete cloud copy" in the app sends `DELETE`. Someone who lost the code can't prove the copy
  is theirs, and the operator can't find it (no names, no emails): it goes at the retention limit. PRIVACY.md says so.
- **No backups** of the store beyond what the host does itself; no copy of bodies anywhere else.

## 5. Hosting options

Expected scale (assumption, to revisit at 0.7): up to ~1,000 players with sync on, 2 devices each, ~10 syncs per device
per day (~20,000 requests/day, ~600,000/month), objects of 4–32 KiB (≤ ~32 MiB stored). Every price below is **to
check** on the provider's pricing page (no price from memory, no fetch in this run); a cloud research session may fill
them in under the fetching rules and add its fetch log here.

| | A. Cloudflare Workers + R2 (or Durable Objects) | B. Deno Deploy + Deno KV | C. AWS Lambda (function URL) + DynamoDB |
|---|---|---|---|
| Account | the owner's existing Cloudflare account (it holds both domains, DECISIONS D1c); a Workers subdomain or `sync.daevacompanion.com` route | a new Deno Deploy account (GitHub sign-in) | a new AWS account (payment card at sign-up) |
| Conditional write (§2 step 5) | R2 conditional `put` on etag, or one Durable Object per id (strongly consistent); **not** Workers KV alone (eventually consistent): to confirm in the docs | Deno KV `atomic().check()` on a versionstamp: to confirm in the docs | DynamoDB `ConditionExpression`: to confirm in the docs |
| Retention | R2 object lifecycle rule or a scheduled Worker (cron trigger) | `expireIn` on writes, or a scheduled job (to confirm) | DynamoDB TTL attribute |
| Logs | Workers logs can be off; to check what Cloudflare keeps by default | to check | CloudWatch log group with a short retention |
| Cost at the expected scale | to check: <https://developers.cloudflare.com/workers/platform/pricing/>, <https://developers.cloudflare.com/r2/pricing/>, <https://developers.cloudflare.com/durable-objects/platform/pricing/> | to check: <https://deno.com/deploy/pricing> | to check: <https://aws.amazon.com/lambda/pricing/>, <https://aws.amazon.com/dynamodb/pricing/> |
| Upside | one vendor for DNS, domains and sync; same edge as a later move to Cloudflare Pages (D2) | simplest code (KV and server in one runtime) | most mature conditional writes and TTL |
| Downside | Durable Objects pricing and plan requirements to check | one more vendor; free-tier limits to check | most setup; a card on file, so a bill can run on |

Without a conditional write the design still converges (a lost upload is repaired by the next round of the device whose
items are missing, because `merge()` is idempotent), but read-after-write is then not guaranteed and tests get flaky:
lane C should require one.

The URLs above are from the provider's known site structure, not fetched; the research session confirms each URL and
price and logs the fetch. Metabot's non-commercial condition (DECISIONS) is untouched: sync is free, no tier, no
donations; the owner pays any hosting cost.

## 6. Owner decisions

| # | Decision | Recommendation | Blocks |
|---|---|---|---|
| S1 | **Hosting** (§5) | **A**, Cloudflare Workers + R2 (Durable Objects if R2's conditional write falls short), on `sync.daevacompanion.com`, in the existing Cloudflare account | **0.6 lane C** (the client's request and conflict code follow the host's conditional write) |
| S2 | **Money**: who pays, the ceiling | Owner pays; stay inside the free tier if the checked prices allow it, with a usage alert and the storage ceiling (§4) as the hard stop; no card-backed auto-scaling beyond it | 0.7 (server); decided with S1 |
| S3 | **Retention** of an unused cloud copy | 180 days since last read or write | 0.7 (server, PRIVACY.md) |
| S4 | **Artifact build** (claude.ai) | **Site only.** The artifact build gets no sync code or UI (`@web-only`), like the 0.2.5 save-safety UI. Whether a claude.ai artifact may call an outside origin at all is unverified: owner check in a test artifact if this is ever wanted | no (the default holds until the owner says otherwise) |
| S5 | **Code shown once vs. "Show sync code" later** | Allow "Show sync code" on a device that syncs (losing the code is the bigger risk than someone reading the screen) | 0.7 (UI) |

Per the plan, these go to the tracker as a To-do only when 0.6 lane C is next.

## 7. Tests the build items will need

**Client (0.6 lane C: `core` unit tests with a fake `fetch` and a fake server in memory; one browser suite in 0.7):**

- **Merge over the wire:** two simulated devices, one fake server. A ticks `rq:…`, syncs; B syncs, un-ticks it later,
  syncs; A syncs: both have the un-tick and byte-identical `syncedPart`. Same with B's clock 1 h behind (Lamport bump)
  and with a fresh device joining (story position kept).
- **Convergence under conflict:** interleave A's and B's rounds so B's `PUT` gets 412; after the retry both match and
  no item is lost. Randomised: N devices, random edits and round orders, all equal at the end (property test).
- **Per slot:** one-sided slots kept; F2 rename by change time; F4 join adopts on a fresh device and doesn't add an
  empty slot; "Keep both" keeps both characters.
- **Wrong code:** a typo → check-symbol error, no request made; a valid code with no copy → 404 message, nothing local
  changes, nothing created; a damaged copy (one flipped ciphertext byte) → decrypt error, no `PUT` follows.
- **Offline:** `fetch` rejects / times out → the local save is unchanged and still saves, status "Not synced yet", a
  retry on the `online` event; no error escapes to the page.
- **Crypto:** HKDF test vector pinned (a fixed code → fixed id, token and a known ciphertext with a fixed IV); a fresh
  IV per upload (100 uploads, no repeat); AAD binding (a copy moved to another id fails); padding to 4 KiB steps.
- **Privacy canary:** a slot named `Zq_Canary`, class `assassin`, level 37; capture every request (URL, headers, body):
  none contains `Zq_Canary`, `assassin`, `lvl`, the label `Zq_Canary-assassin-lvl37`, `aion2/`, a slot id or the code; headers are only the
  allowlist; `credentials` is `omit`, `referrer` empty. The sync code is not in an Export file nor in the *Report a
  problem* link (`site`); view settings, `backup` and `current` are not in the decrypted payload.
- **Version:** a payload with `v` above the build's → "Update the app to sync", nothing written.
- **Artifact:** `dist-artifact` contains no sync code or UI and stays a single file (if S4 stays "site only").

**Server (0.7 lane C, against the host's local emulator):**

- **Ciphertext only:** the stored bytes equal the request body exactly; the handler has no JSON parse on the body path
  (a source check); a body that isn't envelope-shaped (wrong length step) → 400.
- **No name in logs:** run the client's canary flow against the server and collect all log output: no line contains the
  canary, a sync id, a token or an IP; every line matches the allowlisted format (method, route template, status, size
  bucket). Metrics have no per-id dimension.
- **API:** create with `If-None-Match: *`, 412 when it exists; update with a stale etag → 412; wrong token → 401;
  no precondition → 428; `DELETE` then `GET` → 404; malformed id or token → 400 without a store read.
- **Limits:** 256 KiB + 1 → 413; per-IP and per-id rate limits → 429 with `Retry-After`; storage ceiling → 507.
- **Retention:** an object with last activity 181 days ago is removed by the scheduled job; 179 days is kept; a `GET`
  refreshes last-read at most once a day.
- **CORS:** only the allowed origins get CORS headers; another origin's preflight fails.
