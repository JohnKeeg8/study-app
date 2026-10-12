# Logical security

Logical security is everything that protects a network with software, cryptography, and identity rather than locks and walls. For N10-009 it covers four ideas: **encryption** (keeping data secret and unaltered), **certificates and PKI** (proving who a key belongs to), **identity and access management** (who you are and what you may do), and **geofencing** (where you are allowed to be when you connect).

## Data in transit and data at rest

Data is exposed in two very different situations, and each needs its own protection.

| State | What it means | Threat it stops | Examples |
|---|---|---|---|
| **Data in transit** (in motion) | Data **moving across a network** | Eavesdropping, sniffing, on-path (man-in-the-middle) tampering | **TLS/HTTPS**, **IPsec** VPNs, **SSH**, **SFTP/SCP**, WPA3 on Wi-Fi |
| **Data at rest** | Data **stored** on a disk, database, backup, or USB drive | A stolen laptop, drive, or backup tape being read | **Full-disk encryption** (BitLocker, FileVault), encrypted databases, encrypted backups, self-encrypting drives |

- The two are independent. A website using HTTPS protects the data on the wire, but if the database behind it is unencrypted, a stolen backup still exposes everything.
- **Data in use** (in memory while being processed) is a third state, but Network+ focuses on transit and rest.
- Scenario: "A laptop with customer data was stolen from a car" → the missing control is **encryption at rest**. "An attacker captured passwords with a packet sniffer" → the missing control is **encryption in transit** (e.g. Telnet or HTTP used instead of SSH or HTTPS).

## Symmetric, asymmetric, and hashing

There are three building blocks. Knowing which one does what explains almost every crypto question.

| Building block | Keys | Strengths | Used for | Examples |
|---|---|---|---|---|
| **Symmetric encryption** | **One shared secret key** encrypts and decrypts | **Fast**, efficient for large amounts of data | Bulk data: the actual session, disk encryption | **AES** (current standard), 3DES (legacy) |
| **Asymmetric encryption** | A **key pair**: public key (shared with anyone) and private key (never shared) | Solves the **key-exchange problem**; enables signatures | Key exchange, digital signatures, certificates | **RSA**, **ECC**, Diffie-Hellman (key agreement) |
| **Hashing** | **No key**; one-way function | Fixed-length digest; any change to the input changes the hash | **Integrity** checks, password storage | **SHA-256**; **MD5** and **SHA-1** are broken (collisions) |

**Why TLS uses both:** asymmetric crypto is slow, but it lets two strangers agree on a secret safely. Symmetric crypto is fast, but both sides need the same key. So TLS uses asymmetric crypto (or Diffie-Hellman) to **agree on a session key**, then **symmetric** encryption (AES) protects the bulk data.

**Hashing is not encryption.** You can't "decrypt" a hash. You recompute the hash and compare: if the values match, the data wasn't changed. A **collision** is two different inputs producing the same hash, which is why MD5 and SHA-1 are no longer trusted.

**Digital signatures** combine hashing and asymmetric keys:
1. The sender hashes the message and encrypts the hash with **their private key**. That's the signature.
2. The receiver decrypts it with the **sender's public key** and compares it to their own hash of the message.
3. A match proves **integrity** (not altered), **authenticity** (only the private-key holder could sign it), and **non-repudiation** (the sender can't deny signing).

**Perfect forward secrecy (PFS):** each session uses fresh **ephemeral** keys (e.g. ECDHE). If a server's long-term private key is stolen later, previously recorded sessions still can't be decrypted. **TLS 1.3** requires PFS, removes outdated ciphers, and has a faster handshake.

## Certificates, PKI, and key management

A public key is just a number. A **certificate** answers the question "whose public key is this?"

- A **digital certificate (X.509)** binds a **public key to an identity** (e.g. `www.example.com`). It contains the **subject**, **subject alternative names (SAN)**, the **public key**, the **issuer**, **validity dates**, a serial number, and the **CA's signature**.
- A **certificate authority (CA)** verifies the requester and signs the certificate. Clients trust it because the CA's root certificate is in their **trust store**.
- **Chain of trust:** **root CA** → **intermediate CA** → **server (leaf) certificate**. The **root CA** is the top **trust anchor** and is kept **offline**; intermediates do the day-to-day issuing, so a compromised intermediate can be revoked without replacing the root.
- **PKI (public key infrastructure)** is the whole system: CAs, certificates, policies, registration, and revocation.

**Revocation:** a certificate can be cancelled before it expires, for example if its private key leaked.
- **CRL (certificate revocation list):** a published list of revoked serial numbers that clients download.
- **OCSP (Online Certificate Status Protocol):** the client asks a responder about **one certificate** in real time. **OCSP stapling** lets the server attach a fresh OCSP response itself.

**Self-signed certificates** are signed by their own key instead of a trusted CA. They encrypt traffic just as well, but **clients don't trust them by default** (browser warnings), because nobody vouches for the identity. They're fine for labs and internal device management if you add them to the trust store; public services should use CA-issued certificates.

**Certificate pinning:** an application trusts only a **specific certificate or public key** for a service, so even a certificate from a compromised or rogue CA is rejected.

**Expired certificates** are a common outage cause: "Everyone suddenly gets certificate warnings on the VPN portal" → check the expiration date.

### Key management

Encryption is only as strong as the protection of its keys. **Key management** is the life cycle of cryptographic keys:
1. **Generate** keys with strong randomness and adequate length.
2. **Store** them securely: a **hardware security module (HSM)**, a tamper-resistant device that generates and stores keys so they never leave it in plain form, or a software key vault.
3. **Distribute** them safely (never by email in plaintext).
4. **Rotate** them on a schedule so a leaked key has limited value.
5. **Revoke and destroy** them when compromised or retired.

Scenario: "A private key for the web server was found on a public code repository" → **revoke** the certificate, **generate a new key pair**, and get a new certificate issued.

## Authentication and MFA

**IAM (identity and access management)** manages identities, how they **authenticate**, what they're **authorized** to do, and the account **life cycle**: provisioning when someone joins, changing access when they move roles, and prompt **deprovisioning** (disabling) when they leave. Forgotten accounts of former employees are a classic risk.

**AAA** frames the whole process:
- **Authentication:** proving **who you are** (password, certificate, token).
- **Authorization:** deciding **what you may do** once identified.
- **Accounting:** recording **what you did**, when, and for how long (logs for auditing and billing).

**Multifactor authentication (MFA)** requires factors from **different categories**:

| Factor | Examples |
|---|---|
| **Something you know** | Password, PIN, security question |
| **Something you have** | Smart card, hardware token, phone authenticator app, badge |
| **Something you are** | Fingerprint, face, iris, voice (biometrics) |
| **Somewhere you are** | GPS or network location |
| **Something you do** | Typing rhythm, signature gesture |

- **Smart card + PIN** = MFA (have + know). **Password + security question** = still single-factor (two things you know).
- **Time-based authentication:**
   - **TOTP (time-based one-time password):** a code generated from a **shared secret plus the current time**, changing about **every 30 seconds**. The token and server clocks must be roughly in sync.
   - **HOTP (HMAC-based one-time password):** the code changes with a **counter** each time one is used, not with time.
   - **Time-of-day restrictions:** an account can log in only during set hours, e.g. contractors 8:00–18:00 on weekdays.
- **Strengthening device logins:** long passphrases, **account lockout** after failed attempts, MFA, and **centralized AAA** (RADIUS/TACACS+) instead of shared local accounts.

## SSO, SAML, and federation

**Single sign-on (SSO)** lets a user **authenticate once** and reach many applications without logging in again. Benefits: fewer passwords to reuse or write down, one place to enforce MFA, and one place to disable an account. Risk: the SSO account becomes a high-value target, so protect it with MFA.

| Technology | What it does | Key words |
|---|---|---|
| **SAML** | Web SSO using **XML assertions**. The **identity provider (IdP)** authenticates the user and sends a signed assertion to the **service provider (SP)**, the application | XML, IdP, SP, assertion |
| **OAuth 2.0** | **Delegated authorization**: lets an app access resources **on the user's behalf** without getting their password ("Allow this app to read your calendar") | Access tokens, authorization (not authentication) |
| **OpenID Connect (OIDC)** | Adds **authentication** (identity) on top of OAuth 2.0 | "Sign in with..." buttons |
| **Kerberos** | **Ticket-based** authentication in **Active Directory**. A **key distribution center (KDC)** issues tickets so passwords aren't sent across the network | TGT, tickets, KDC, time-sensitive |

- **Federation** is a trust relationship between organizations: users from one organization access another's resources using their **home credentials** (e.g. a partner logs in to your portal with their own company account, via SAML).
- Kerberos depends on synchronized clocks. If a client's clock is several minutes off, ticket authentication fails.

## RADIUS, TACACS+, LDAP, and 802.1X

These protocols carry authentication between network devices and a central server, so you manage accounts in one place instead of on every switch and AP.

| Protocol | Transport and port | Encryption | Best for |
|---|---|---|---|
| **RADIUS** | **UDP 1812** (authentication), **UDP 1813** (accounting) | Encrypts **only the password** | **Network access** for users: Wi-Fi (WPA2/WPA3-Enterprise), VPN, 802.1X. Open standard |
| **TACACS+** | **TCP 49** | Encrypts the **entire payload** | **Device administration**: admins logging in to routers and switches. **Separates** authentication, authorization, and accounting, so it can authorize **each command** |
| **LDAP** | **TCP 389** | None by default (simple bind sends cleartext) | **Querying a directory** such as Active Directory: verify users, look up group memberships |
| **LDAPS** | **TCP 636** | LDAP over **TLS** | Secure directory queries |

- RADIUS **combines** authentication and authorization in one step. TACACS+ keeps the three A's separate.
- RADIUS and TACACS+ often **use LDAP/Active Directory behind them** as the actual user database.
- Scenario: "Admins must be limited to show commands, and every command they type must be logged" → **TACACS+**. "Employees authenticate to corporate Wi-Fi with their domain credentials" → **RADIUS** with 802.1X.

**802.1X (port-based network access control)** authenticates a device **before** a switch port or Wi-Fi network grants access:
- **Supplicant:** the client device requesting access.
- **Authenticator:** the **switch or access point** that relays the request and opens or blocks the port.
- **Authentication server:** usually a **RADIUS** server that makes the decision.
- Until authentication succeeds, the port passes only authentication traffic (EAP). The authenticator never decides on its own; it asks the server.

## Authorization and least privilege

Authentication proves identity; **authorization** decides what that identity may access.

- **Least privilege:** give each user, admin, or service **only the access its job requires**, and no more. A help-desk tech can reset passwords but can't change firewall rules. This limits the damage from a mistake or a compromised account.

| Model | Who decides | Example |
|---|---|---|
| **RBAC (role-based)** | Permissions go to **roles**; users are placed in roles | "Network Operators" role can view configs; move a user to a new role when they change jobs |
| **MAC (mandatory)** | The **system**, based on **classification labels** | Secret, Top Secret clearances in government/military |
| **DAC (discretionary)** | The **owner** of the resource | A file owner shares a folder with a colleague |
| **ABAC (attribute-based)** | Rules using **attributes** | Allow if department = Finance AND device = managed AND time = business hours |
| **Rule-based** | Global rules set by an admin | Firewall ACLs |

- **PAM (privileged access management)** protects high-privilege accounts: credentials are **vaulted**, sessions are **monitored and recorded**, and access is granted **just-in-time** for a limited period.
- **Separation of duties** splits sensitive tasks so no single person can complete them alone.
- Scenario: "A new hire needs the same access as everyone else on the help desk" → add them to the help-desk **role** (RBAC), rather than granting permissions one by one.

## Geofencing

**Geofencing** uses a device's **location** to allow or deny access. Location comes from **GPS** on mobile devices or **IP geolocation** for network logins.

- Block logins from countries where the company doesn't operate.
- Let a mobile app or company device work only inside the office or campus boundary.
- Trigger extra checks (MFA) when a login comes from an unusual region.
- **Impossible travel** detection flags two logins from distant places **too close together in time** to be physically possible, e.g. London at 09:00 and Sydney at 09:20. It usually means stolen credentials.
- Limitation: VPNs and proxies can hide real location, so geofencing is one signal, not a complete control.

## Common mix-ups

- **Authentication vs authorization:** authentication = **who you are**; authorization = **what you may do**. Logging in is authentication; being blocked from a folder is authorization.
- **RADIUS vs TACACS+:** RADIUS = **UDP**, user **network access**, encrypts **only the password**, combines authN/authZ. TACACS+ = **TCP 49**, **device administration**, encrypts the **whole payload**, separates AAA with per-command authorization.
- **Hashing vs encryption:** encryption is **reversible with a key** (confidentiality); hashing is **one-way** (integrity).
- **Symmetric vs asymmetric:** one shared key and fast vs a public/private key pair and slow but solves key exchange.
- **SAML vs OAuth:** SAML = **authentication/SSO** with XML assertions; OAuth 2.0 = **delegated authorization**; OIDC adds identity to OAuth.
- **TOTP vs HOTP:** TOTP changes with **time**; HOTP changes with a **counter**.
- **CRL vs OCSP:** CRL = a **downloaded list**; OCSP = a **real-time query** about one certificate.
- **Two passwords vs MFA:** two things you know is **single-factor**. MFA needs different categories.
- **RBAC vs DAC vs MAC:** roles vs owner decides vs classification labels.

## Key terms

- **AES:** the standard symmetric cipher for bulk data.
- **Certificate authority (CA):** trusted entity that signs certificates.
- **CRL / OCSP:** ways to check whether a certificate is revoked.
- **HSM:** tamper-resistant hardware for generating and storing keys.
- **IdP / SP:** identity provider (authenticates) and service provider (the app) in SAML.
- **Kerberos:** ticket-based authentication in Active Directory, using a KDC.
- **Least privilege:** only the access a job requires.
- **MFA:** authentication using two or more different factor categories.
- **Perfect forward secrecy:** ephemeral session keys protect past sessions if a long-term key leaks.
- **Self-signed certificate:** a certificate not issued by a trusted CA; not trusted by default.
- **Supplicant / authenticator / authentication server:** the three 802.1X roles.
- **TOTP:** a one-time code derived from a shared secret and the current time.

> **Exam tip:** "Encrypts the whole payload, per-command authorization for admins" → TACACS+. "Wi-Fi or VPN users, UDP 1812/1813" → RADIUS. "Log in once, use many web apps, XML assertions" → SSO with SAML. "Smart card + PIN" → MFA; "password + PIN" → not MFA. "Stolen laptop" → encryption at rest; "sniffed traffic" → encryption in transit.
