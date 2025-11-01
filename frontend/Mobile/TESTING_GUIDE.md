# Mobile V2 - Unsynced Activities Testing Guide

## 📋 Overview
This guide provides step-by-step testing instructions for the new Unsynced Activities Management System with validation, duplicate detection, and fix capabilities.

---

## 🎯 Features to Test

### 1. Activity Validation System
- ✅ Required field checks (ID, userId, name, timestamps)
- ✅ Data integrity (distance > 0, duration > 0)
- ✅ GPS quality (accuracy, point count, stationary detection)
- ✅ Cross-validation (duration vs timestamps, pace calculation)
- ✅ 3-level severity: ERROR (🔴), WARNING (🟡), VALID (✅)

### 2. Duplicate Detection
- ✅ Compare local activities with Strava activities
- ✅ Weighted similarity scoring (6 metrics)
- ✅ Confidence levels: NONE, LOW, MEDIUM, HIGH, CERTAIN
- ✅ Side-by-side comparison dialog
- ✅ Prevent duplicate uploads

### 3. Fix Activity Dialog
- ✅ Edit activity details (name, type, distance, duration, calories)
- ✅ Real-time validation as user types
- ✅ Duration parser (HH:MM:SS or MM:SS format)
- ✅ Auto-recalculate pace on save

### 4. Enhanced UI
- ✅ Summary card (ready count, error count, duplicate count)
- ✅ Color-coded activity cards
- ✅ Validation icons (✅/⚠️/❌)
- ✅ Per-activity sync with progress indicator
- ✅ Three action dialogs: Fix, Delete, Compare

---

## 🧪 Test Scenarios

### Scenario 1: View Unsynced Activities with Validation

**Steps:**
1. Open Mobile V2 app
2. Navigate to **Profile** → **Unsynced Activities**
3. Observe the summary card at top

**Expected Results:**
- Summary shows: "X gatavi sinhronizācijai" (ready count)
- Summary shows: "Y ar kļūdām" (error count)
- Summary shows: "Z iespējamie dublikāti" (duplicate count)
- Total count matches number of unsynced activities

**Validation:**
- Each activity card displays validation icon:
  - ✅ Green checkmark = Valid, ready to sync
  - ⚠️ Yellow warning = Has warnings but syncable
  - ❌ Red X = Has errors, needs fixing

---

### Scenario 2: Fix Activity with Missing Data

**Steps:**
1. Find activity card with ❌ red icon
2. Expand card to see validation issues
3. Tap **LABOT** button
4. Fix Activity Dialog opens

**Expected Dialog Content:**
- Red panel at top showing all validation errors
- Editable fields:
  - **Nosaukums** (Name) - Text input
  - **Tips** (Type) - Dropdown (RUNNING, WALKING, CYCLING, HIKING)
  - **Distance (km)** - Decimal input
  - **Ilgums (HH:MM:SS)** - Duration input
  - **Kalorijas** - Integer input
- **Saglabāt** button enabled only when all errors fixed

**Test Cases:**

**TC1: Fix Missing Name**
1. Leave name field empty
2. Observe error: "Nosaukums nedrīkst būt tukšs"
3. Enter name: "Rīta skrējiens"
4. Error disappears, Save button enabled

**TC2: Fix Invalid Distance**
1. Enter "0" in distance field
2. Observe error: "Distance jābūt lielākai par 0"
3. Enter "5.5" (5.5 km)
4. Error disappears

**TC3: Fix Duration Format**
1. Enter duration in various formats:
   - "1:23:45" → Accepted (1h 23m 45s)
   - "23:45" → Accepted (23m 45s)
   - "1:75:00" → Error: "Nederīgs ilguma formāts"
   - "abc" → Error: "Nederīgs ilguma formāts"
2. Enter valid duration: "45:30"
3. Tap **Saglabāt**
4. Dialog closes, activity card updates with new values
5. Validation icon changes from ❌ to ✅

---

### Scenario 3: Detect and Handle Duplicates

**Prerequisites:**
- Have at least 1 activity synced to Strava
- Have similar local activity not yet synced

**Steps:**
1. View unsynced activities list
2. Find activity card with red/orange background (duplicate warning)
3. Observe warning banner: "⚠️ Iespējams dublikāts"
4. Tap **Salīdzināt** button

**Expected Duplicate Comparison Dialog:**

**Left Column (Local Activity):**
- Activity name
- Type
- Distance (km)
- Duration
- Start time
- GPS points count
- Calories

**Right Column (Strava Activity):**
- Same fields for comparison

**Similarity Panel:**
- Similarity score: X% (0-100%)
- Confidence: LOW/MEDIUM/HIGH/CERTAIN
- Match reasons (bullet list):
  - "Laika starpība: X minūtes"
  - "Distance atšķirība: X km"
  - "Ilguma atšķirība: X minūtes"
  - etc.

**Test Cases:**

**TC1: Certain Duplicate (Score > 90%)**
- Same start time (within 5 min)
- Same distance (within 100m)
- Same duration (within 1 min)
- Same type
- **Result:** Confidence = CERTAIN, red background

**TC2: Probable Duplicate (Score 70-90%)**
- Similar time (within 30 min)
- Similar distance (within 500m)
- Different type
- **Result:** Confidence = HIGH, orange background

**TC3: Possible Duplicate (Score 50-70%)**
- Same day but different hour
- Similar distance
- **Result:** Confidence = MEDIUM, yellow background

**User Action:**
1. If duplicate confirmed → Tap **Dzēst** (Delete) to remove local copy
2. If NOT duplicate → Tap **Aizvērt** and proceed to sync

---

### Scenario 4: Sync Activities One-by-One

**Steps:**
1. Find activity with ✅ green validation icon
2. Ensure no duplicate warnings (or duplicate checked and dismissed)
3. Tap **SINHRONIZĒT** button

**Expected Behavior:**
- Button changes to:
  - Spinner icon (CircularProgressIndicator)
  - Text: "Sinhronizē..."
  - Button disabled during sync
- After sync completes:
  - Activity disappears from list (moved to synced)
  - Summary card updates count (-1 from unsynced)
  - If sync fails:
    - Error snackbar appears: "Neizdevās sinhronizēt: [error reason]"
    - Activity remains in list
    - Button returns to "SINHRONIZĒT" state

**Test Cases:**

**TC1: Successful Sync**
1. Sync valid activity
2. Wait 2-5 seconds
3. Activity removed from list
4. Check backend/Strava to confirm upload
5. Summary count decreases

**TC2: Failed Sync (Network Error)**
1. Turn off WiFi/mobile data
2. Tap SINHRONIZĒT
3. Error snackbar: "Neizdevās sinhronizēt: Network error"
4. Activity remains in list
5. Restore network, retry sync

**TC3: Failed Sync (Validation Error)**
1. Try to sync activity with ❌ icon
2. Button should be disabled
3. Tooltip/message: "Lūdzu, salabo kļūdas pirms sinhronizācijas"

---

### Scenario 5: Delete Activity

**Steps:**
1. Find any activity card
2. Tap 🗑️ **Delete** icon button (right side)
3. Confirmation dialog appears

**Expected Dialog:**
- Title: "Dzēst aktivitāti?"
- Message: "Šī darbība ir neatgriezeniska. Aktivitāte 'X' tiks dzēsta no ierīces."
- Buttons:
  - **Atcelt** (Cancel) - gray
  - **Dzēst** (Delete) - red

**Test Cases:**

**TC1: Confirm Delete**
1. Tap **Dzēst**
2. Activity immediately removed from list
3. Summary count updates
4. Check local database: activity deleted

**TC2: Cancel Delete**
1. Tap **Atcelt**
2. Dialog closes
3. Activity remains in list

---

## 🔍 Validation Rules Reference

### Required Fields (ERROR if missing)
| Field | Validation |
|-------|-----------|
| ID | Must not be blank |
| User ID | Must not be blank |
| Name | Must not be blank |
| Start Time | Must be valid Date |

### Data Integrity (ERROR)
| Field | Rule |
|-------|------|
| Distance | Must be > 0 meters |
| Duration | Must be > 0 milliseconds |
| GPS Points | Must have at least 1 point |
| End Time | Must be after Start Time |

### GPS Quality (WARNING)
| Issue | Threshold |
|-------|-----------|
| Low accuracy points | > 50% with accuracy > 50m |
| Stationary points | > 30% with speed < 0.5 m/s |
| Missing altitude | > 50% points without altitude |

### Cross-Validation (WARNING)
| Check | Tolerance |
|-------|-----------|
| Duration vs Timestamps | ± 1 minute |
| Average Pace | Must be reasonable (2-20 min/km for running) |
| Calories | Should be proportional to distance/duration |

---

## 🎨 UI Color Coding

| Color | Meaning | Example |
|-------|---------|---------|
| 🟢 Green background | Valid, ready to sync | No errors, no warnings |
| 🟡 Yellow background | Has warnings | Low GPS accuracy |
| 🔴 Light red background | Has errors | Missing name or distance |
| 🔴 Red background | Duplicate detected | Certain/High confidence match |
| ⚪ White/gray | Unknown status | Not yet validated |

---

## 📊 Test Data Setup

### Create Test Activities:

**1. Valid Activity:**
```kotlin
Activity(
    id = UUID.randomUUID().toString(),
    userId = "test-user",
    type = ActivityType.RUNNING,
    name = "Morning Run",
    startTime = Date(),
    endTime = Date(System.currentTimeMillis() + 30*60*1000), // 30 min
    totalDistance = 5000.0, // 5 km
    totalDuration = 1800000L, // 30 min
    averagePace = 360.0, // 6:00 min/km
    calories = 300,
    status = ActivityStatus.COMPLETED,
    gpsPoints = listOf(/* 50+ GPS points */),
    isSynced = false
)
```

**2. Activity with Errors:**
```kotlin
Activity(
    id = "", // ERROR: missing ID
    userId = "test-user",
    type = ActivityType.RUNNING,
    name = "", // ERROR: missing name
    startTime = Date(),
    endTime = null, // WARNING: no end time
    totalDistance = 0.0, // ERROR: zero distance
    totalDuration = 0L, // ERROR: zero duration
    gpsPoints = emptyList(), // ERROR: no GPS points
    isSynced = false
)
```

**3. Activity with Warnings:**
```kotlin
Activity(
    id = UUID.randomUUID().toString(),
    userId = "test-user",
    type = ActivityType.RUNNING,
    name = "Evening Run",
    startTime = Date(System.currentTimeMillis() - 3600000),
    endTime = Date(),
    totalDistance = 3000.0,
    totalDuration = 900000L, // 15 min
    gpsPoints = listOf(
        // 60% points with low accuracy (>50m)
        GpsPoint(lat=56.9, lon=24.1, accuracy=80f),
        GpsPoint(lat=56.91, lon=24.11, accuracy=90f),
        // ...
    ),
    isSynced = false
)
```

---

## ✅ Acceptance Criteria

### Must Pass:
- [ ] All validation rules correctly identify errors and warnings
- [ ] Fix dialog successfully saves corrected data
- [ ] Duplicate detection algorithm identifies >90% of true duplicates
- [ ] False positive rate for duplicates < 10%
- [ ] Sync button shows progress indicator during upload
- [ ] Activities disappear from list after successful sync
- [ ] Delete confirmation prevents accidental deletions
- [ ] Summary card always shows accurate counts

### Performance:
- [ ] Validation runs in < 100ms per activity
- [ ] Duplicate detection completes in < 500ms for 30 Strava activities
- [ ] UI remains responsive during sync operations
- [ ] No memory leaks after 100+ activity operations

### Edge Cases:
- [ ] Handle activities with 0 GPS points gracefully
- [ ] Handle activities with very long names (>100 chars)
- [ ] Handle activities with extreme durations (>24 hours)
- [ ] Handle activities with future timestamps
- [ ] Handle network timeout during sync
- [ ] Handle backend 400/500 errors during sync

---

## 🐛 Known Issues / Limitations

1. **Duplicate detection** relies on Strava activities being fetched first
   - If Strava API call fails, no duplicate warnings shown
   - Max 30 recent Strava activities compared (API limit)

2. **GPS point editing** not yet supported in Fix dialog
   - Can only edit metadata (name, type, distance, etc.)
   - Cannot add/remove/modify GPS points

3. **Batch sync** not implemented
   - Must sync activities one-by-one
   - Future: "Sinhronizēt visu" button

4. **Offline mode** validation
   - Validation runs locally without backend checks
   - May pass validation but fail sync due to backend rules

---

## 📞 Support

If tests fail or unexpected behavior occurs:
1. Check logcat for detailed error messages
2. Verify network connectivity
3. Check Strava API token validity
4. Review backend API logs for 400/500 errors
5. Contact development team with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots
   - Logcat output

---

**Version:** 1.17.97
**Last Updated:** 2025-01-XX
**Component:** Mobile / UnsyncedActivitiesScreen
