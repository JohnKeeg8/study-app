# Physical installations

## Where equipment lives

- **MDF (main distribution frame):** the central wiring point. It usually houses the core equipment and the provider's **demarc**, where carrier responsibility ends and yours begins.
- **IDF (intermediate distribution frame):** a closet serving a floor or area. It holds access switches and patch panels, and uplinks to the MDF. Place it so **horizontal runs stay within 90 m**.
- **Racks:**
  - Standard width is **19 inches**, measured in **rack units** (1U = 1.75 in).
  - **Open-frame** racks (2-post or 4-post) suit secured rooms.
  - **Locking enclosed cabinets** add physical security.
- **Rack practice:**
  - Heaviest items (UPS batteries) go at the **bottom**.
  - Fit **blanking panels** in empty spaces.
  - Use cable managers and **hook-and-loop** straps, not tight zip ties.
  - **Label both ends** of every cable.
  - Ground and bond the racks.

## Power

| Device | Purpose |
|---|---|
| **UPS** | Immediate battery power during outages and power conditioning; bridges the gap until the generator starts |
| **Generator** | Long-term power during extended outages |
| **PDU** | Distributes power within a rack; *managed* PDUs report per-outlet use and can power-cycle remotely |
| **Surge protector** | Spike protection only; no runtime |

- **UPS types:** **online (double-conversion)** gives the cleanest power with zero transfer time. Line-interactive and standby UPSs switch to battery only when needed.
- **Sizing:** size in **VA and watts**, with headroom. Keep continuous load at **≤80%** of the circuit rating.
- **Redundancy:** connect dual power supplies to **separate PDUs and circuits** (A/B feeds).
- **Voltage:** about 120 V in North America and about 230 V in Europe. Telecom equipment often uses **−48 V DC**.
- **PoE:**
  - **802.3af** supplies about 15.4 W, **802.3at (PoE+)** about 30 W, and **802.3bt** about 60–100 W.
  - The switch has a **total PoE budget**.
  - A PoE **injector** adds power to a single link.

## Environment

- **Temperature:** about **18–27 °C (64–81 °F)** at equipment intakes (ASHRAE).
- **Humidity:** about **40–60%**. Too low causes **static discharge (ESD)**; too high causes **condensation and corrosion**.
- **Hot aisle / cold aisle:** racks face each other so intakes share a cold aisle and exhausts share a hot aisle. Match device **airflow direction** to the layout.
- **Fire suppression:** **clean-agent** gas (e.g. FM-200, inert gas) puts out fires without damaging electronics. **Pre-action** sprinklers keep pipes dry until a fire is detected.
- **Monitoring:** temperature, humidity, water-leak, and smoke sensors.
- **Cabling:**
  - Use **plenum**-rated cable in air-handling spaces, **riser** cable between floors, and **direct-burial** cable outdoors.
  - Keep data cables away from power cables (EMI).
  - Respect **bend radius** (about 4× the diameter for UTP).

> **Exam tip:** "Short outage, graceful shutdown" → UPS. "Hours-long outage" → generator. "Low humidity risk" → ESD. "Above a drop ceiling" → plenum cable.
