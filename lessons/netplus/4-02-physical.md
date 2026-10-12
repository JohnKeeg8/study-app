# Physical security

Physical access defeats most logical controls: someone standing at a switch can plug in a rogue device, connect to the console port and reset passwords, or simply carry the equipment away. N10-009 focuses on two physical controls, **cameras** and **locks**, but you also need to know the supporting measures that stop tailgating, deter intruders, and protect what's on screens and desks.

## Why physical security matters

- **Console access = control.** Most switches and routers allow **password recovery** from the console port during boot. Anyone who can touch the device can often take it over.
- **Rogue devices:** an attacker with access to a wiring closet can add an unauthorized access point or a small sniffer on a spare port.
- **Theft and damage:** laptops, drives, and backup media walk out the door; equipment can be unplugged or sabotaged.
- **Layering:** physical security is the outermost layer of **defense in depth**: perimeter → building → room → rack → device.

Controls are often described by what they do:

| Control type | Purpose | Physical examples |
|---|---|---|
| **Deterrent** | Discourage the attempt | Warning signs, visible cameras, lighting, fences |
| **Preventive** | Stop the attempt | Locks, bollards, access control vestibules, locked racks |
| **Detective** | Notice and record that it happened | Cameras (recording), alarms, motion sensors, door contacts, tamper seals |

Some controls fit more than one type: a visible camera both **deters** and **detects**.

## Cameras and surveillance

Video surveillance (CCTV or IP cameras) has two jobs:
- **Deter:** people behave differently when they can see a camera.
- **Detect and record:** footage shows **who** entered, **when**, and **what** they did, which supports investigations and evidence.

| Feature | What it does | When to use it |
|---|---|---|
| **PTZ (pan-tilt-zoom)** | An operator can **remotely steer and zoom** the camera | Large areas such as parking lots or lobbies; follow an incident live |
| **Fixed** | Points at one spot | Doorways, specific racks |
| **Infrared (IR) / night vision** | Records in **low light or darkness** | Outdoor areas, unlit rooms after hours |
| **Motion detection** | Records or alerts when movement occurs | Saves storage; alerts on after-hours activity |
| **Wide-angle** | Covers a broad field of view | Rooms and corridors |

**Placement:** cover **entrances and exits, server rooms, data center aisles, and rack rows** with **no blind spots**. A camera that sees the door but not the racks can't show who touched a switch.

**Protect the system itself:** store recordings securely, set a **retention period** long enough for investigations, sync camera clocks (NTP) so timestamps are trustworthy, and put IP cameras on their own segment so they aren't an easy way into the network.

Scenario: "Equipment went missing from the server room overnight, and nobody knows who was there" → the room needs **cameras** (detective) and **logged badge access**.

## Locks and door access

| Lock type | How it opens | Strengths | Weaknesses |
|---|---|---|---|
| **Traditional keyed lock** | Physical key | Simple, no power needed | Keys can be copied; a lost key means **re-keying**; no record of who entered |
| **Cipher lock** | **Code on a keypad** (mechanical or electronic) | No key to lose | Codes get **shared or observed** (shoulder surfing); rotate codes regularly |
| **Badge / proximity card reader** | **Something you have**: RFID or smart card | **Every entry is logged**; a lost badge is **disabled instantly**; access can be limited by area and time | Badges can be lent or cloned |
| **Biometric lock** | Fingerprint, face, iris, palm | Tied to the **person**, can't be lent | Cost; false accepts and false rejects |
| **Multifactor door access** | Two different factors: **badge + PIN**, or badge + biometric | A stolen badge alone isn't enough | Slower entry |

Why badge systems win in most offices: when an employee leaves or loses a badge, an admin **revokes it centrally** in seconds, and the **audit trail** shows every door it opened. With metal keys you'd have to change the locks and you'd never know who used them.

Scenario: "We need to know exactly who entered the wiring closet and be able to cut off a lost credential immediately" → **badge reader** with central management. "Even if a badge is stolen, it shouldn't open the data center" → **multifactor** (badge + PIN or biometric).

## Securing equipment: racks, closets, and devices

- **Locked network closets / IDFs and MDFs:** lockable doors with **access logging** prevent tampering, rogue devices, and console access.
- **Locking racks and cabinets:** in shared spaces such as **colocation** data centers, rack locks stop other tenants from reaching your devices and console ports.
- **Cable locks:** attach a **laptop** (via its security slot) to a desk or other immovable object to prevent quick theft.
- **Tamper-evident seals or tape:** don't stop access, but **show whether a device or case was opened** without authorization.
- **Disable or protect unused ports and consoles:** shut unused switch ports, set console passwords, and log out of console sessions.

Scenario: "Your company rents half a rack in a shared data center" → use a **locking cabinet** for your equipment.

## Preventing tailgating

**Tailgating** (also called **piggybacking**) is when an unauthorized person follows an authorized person through a door before it closes. A badge reader alone can't stop it, because the door is already open.

- **Access control vestibule** (formerly called a **mantrap**): a small space between **two interlocking doors**. Only one door can be open at a time, and the second door won't open until the person is verified, so a follower gets **trapped** between them.
- **Turnstiles** allow one person per credential.
- **Security guards** check badges and challenge strangers.
- **Visitor logs and escorts:** record who is on-site, issue visitor badges, and keep visitors **supervised** in sensitive areas.
- **Security awareness training:** teach staff not to hold doors open for people they don't know and to challenge anyone without a visible badge.

## Perimeter, detection, and deterrence

| Control | What it does |
|---|---|
| **Bollards** | Short, sturdy posts that **stop vehicles** from ramming entrances |
| **Fences and gates** | Define the perimeter and slow intruders |
| **Lighting** | **Deters** and helps cameras see |
| **Warning signs** | **Deter** ("Authorized personnel only", "CCTV in operation") |
| **Alarm systems** | **Door contacts** and **motion sensors** trigger an alert when a door opens or movement occurs after hours |
| **Security guards** | Can deter, detect, and respond; can make judgment calls |

Scenario: "Alert us if the server room door opens at 2 a.m." → **alarm system with door contact sensors**. "Prevent a car from being driven through the lobby glass" → **bollards**.

## Protecting information in the workspace

Physical security also covers what people can **see** or **pick up**.
- **Privacy screens (filters):** narrow the viewing angle of a monitor to prevent **shoulder surfing** in open offices or public places.
- **Clean desk policy:** no sensitive documents, sticky-note passwords, or unlocked devices left out when away. Lock screens when stepping away.
- **Secure disposal:** shred paper; wipe or destroy drives before disposal.
- **Faraday cage:** a conductive enclosure that **blocks electromagnetic signals** from entering or leaving, used to protect sensitive equipment or stop wireless eavesdropping.

## Common mix-ups

- **Badge reader vs cipher lock:** badge = something you **have**, logged per person and revocable; cipher lock = a **shared code**, not tied to one person.
- **Access control vestibule vs badge reader:** a badge reader controls **who unlocks the door**; a vestibule stops **someone following them through**.
- **Deterrent vs detective:** signs and lighting **discourage**; cameras recording and alarms **detect**. A visible camera does both.
- **Tamper-evident seal vs lock:** a lock **prevents** opening; a seal only **shows** that it was opened.
- **Bollards vs fences:** bollards stop **vehicles**; fences stop and slow **people**.
- **PTZ vs infrared:** PTZ = **movable and zoomable**; infrared = **sees in the dark**.
- **Privacy screen vs clean desk:** privacy screen protects what's **on the monitor**; clean desk protects what's **on the desk**.

## Key terms

- **Access control vestibule:** two interlocking doors that prevent tailgating (formerly mantrap).
- **Biometric lock:** opens with a fingerprint, face, or iris scan.
- **Bollard:** a post that stops vehicles.
- **Cipher lock:** opened with a keypad code.
- **Faraday cage:** an enclosure that blocks electromagnetic signals.
- **PTZ camera:** pan-tilt-zoom camera controlled remotely.
- **Tailgating:** following an authorized person through a secured door.
- **Tamper-evident seal:** shows whether equipment was opened.

> **Exam tip:** "Stop someone following an employee through a door" → access control vestibule. "Revocable entry with an audit trail" → badge reader. "Badge + PIN at the door" → multifactor physical access. "Stop vehicles" → bollards. Cameras both **deter** and **detect**.
