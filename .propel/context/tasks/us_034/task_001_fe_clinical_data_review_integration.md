# Task - TASK_001_FE_CLINICAL_DATA_REVIEW_INTEGRATION

## Requirement Reference
- User Story: US_034
- Story Location: `.propel/context/tasks/us_034/us_034.md`
- Acceptance Criteria:
    - AC1: Unified profile displays Demographics, Chief Complaint, Medical History, Medications, Allergies, Lab Results, Previous Visits sections aggregated from all documents
    - AC2: Conflicts highlighted in yellow with diff view showing source documents, "Resolve Conflict" action
    - AC3: ICD-10/CPT coding section shows AI-generated codes with confidence scores, edit/approve/reject actions
    - AC4: Medication conflict alert banner (red) displays drug interactions with severity + clinical guidance
- Edge Cases:
    - Document still processing: Show "Processing..." with ETA, allow partial review
    - AI confidence <90%: Mark "Needs Review" with yellow badge
    - Historical versions tracked: "View History" button shows audit timeline

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes (Unified clinical review page) |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-010 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-010-clinical-data-review.html |
| **Screen Spec** | SCR-010 (Clinical Data Review) |
| **UXR Requirements** | UXR-101 (WCAG AA), UXR-302 (Medical-grade 7:1 contrast), UXR-401 (Loading states), UXR-502 (Clear error messages), AIR-O02 (Human override) |
| **Design Tokens** | Conflict highlight: yellow #FFF3CD bg, AI confidence: green ≥90% / yellow <90%, Alert banner: red #DC3545 bg, Tab navigation: border-bottom active #007BFF, "Resolve" button: primary #007BFF |

> **Wireframe Components:**
> - Header: Patient name, MRN, DOB, photo, last visit date, alert banner (medication conflicts)
> - Tab navigation: Demographics/Medical History/Medications/Allergies/Lab Results/Visits/Documents/Coding
> - Conflict highlighting: Yellow background on conflicting fields, "View Sources" dropdown (document origins), "Resolve" button opens DiffComparisonModal
> - Medication conflict alert: Red banner at top, drug names, interaction severity (High/Medium/Low), clinical guidance, "Acknowledge" button
> - Medical coding panel: Table (Code, Description, Confidence %, Source, Status, Actions: Edit/Approve/Reject)
> - AI confidence indicator: Green badge (≥90%), Yellow badge (<90% "Needs Review"), Gray (manual entry)
> - Edit mode: Inline editing, "Save Changes" button, auto-save draft every 30s
> - Document reference links: Each field shows source docs, click opens document viewer
> - Accessibility: Screen reader announces conflict count on load, keyboard shortcuts (C=resolve conflict, M=medication details)

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.2.x |
| Frontend | TypeScript | 5.3.x |
| Frontend | React Router | 6.x |
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.x |
| Database | PostgreSQL | 16.x |
| AI/ML | OpenAI | GPT-4 Turbo |

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | Yes (Integrates AI features) |
| **AIR Requirements** | AIR-003 (Profile synthesis), AIR-004 (Medical coding), AIR-S01 (Conflict detection >95%), AIR-S02 (ICD-10 accuracy >98%), AIR-S03 (Medication conflicts >99%), AIR-O02 (Human override) |
| **AI Pattern** | Integration of US_031 (profile generation), US_032 (medical coding), US_033 (medication conflicts) |
| **Prompt Template Path** | N/A (Uses AI outputs from dependent tasks) |
| **Guardrails Config** | .propel/context/ai-guardrails/clinical-review-config.json |
| **Model Provider** | OpenAI GPT-4 (via dependent services) |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | Yes (Responsive layout) |
| **Platform Target** | Web |
| **Min OS Version** | iOS 14+, Android 10+ |
| **Mobile Framework** | React |

## Task Overview
Implement Clinical Data Review Integration page: (1) ClinicalDataReview page fetches unified patient profile from GET /api/patients/:id/unified-profile (from US_031), (2) Display sections: Demographics, ChiefComplaint, MedicalHistory, CurrentMedications, Allergies, LabResults, PreviousVisits with data from profile JSON, (3) Conflict highlighting: Fields with profile.conflicts[] array show yellow background + "View Sources" dropdown listing source documents + "Resolve" button opens DiffComparisonModal showing side-by-side document diff, (4) Medical coding integration: MedicalCodingTab component (from US_032) displays ICD-10/CPT codes table with confidence scores, Edit/Approve/Reject actions, (5) Medication conflict integration: MedicationConflictBanner component (from US_033) shows red alert if profile.medicationConflicts.length > 0, displays drug interactions with severity + clinical guidance, "Acknowledge" button logs staff acknowledgment, (6) Document extraction status: If profile.extractionStatus='processing', show "Processing..." badge with ETA, allow partial review, (7) AI confidence indicators: Green badge (≥90%), Yellow badge (<90% with "Needs Review"), Gray (manual entry), (8) Edit mode: Click "Edit" button enables inline editing, auto-saves draft every 30s to localStorage, "Save Changes" button calls PATCH /api/patients/:id/unified-profile, (9) Historical versions: "View History" button opens audit timeline modal showing conflict resolutions with timestamps + staff who resolved, (10) Keyboard shortcuts: C key=resolve conflict, M key=medication details, Esc=close modal.

## Dependent Tasks
- US_031 Task 002: Unified profile generation API (provides GET /api/patients/:id/unified-profile)
- US_032 Task 001: Medical coding AI (MedicalCodingTab component)
- US_033 Task 001: Medication conflict detection (MedicationConflictBanner component)
- US_029 Task 001: Document extraction service (extraction status)

## Impacted Components
**New:**
- app/src/pages/ClinicalDataReview.tsx (Main review page)
- app/src/components/PatientProfileHeader.tsx (Header with patient details + alert banner)
- app/src/components/ProfileTabs.tsx (Tab navigation)
- app/src/components/DemographicsSection.tsx (Demographics display)
- app/src/components/MedicalHistorySection.tsx (History display)
- app/src/components/MedicationsSection.tsx (Medications display + conflict alerts)
- app/src/components/AllergiesSection.tsx (Allergies display)
- app/src/components/LabResultsSection.tsx (Lab results display)
- app/src/components/VisitsSection.tsx (Previous visits display)
- app/src/components/ConflictHighlighter.tsx (Yellow highlight + "View Sources" + "Resolve")
- app/src/components/DiffComparisonModal.tsx (Side-by-side document diff)
- app/src/components/AIConfidenceBadge.tsx (Green/Yellow/Gray badge)
- app/src/components/ViewHistoryModal.tsx (Audit timeline)
- app/src/hooks/useClinicalProfile.ts (Fetch unified profile)
- app/src/hooks/useAutoSave.ts (Auto-save draft every 30s)

**Modified:**
- app/src/App.tsx (Add /clinical-review/:patientId route)

## Implementation Plan
1. Create useClinicalProfile hook:
   - Fetch GET /api/patients/:patientId/unified-profile
   - Returns {profile, conflicts, medicationConflicts, codingSuggestions, extractionStatus, isLoading}
2. PatientProfileHeader component:
   - Display patient.name, patient.mrn, patient.dob, patient.photo, lastVisit
   - If medicationConflicts.length > 0, show MedicationConflictBanner (red alert banner from US_033)
3. ProfileTabs component:
   - Tabs: Demographics/Medical History/Medications/Allergies/Lab Results/Visits/Documents/Coding
   - Active tab underlined with primary color
4. Demographics/MedicalHistory/Medications/Allergies/LabResults/Visits sections:
   - Display data from profile.demographics, profile.medicalHistory, etc.
   - Each field: ConflictHighlighter wrapper checks if field.path in conflicts[] array
5. ConflictHighlighter:
   - If conflict exists: yellow background, "View Sources" dropdown (lists source documents), "Resolve" button
   - Click "Resolve": Open DiffComparisonModal with side-by-side view
6. DiffComparisonModal:
   - Shows document A value vs document B value side-by-side
   - Radio buttons: "Select A", "Select B", "Merge Custom" (textarea)
   - "Confirm" button: POST /api/patients/:patientId/resolve-conflict {fieldPath, selectedValue}
7. MedicalCodingTab (from US_032):
   - Display ICD-10/CPT codes table, integrate with coding API
   - Confidence scores: Green (≥95%), Yellow (<95%)
8. MedicationConflictBanner (from US_033):
   - Red banner, drug names, interaction details, "Acknowledge" button
9. AIConfidenceBadge:
   - Green badge (≥90% confidence): "High Confidence"
   - Yellow badge (<90%): "Needs Review"
   - Gray badge: "Manual Entry"
10. Edit mode:
    - "Edit" button enables contentEditable on fields
    - useAutoSave hook: useEffect with 30s interval, localStorage.setItem('profile-draft-{patientId}', JSON.stringify(editedProfile))
    - "Save Changes": PATCH /api/patients/:patientId/unified-profile, clear draft
11. ViewHistoryModal:
    - Fetch GET /api/audit-logs?entity_id={patientId}&action_type=conflict_resolved
    - Display timeline: Date, Staff Name, Field Changed, Old → New Value
12. Keyboard shortcuts:
    - useEffect: document.addEventListener('keydown', handleKeyPress)
    - C key: Focus first conflict "Resolve" button
    - M key: Scroll to medications section
    - Esc: Close open modal
13. Extraction status:
    - If extractionStatus='processing': Show "Processing..." badge with spinner + ETA
    - If extractionStatus='failed': Show "Extraction Failed" error message

## Current Project State
```
ASSIGNMENT/
├── app/src/pages/ (user management exists)
├── app/src/components/ (some components exist from US_032, US_033)
└── (clinical data review integration to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/pages/ClinicalDataReview.tsx | Main review page |
| CREATE | app/src/components/PatientProfileHeader.tsx | Header component |
| CREATE | app/src/components/ProfileTabs.tsx | Tab navigation |
| CREATE | app/src/components/DemographicsSection.tsx | Demographics |
| CREATE | app/src/components/MedicalHistorySection.tsx | Medical history |
| CREATE | app/src/components/MedicationsSection.tsx | Medications |
| CREATE | app/src/components/AllergiesSection.tsx | Allergies |
| CREATE | app/src/components/LabResultsSection.tsx | Lab results |
| CREATE | app/src/components/VisitsSection.tsx | Visits |
| CREATE | app/src/components/ConflictHighlighter.tsx | Conflict indicator |
| CREATE | app/src/components/DiffComparisonModal.tsx | Diff modal |
| CREATE | app/src/components/AIConfidenceBadge.tsx | Confidence badge |
| CREATE | app/src/components/ViewHistoryModal.tsx | History timeline |
| CREATE | app/src/hooks/useClinicalProfile.ts | Profile hook |
| CREATE | app/src/hooks/useAutoSave.ts | Auto-save hook |
| UPDATE | app/src/App.tsx | Add route |

## External References
- [FR-007 Unified Patient Profile](../../../.propel/context/docs/spec.md#FR-007)
- [FR-008 Medical Coding](../../../.propel/context/docs/spec.md#FR-008)
- [FR-016 Medication Conflicts](../../../.propel/context/docs/spec.md#FR-016)
- [AIR-S01 Conflict Detection >95%](../../../.propel/context/docs/spec.md#AIR-S01)
- [AIR-S02 Medical Coding >98%](../../../.propel/context/docs/spec.md#AIR-S02)
- [AIR-S03 Medication Conflicts >99%](../../../.propel/context/docs/spec.md#AIR-S03)

## Build Commands
```bash
cd app
npm run dev
```

## Implementation Validation Strategy
- [ ] Unit tests: useClinicalProfile fetches unified profile
- [ ] Integration tests: ClinicalDataReview renders all sections
- [ ] Profile fetch: Navigate to /clinical-review/patient-uuid → GET /api/patients/:id/unified-profile called
- [ ] Header: Displays patient name, MRN, DOB, photo, last visit date
- [ ] Alert banner: If medication conflicts exist → red banner shows at top
- [ ] Tab navigation: Click tabs → switches between Demographics/Medical History/Medications/etc.
- [ ] Demographics section: Displays patient.address, patient.phone, patient.emergencyContact
- [ ] Medical history: Displays conditions, surgeries, family history from profile
- [ ] Medications: Lists current medications with drug name, dosage, frequency
- [ ] Conflict highlighting: Field with conflict → yellow background + "View Sources" dropdown
- [ ] View sources: Click dropdown → shows document names (e.g., "Document from 2024-01-10")
- [ ] Resolve conflict: Click "Resolve" → DiffComparisonModal opens with side-by-side view
- [ ] Diff modal: Shows Document A value vs Document B value, radio buttons for selection
- [ ] Resolve confirmation: Select value → click "Confirm" → POST /resolve-conflict → conflict resolved
- [ ] Medical coding tab: Click "Coding" tab → MedicalCodingTab from US_032 displays ICD-10 codes
- [ ] Coding confidence: Codes with ≥95% → green badge, <95% → yellow "Needs Review"
- [ ] Medication conflict alert: Conflicts detected → MedicationConflictBanner shows red alert
- [ ] Acknowledge conflict: Click "Acknowledge" → logs staff acknowledgment to audit
- [ ] AI confidence badge: AI-generated fields show green (≥90%) or yellow (<90%) badge
- [ ] Edit mode: Click "Edit" → fields become editable, "Save Changes" button appears
- [ ] Auto-save: Edit fields → wait 30s → draft saved to localStorage
- [ ] Save changes: Click "Save Changes" → PATCH /api/patients/:id/unified-profile → success toast
- [ ] View history: Click "View History" → ViewHistoryModal shows audit timeline
- [ ] History timeline: Displays date, staff name, field changed, old → new values
- [ ] Extraction status: Document processing → shows "Processing..." badge with spinner + ETA
- [ ] Keyboard shortcut C: Press C key → focuses first "Resolve" button
- [ ] Keyboard shortcut M: Press M key → scrolls to medications section
- [ ] Keyboard shortcut Esc: Press Esc → closes open modal
- [ ] Responsive: Mobile view stacks sections vertically, desktop shows sidebar navigation
- [ ] WCAG AA: Screen reader announces conflict count on load, keyboard Tab navigation works, 4.5:1 contrast

## Implementation Checklist
- [ ] Create useClinicalProfile.ts hook with profile fetch
- [ ] Create useAutoSave.ts hook with 30s interval
- [ ] Implement ClinicalDataReview.tsx page
- [ ] Create PatientProfileHeader.tsx with alert banner
- [ ] Create ProfileTabs.tsx navigation
- [ ] Create section components (Demographics, MedicalHistory, Medications, Allergies, LabResults, Visits)
- [ ] Implement ConflictHighlighter.tsx with yellow highlight + dropdown
- [ ] Create DiffComparisonModal.tsx with side-by-side diff
- [ ] Create AIConfidenceBadge.tsx (green/yellow/gray)
- [ ] Create ViewHistoryModal.tsx with audit timeline
- [ ] Integrate MedicalCodingTab from US_032
- [ ] Integrate MedicationConflictBanner from US_033
- [ ] Implement edit mode with auto-save
- [ ] Add keyboard shortcuts (C, M, Esc)
- [ ] Add /clinical-review/:patientId route to App.tsx
- [ ] Test conflict resolution flow
- [ ] Test integration with medical coding + medication conflicts
- [ ] Validate WCAG AA compliance
- [ ] Document clinical review page in app/README.md
