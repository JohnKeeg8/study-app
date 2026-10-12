# Logical security

## Encryption

- **Data in transit:** protect data while it moves (TLS/HTTPS, IPsec, SSH).
- **Data at rest:** protect stored data (full-disk encryption, encrypted databases and backups).
- **Symmetric:** one shared key, fast, used for bulk data (**AES**).
- **Asymmetric:** a public/private key pair (RSA, ECC). TLS uses asymmetric crypto to agree on a session key, then symmetric crypto for the data.
- **Hashing:** a fixed-length digest that proves **integrity** (SHA-256; MD5 and SHA-1 are broken).
- **Digital signature:** a hash signed with the sender's private key. It proves **authenticity, integrity, and non-repudiation**.
- **Perfect forward secrecy:** ephemeral keys per session mean a stolen long-term key can't decrypt past sessions.

## PKI and key management

- A **certificate authority (CA)** signs certificates that bind a public key to an identity (X.509). Root CAs are kept offline; intermediate CAs issue certificates.
- **Revocation** is checked with a **CRL** or **OCSP**. **Self-signed** certificates aren't trusted by default.
- **Key management** covers generating, storing (**HSMs**, vaults), distributing, **rotating**, and revoking keys.

## Identity and access management (IAM)

IAM manages identities, authentication, authorization, and the account **life cycle**, including prompt **deprovisioning**.

**AAA:**
- **Authentication:** who you are.
- **Authorization:** what you're allowed to do.
- **Accounting:** what you did, logged.

**MFA:** combine *different* factor types:
- Something you **know** (password, PIN).
- Something you **have** (phone, token, smart card).
- Something you **are** (biometrics).
- Location-based factors, such as somewhere you are.

Two passwords is still single-factor.

**Time-based authentication:**
- **TOTP** codes change about every 30 seconds and need synced clocks. **HOTP** is counter-based.
- **Time-of-day restrictions** limit when an account can log in.

**SSO (single sign-on):** log in once and reach many applications.
- **SAML:** XML assertions from an **identity provider (IdP)** to a **service provider (SP)**.
- **OAuth 2.0** handles delegated authorization; **OpenID Connect** adds identity on top.
- **Kerberos:** ticket-based, used in Active Directory.

## Directory and AAA protocols

| Protocol | Ports | Notes |
|---|---|---|
| **LDAP / LDAPS** | 389 / 636 | Query directory services (Active Directory) |
| **RADIUS** | UDP 1812/1813 | Network access AAA (Wi-Fi 802.1X, VPN). Encrypts only the password |
| **TACACS+** | TCP 49 | Device administration. Encrypts the **entire payload** and separates the A's (per-command authorization) |

**802.1X** roles: the **supplicant** (client), the **authenticator** (switch or AP), and the **authentication server** (RADIUS).

## Authorization models

- **Least privilege:** only the access a job requires.
- **RBAC (role-based):** permissions are assigned to roles, and users are assigned to roles.
- **MAC (mandatory):** access set by security labels such as Secret or Top Secret.
- **DAC (discretionary):** the owner decides who has access.
- **ABAC (attribute-based):** decisions use attributes such as department, device, location, and time.
- **PAM:** vaulted, monitored, just-in-time privileged accounts.

## Geofencing

Allow or deny access based on location (GPS or IP geolocation). For example, block logins from countries you don't operate in. **Impossible travel** alerts flag logins from distant places too close together in time.

> **Exam tip:** "Encrypts the whole payload, device admin" → TACACS+. "Wi-Fi/VPN user auth" → RADIUS. "Log in once, use many apps" → SSO (SAML). "Smart card + PIN" → MFA.
