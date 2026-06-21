# Scavenger Hunt Feature - Static Code Analysis Report

This report presents a detailed static code analysis of the Pinmap scavenger hunt feature code. It maps component architecture, dependencies, data flows, and database interactions, and highlights several functional, race condition, and data exposure security bugs.

---

## 1. Observation

Direct observations made from reviewing the codebase:

### Component Architecture and File Paths
*   **ScavengerHuntsPanel**: Located at `src/components/ScavengerHuntsPanel.jsx`. It manages active play states, created/enrolled hunts, and renders the edit/delete modals.
    *   Imports `HuntRadarOverlay` from `./HuntRadarOverlay` (line 5).
    *   Accepts props: `{ uname, userLL, pins, trails, lang, flash, initialHuntsTab, huntsUpdateTrigger, onHuntProgress }` (line 9).
    *   Manages 16 state fields including: `hunts`, `selectedHunt`, `participant`, `huntSteps`, `activityLogs`, `leaderboard`, `checkingIn`, `writingComment`, `showRadar`, `editingHunt`, `deletingHunt`, and `userEnrollments`.
*   **HuntJoinModal**: Located at `src/components/HuntJoinModal.jsx`. A modal enabling user enrollment via shared links.
    *   Accepts props: `{ huntId, userId, lang, onJoined, onClose, flash }` (line 7).
    *   Calls `api.getHunt(huntId)` on load (line 17) and `api.enrollInHunt(...)` on action (line 37).
*   **HuntRadarOverlay**: Located at `src/components/HuntRadarOverlay.jsx`. A full-screen sensor-driven compass and proximity indicator.
    *   Accepts props: `{ pin, userLL, distanceFt, trend, lang, onClose }` (line 26).
    *   Maintains device orientation listening and GPS watch hooks (lines 41-96).
*   **AddScavengerHunt**: Located at `src/components/screens/AddScavengerHunt.jsx`. The screen to create a new hunt.
    *   Accepts props: `{ uname, pins, trails, lang, onCreated, onCancel, flash, userLL }` (line 7).

### State Mutation & Logic Patterns
*   **State Mutation in AddScavengerHunt**:
    *   `handleStepChange` (lines 47-50):
        ```javascript
        const handleStepChange = (idx, field, value) => {
          const newSteps = [...steps];
          newSteps[idx][field] = value;
          setSteps(newSteps);
        };
        ```
    *   `handleObjectiveToggle` (lines 53-64):
        ```javascript
        const handleObjectiveToggle = (stepIdx, actionType, pointsVal) => {
          const newSteps = [...steps];
          const rules = { ...newSteps[stepIdx].point_rules };
          ...
          newSteps[stepIdx].point_rules = rules;
          setSteps(newSteps);
        };
        ```
*   **State Mutation in ScavengerHuntsPanel**:
    *   `onChange` handlers in step editing (lines 1031-1033):
        ```javascript
        const newSteps = [...editingHunt.steps];
        newSteps[idx].pin_id = e.target.value;
        setEditingHunt({ ...editingHunt, steps: newSteps });
        ```

### API / Database Schema Details (`src/utils/api.js`)
*   `hunts` table read/write:
    *   `listHunts: function() { return sb.from("hunts").select("*").order("created_at", {ascending: false}).then(function(r){ if (r.error) throw r.error; return r.data||[]; }); }` (line 385).
    *   `getHunt: function(id) { return sb.from("hunts").select("*, hunt_steps(*)").eq("id", id).single().then(function(r){ if (r.error) throw r.error; return r.data; }); }` (line 388).
*   `hunt_steps` table read/write:
    *   `getHuntSteps: function(huntId) { return sb.from("hunt_steps").select("*").eq("hunt_id", huntId).order("sequence_order", {ascending: true}).then(function(r){ if (r.error) throw r.error; return r.data||[]; }); }` (line 400).
    *   `upsertHuntSteps: function(steps) { return sb.from("hunt_steps").upsert(steps).select().then(function(r){ if (r.error) throw r.error; return r.data||[]; }); }` (line 408).
*   `hunt_participants` table read/write:
    *   `enrollInHunt: function(huntId, userId, joinMethod) { return sb.from("hunt_participants").insert({hunt_id: huntId, user_id: userId, join_method: joinMethod}).select().then(function(r){ if (r.error) throw r.error; return r.data[0]; }); }` (line 412).
    *   `updateParticipantStatus: function(participantId, status, totalPoints) { ... return sb.from("hunt_participants").update(updatePayload).eq("id", participantId)... }` (lines 420-424).
*   `hunt_activity_logs` table read/write:
    *   `logHuntActivity: function(participantId, stepId, activityType, pointsAwarded) { return sb.from("hunt_activity_logs").insert({ participant_id: participantId, step_id: stepId, activity_type: activityType, points_awarded: pointsAwarded })... }` (lines 426-432).

### UI Code Anomalies
*   **Dead Code**: `submitFieldJournal` is defined at lines 606-623 in `ScavengerHuntsPanel.jsx`, but is not referenced or rendered anywhere else in the file.
*   **Device Orientation Event Listeners**:
    *   In `HuntRadarOverlay.jsx` (lines 68-96):
        ```javascript
        function startOrientation() {
          setSensorAsked(true);
          function onOrient(evt) { ... }
          if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
              .then((r) => {
                if (r === 'granted') {
                  setSensorReady(true);
                  window.addEventListener('deviceorientation', onOrient, true);
                }
              }).catch(() => {});
          } else {
            setSensorReady(true);
            window.addEventListener('deviceorientation', onOrient, true);
            window.addEventListener('deviceorientationabsolute', onOrient, true);
          }
          return () => {
            window.removeEventListener('deviceorientation', onOrient, true);
            window.removeEventListener('deviceorientationabsolute', onOrient, true);
          };
        }
        ```
    *   Calling context in iOS (line 198): `<button onClick={startOrientation} ...>`
*   **Date Slicing/Conversion**:
    *   `ScavengerHuntsPanel.jsx` (lines 113-114):
        ```javascript
        start_date: new Date(editingHunt.start_date_local).toISOString(),
        end_date: new Date(editingHunt.end_date_local).toISOString(),
        ```

---

## 2. Logic Chain

From these observations, we trace the following logic chains:

### Security Vulnerability: Data Exposure of Private Hunts
1. `api.listHunts()` (Observation 385) performs a wildcard select `select("*")` on the `hunts` table with no database-level filters (RLS or SQL `WHERE`) for creator or visibility.
2. In `ScavengerHuntsPanel.jsx` (Observation 46), the page loads the results of `api.listHunts()` unconditionally into the local `hunts` React state array.
3. Filtering for privacy (e.g. `visibility === 'public'` or `creator === uname`) is done exclusively on the client side during rendering (Observation 680, 798, 1323).
4. **Conclusion**: Any authenticated or guest user loading the scavenger hunt panel receives all data for all private hunts in their browser's memory, including secret names, descriptions, and the complete completion messages and completion URLs (which often contain private links, access codes, or reward coupons).

### Bug: Compass Event Listener Memory Leak on iOS
1. In iOS Safari, device orientation requires explicit user permission. `HuntRadarOverlay.jsx` handles this via a button click calling `startOrientation()` (Observation 198).
2. `startOrientation()` adds the `deviceorientation` event listener to `window` and returns a cleanup function to remove it (Observation 92).
3. The button click handler `onClick={startOrientation}` discards the returned cleanup function.
4. **Conclusion**: When the `HuntRadarOverlay` component is closed and unmounts, the orientation event listener is never removed on iOS devices. Rotating the device will call `setHeading` on an unmounted component, causing memory leaks and React errors.

### Bug: Double-Submit / Race Condition in "Verify" Action
1. The "Verify" button for trail links in `ScavengerHuntsPanel.jsx` (Observation 1593) triggers `logModifierAction('create_trail', 150)` on click.
2. Unlike the check-in button, `logModifierAction` does not set a loading state or disable the button during the execution of its asynchronous requests.
3. The function checks if the task is already logged using `activityLogs` state: `const alreadyLogged = activityLogs.some(...)` (Observation 551).
4. `activityLogs` is only updated *after* the asynchronous calls complete (`await api.getHuntActivityLogs(...)` at line 558).
5. **Conclusion**: If a user clicks the "Verify" button multiple times quickly, multiple concurrent calls to `logModifierAction` will execute. Since the state is not yet updated, they will all pass the `alreadyLogged` check, insert duplicate rows into `hunt_activity_logs`, and credit the user with duplicate points.

### Bug: App Crash on Missing Dates
1. In both `AddScavengerHunt.jsx` (Observation 96-97) and `ScavengerHuntsPanel.jsx` (Observation 113-114), saving a hunt performs `new Date(value).toISOString()`.
2. There is no form validation checks on whether these date inputs are empty.
3. **Conclusion**: If a user clears the HTML date pickers (resulting in empty strings) and clicks save, the app will execute `new Date("").toISOString()`, throwing a `RangeError: Invalid time value` and crashing the application.

---

## 3. Caveats

*   **Database Constraints**: The database schemas and foreign key constraints were inferred from Javascript API calls; direct Supabase schema definition files (SQL migrations) were not reviewed. If there is a database-level unique constraint on `(participant_id, step_id, activity_type)` in the `hunt_activity_logs` table, it would prevent duplicate point inserts, but would cause API promise rejections.
*   **Network Performance**: In offline mode, the behavior of these APIs depends on a Service Worker or IndexedDB setup. If offline queueing is active, race conditions on button clicks might resolve differently depending on synchronization ordering.

---

## 4. Conclusion

The scavenger hunt feature exhibits a functional and structured architecture, but contains critical flaws that need immediate attention before production:
1.  **High-Risk Data Leak**: Private hunts data (including completion URLs) is sent to all clients via `listHunts()`. RLS policies or API filters must be added to restrict row returns.
2.  **State Sync Issues & Race Conditions**: Point calculations are done on the client side and written back to the database, leaving them open to lost updates. Verification buttons lack loading locks, leading to duplicate point exploits.
3.  **Sensor Jitter / Fighting on Android**: Registering both orientation listeners simultaneously causes Android compasses to oscillate rapidly. A mutual exclusion check is needed.
4.  **iOS Memory Leak**: compass listener cleanup is lost when orientation permission is requested via button clicks on iOS.

---

## 5. Verification Method

To verify these findings:

### 1. Verification of Private Hunt Data Leakage
1. Open the browser's developer console on the Pinmap application.
2. Run `api.listHunts().then(console.log)`.
3. Verify that the output array contains hunts created by other users where `visibility === 'private'` and inspect their `completion_url` properties.

### 2. Verification of Android Compass Needle Fighting
1. Open `HuntRadarOverlay.jsx` on an Android phone using Chrome.
2. Enable GPS and rotate the device. Observe if the compass dial jumps sporadically between the relative bearing (from device start) and the absolute magnetic bearing.

### 3. Verification of iOS Event Listener Memory Leak
1. Open `HuntRadarOverlay.jsx` on an iOS device.
2. Grant compass permission via the button.
3. Close the radar overlay (unmount the component).
4. Rotate the iOS device and observe if `onOrient` console logs or React state-update warnings are printed.
