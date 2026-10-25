# PaddockMate

Track day and vehicle setup logging tool for recording tyre pressures, suspension geometry, and session feedback per circuit layout.

## Language

**Vehicle**:
A car being driven and logged on track.
_Avoid_: Auto, automobile, ride, machine

**Track**:
A motorsport racing circuit facility.
_Avoid_: Circuit, course, venue

**Layout**:
A specific circuit configuration or route variant within a Track (e.g., GP, National, Indy).
_Avoid_: Configuration, circuit variant, track variant

**Track Day**:
An event or date where a Vehicle is driven on a specific Track Layout.
_Avoid_: Event, outing, meet

**Session**:
A single stint or run out on circuit during a Track Day.
_Avoid_: Stint, run, heat, lap

**Tyre Reading**:
Measurements recorded for each tyre corner (Front Left, Front Right, Rear Left, Rear Right), including cold pressure, hot pressure, and tyre temperature.
_Avoid_: Tire, tire reading, wheel stats, rubber reading

**Cold Pressure**:
Tyre pressure measured before a Session when the tyre is at ambient temperature.
_Avoid_: Starting pressure, base pressure

**Hot Pressure**:
Tyre pressure measured immediately after coming off circuit from a Session.
_Avoid_: Working pressure, finish pressure

**Target Pressure**:
The desired Hot Pressure a driver aims to achieve when tyres reach operating temperature on circuit.
_Avoid_: Goal pressure, optimal pressure

**Bleed**:
The pressure intentionally released from a hot tyre to reach the Target Pressure.
_Avoid_: Vent, dump, drop, release

**Adjusted Pressure**:
The tyre pressure set in the pits after bleeding or adding air, representing the starting pressure heading into the next Session.
_Avoid_: Final pressure, reset pressure, set pressure

**Track Map**:
A visual outline or diagram of a Track Layout showing corner layout and racing direction.
_Avoid_: Circuit diagram, track image

**Suspension Setup**:
Chassis geometry and damper adjustments, including camber, toe, ride height, and damper clicks (bump, rebound, fast bump, fast rebound).
_Avoid_: Alignment profile, chassis tune

**Baseline Setup**:
A reference configuration (geometry, damper clicks, and target tyre pressures) for a Vehicle at a specific Track Layout, used to initialise a new Track Day.
_Avoid_: Starting template, default setup, preset

**Vehicle Default Pressures**:
The fallback Cold and Target tyre pressures configured on a Vehicle profile, used to initialise tyre readings when no layout-specific Baseline Setup exists.
_Avoid_: Vehicle presets, default setup, car defaults

**Damper Setting**:
Adjustment clicks recorded for suspension damping (bump, rebound, fast bump, fast rebound) per damper.
_Avoid_: Clickers, shock settings, stiffness
