# Onboarding Sliders Documentation

## Pārskats / Overview

DeyaRun Web aplikācijai ir divpakāpju onboarding sistēma:
- **Stage 1**: Welcome Slider - Iepazīšanās ar aplikāciju
- **Stage 2**: Profile Setup - Lietotāja anketas aizpildīšana

## Stage 1: Welcome Slider (`/welcome`)

### Funkcionalitāte
- 5 interaktīvi slaidi, kas iepazīstina ar aplikācijas iespējām
- Smooth animācijas (Framer Motion)
- Progress dots indikators
- "Izlaist" poga (top-right corner)
- "Tālāk" / "Sākt" pogas

### Slaidi
1. **Sveicināti DeyaRun** - Hero + tagline
2. **Sekojiet Saviem Skrējieniem** - GPS tracking preview
3. **Personalizēti Treniņi** - AI training plans
4. **Savienojiet Ierīces** - Strava, Garmin, GoogleFit
5. **Sasniedziet Mērķus** - Progress tracking

### Navigācija
- Swipe/Arrow navigation
- Click on progress dots
- Skip button → `/profile-setup`
- "Sākt" button → `/profile-setup`

## Stage 2: Profile Setup Form (`/profile-setup`)

### Multi-step Form (4 soļi)

#### Step 1: Pamata Informācija
**Obligātie lauki:**
- Pilns vārds (min 2 chars)
- Dzimšanas datums (13-100 gadi)
- Dzimums (Male/Female/Other)
- Svars (30-250 kg)
- Augums (100-250 cm)

#### Step 2: Skriešanas Pieredze
**Obligātie lauki:**
- Skriešanas līmenis:
  - Iesācējs (Beginner)
  - Vidējs (Intermediate)
  - Progresīvs (Advanced)
  - Elites (Elite)
- Cik gadus skrien? (0-50 gadi)
- Nedēļas distance (0-10, 10-20, 20-30, 30-40, 40-50, 50+ km)

**Neobligātie lauki:**
- Personīgie rekordi (MM:SS vai HH:MM:SS formātā):
  - 5K laiks
  - 10K laiks
  - Pusmaratons
  - Maratons

#### Step 3: Treniņu Mērķi
**Obligātie lauki:**
- Galvenais mērķis:
  - Zaudēt svaru
  - Uzlabot izturību
  - Palielināt ātrumu
  - Pirmais 5K / 10K / pusmaratons / maratons
  - Uzlabot vispārējo fizisko formu
- Treniņu dienas nedēļā (slider 1-7)
- Vēlamais treniņa laiks (checkboxes):
  - Rīts (6:00 - 10:00)
  - Diena (10:00 - 17:00)
  - Vakars (17:00 - 22:00)

**Neobligātie lauki:**
- Mērķa sacensību datums

#### Step 4: Veselības Informācija
**Neobligātie lauki:**
- Traumu vēsture (textarea)
- Pašreizējās sāpes/traumas (textarea)
- Medicīniskie stāvokļi (textarea)
- Medikamenti (textarea)

**Obligātie lauki:**
- Consent checkbox: "Apstiprinu, ka sniegtā informācija ir patiesa"

## Tehniskā Implementācija

### Komponentes
```
components/onboarding/
├── WelcomeSlider.tsx       # Stage 1 slider
├── ProfileSetupForm.tsx    # Stage 2 multi-step form
├── StepIndicator.tsx       # Progress bar component
└── index.ts                # Named exports
```

### Validation
```typescript
// lib/validations/onboarding.ts
import { z } from 'zod';

export const basicInfoSchema = z.object({
  fullName: z.string().min(2, 'Vārdam jābūt vismaz 2 simboliem'),
  dateOfBirth: z.string().refine(...),
  gender: z.enum(['male', 'female', 'other']),
  weight: z.number().min(30).max(250),
  height: z.number().min(100).max(250)
});
```

Visas kļūdu ziņas ir latviešu valodā.

### Type Definitions
```typescript
// types/onboarding.ts
export interface OnboardingData {
  basicInfo: BasicInfo;
  runningExperience: RunningExperience;
  trainingGoals: TrainingGoals;
  healthInfo: HealthInfo;
}
```

### API Integration

**Endpoint:** `POST https://api.deyarun.com/api/users/onboarding`

**Headers:**
```typescript
{
  'Authorization': 'Bearer {token}',
  'Content-Type': 'application/json'
}
```

**Request Body:**
```json
{
  "basicInfo": {
    "fullName": "Jānis Bērziņš",
    "dateOfBirth": "1990-05-15",
    "gender": "male",
    "weight": 75,
    "height": 180
  },
  "runningExperience": {
    "level": "intermediate",
    "yearsExperience": 3,
    "weeklyDistance": "20-30",
    "personalBests": {
      "fiveK": "23:45",
      "tenK": "48:30",
      "halfMarathon": "1:45:00",
      "marathon": "3:30:00"
    }
  },
  "trainingGoals": {
    "primaryGoal": "build_endurance",
    "targetRaceDate": "2025-06-15",
    "trainingDaysPerWeek": 4,
    "preferredTrainingTime": ["morning", "evening"]
  },
  "healthInfo": {
    "injuryHistory": "Ceļa trauma 2022",
    "currentInjuries": "",
    "medicalConditions": "",
    "medications": "",
    "consent": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding data saved successfully",
  "userId": "123456",
  "trainingPlanId": "plan-789"
}
```

## Features

### Auto-save
- Form data auto-saves to `localStorage` every 30 seconds
- Key: `onboarding-draft`
- Cleared after successful submission

### Error Handling
- Inline validation errors (Latvian)
- Network error toasts
- Retry logic for failed API calls
- Fallback: Save to localStorage if backend unreachable

### Navigation Flow
```
/welcome → Skip/Complete → /profile-setup → Complete → /dashboard
                                           ↓
                                    localStorage draft
                                           ↓
                                    Resume on return
```

### Accessibility
- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader friendly
- Touch-friendly controls (mobile)

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Touch gestures on mobile
- Optimized for tablets and desktops

## Izmantošana / Usage

### Routing Setup

Pievienot redirectus autentifikācijas sistēmā:

```typescript
// After successful registration/login
if (!user.onboardingCompleted) {
  router.push('/welcome');
}
```

### Customization

#### Mainīt Slideru Saturu
Edit `components/onboarding/WelcomeSlider.tsx`:
```typescript
const slides: Slide[] = [
  {
    id: 0,
    title: 'Your Title',
    description: 'Your description',
    icon: <YourIcon className="w-16 h-16" />,
    color: 'from-color-500 to-color-600'
  },
  // Add more slides...
];
```

#### Mainīt Form Lauku
Edit `components/onboarding/ProfileSetupForm.tsx`:
```typescript
// Add new field to Step component
<div>
  <label>Jauns lauks</label>
  <input {...register('newField')} />
</div>
```

Edit validation schema:
```typescript
// lib/validations/onboarding.ts
export const basicInfoSchema = z.object({
  // existing fields...
  newField: z.string().min(1, 'Obligāts lauks')
});
```

## Testing

### Manual Testing Checklist
- [ ] Welcome slider navigation darbojas
- [ ] Skip button aizved uz `/profile-setup`
- [ ] Visi 4 formas soļi pieejami
- [ ] Form validācija darbojas (Latvian messages)
- [ ] Auto-save uz localStorage (pārbaude: atsvaidzināt lapu)
- [ ] API submission darbojas
- [ ] Error handling (disconnect WiFi test)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Keyboard navigation

### Test Data
```json
{
  "fullName": "Test User",
  "dateOfBirth": "1995-01-01",
  "gender": "male",
  "weight": 70,
  "height": 175,
  "level": "intermediate",
  "yearsExperience": 2,
  "weeklyDistance": "20-30",
  "primaryGoal": "build_endurance",
  "trainingDaysPerWeek": 3,
  "preferredTrainingTime": ["morning"]
}
```

## Troubleshooting

### Issue: Form validation not working
**Solution:** Check Zod schema in `lib/validations/onboarding.ts`

### Issue: Auto-save not persisting
**Solution:** Check browser localStorage permissions

### Issue: API submission fails
**Solution:**
1. Check network tab for error details
2. Verify token in localStorage
3. Check backend endpoint availability

### Issue: Slides not animating
**Solution:** Verify `framer-motion` is installed:
```bash
npm install framer-motion
```

## Versija / Version
- Web: 1.17.91
- Created: 2025-10-01
- Dependencies: React 18, Next.js 14, Zod 4.0, Framer Motion 12
