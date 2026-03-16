# Architecture Design

## Project Overview
A unified healthcare platform for patient appointment booking and clinical data management. Target users include patients, staff (front desk/call center), and admins. The platform provides appointment scheduling, intake (AI/manual), reminders, document upload, clinical data extraction, and a trust-first clinical intelligence engine.

## Architecture Goals
- High reliability and uptime (99.9%)
- HIPAA-compliant data handling and audit logging
- Seamless, patient-centric experience
- Flexible intake (AI/manual) and booking flows
- Open-source, cost-effective deployment (no paid cloud)
- Robust user management and access control

## Non-Functional Requirements
- NFR-001: System MUST be 100% HIPAA-compliant in data handling, transmission, and storage
- NFR-002: System MUST provide strict role-based access control and immutable audit logging
- NFR-003: System MUST support native deployment on Windows Services/IIS and use PostgreSQL for structured data
- NFR-004: System MUST achieve 99.9% uptime and robust session management (15-minute timeout)
- NFR-005: [UNCLEAR] System MUST support high volume of patient dashboards and appointments without performance degradation (define "high volume")

## Data Requirements
- DR-001: System MUST store structured patient, appointment, and clinical data in PostgreSQL
- DR-002: System MUST ensure data integrity and de-duplication for patient profiles
- DR-003: System MUST retain audit logs immutably for compliance
- DR-004: System MUST support document upload and extraction for clinical data
- DR-005: System MUST support data migration and backup for all patient and appointment data
- DR-006: [UNCLEAR] System MUST define data retention period for clinical documents and audit logs

### Domain Entities
- Patient: Demographics, contact info, appointments, documents, intake data, no-show history
- Appointment: Date/time, type, status, reminders, risk score, staff notes
- Clinical Document: File, extracted data, coding (ICD-10, CPT), conflicts
- User: Role, permissions, audit log

## AI Consideration
**Status:** Applicable

**Rationale:** [AI-CANDIDATE] and [HYBRID] tags present in requirements (intake, data extraction, coding, conflict detection).

## AI Requirements
- AIR-001: System MUST provide AI-assisted conversational intake for patients
- AIR-002: System MUST extract structured data from uploaded clinical documents using AI
- AIR-003: System MUST map ICD-10 and CPT codes from aggregated data using AI
- AIR-004: System MUST highlight data and medication conflicts using AI
- AIR-005: [UNCLEAR] System MUST ensure >98% AI-Human agreement rate for clinical data/coding (define measurement method)

### AI Architecture Pattern
**Selected Pattern:** Hybrid (deterministic flows + AI for intake, extraction, coding, conflict detection)

## Architecture and Design Decisions
- Use PostgreSQL for structured data and Upstash Redis for caching
- Use open-source/free hosting (Netlify, Vercel, GitHub Codespaces)
- Use PlantUML for process flow diagrams
- Use role-based access control and immutable audit logging for compliance
- Use AI/ML for intake, document extraction, coding, and conflict detection

## Technology Stack
| Layer      | Technology                | Version | Justification (NFR/DR/AIR)         |
|------------|---------------------------|---------|------------------------------------|
| Frontend   | React (or Angular/Vue)    | latest  | NFR-001, NFR-004                   |
| Backend    | Node.js (Express)         | latest  | NFR-003, NFR-004                   |
| Database   | PostgreSQL                | latest  | DR-001, DR-002, DR-003             |
| Caching    | Upstash Redis             | latest  | NFR-004                            |
| AI/ML      | OpenAI API / HuggingFace  | latest  | AIR-001, AIR-002, AIR-003, AIR-004 |
| Testing    | Jest / Mocha              | latest  | NFR-004                            |
| Infrastructure | Netlify/Vercel/GitHub Codespaces | latest | NFR-003, NFR-004           |
| Security   | OAuth2, HTTPS, JWT        | latest  | NFR-001, NFR-002                   |
| Deployment | Windows Services/IIS      | latest  | NFR-003                            |
| Monitoring | Prometheus/Grafana        | latest  | NFR-004                            |
| Documentation | Markdown, PlantUML     | latest  | NFR-001                            |

### Alternative Technology Options
- Backend: Python (FastAPI) or .NET Core (not selected due to Node.js ecosystem fit)
- Frontend: Angular or Vue (React preferred for ecosystem and flexibility)
- AI/ML: Custom models (OpenAI/HuggingFace preferred for rapid prototyping)

### AI Component Stack
| Component      | Technology      | Purpose                        |
|----------------|----------------|--------------------------------|
| Model Provider | OpenAI/HF      | LLM inference                  |
| Vector Store   | N/A            | Not required for current scope |
| AI Gateway     | Custom API     | Request routing, logging       |
| Guardrails     | Custom logic   | Content filtering, validation  |

### Technology Decision
| Metric (from NFR/DR/AIR) | Node.js/React | .NET/Angular | Rationale                  |
|--------------------------|---------------|--------------|----------------------------|
| Open-source friendly     | 5             | 4            | Node.js/React more common  |
| AI/ML integration        | 5             | 3            | Node.js easier to extend   |
| Hosting flexibility      | 5             | 4            | Node.js deploys anywhere   |

## Technical Requirements
- TR-001: System MUST use PostgreSQL for structured data storage (NFR-003, DR-001)
- TR-002: System MUST use Upstash Redis for caching (NFR-004)
- TR-003: System MUST use Node.js backend and React frontend (NFR-003, NFR-004)
- TR-004: System MUST use OpenAI/HuggingFace for AI/ML (AIR-001, AIR-002, AIR-003, AIR-004)
- TR-005: System MUST use OAuth2/JWT for authentication and authorization (NFR-001, NFR-002)
- TR-006: [UNCLEAR] System MUST define backup and disaster recovery process (needs detail)

## Technical Constraints & Assumptions
- No paid cloud infrastructure; only open-source/free hosting
- All data handling must be HIPAA-compliant
- System must be deployable on Windows Services/IIS
- All user actions are logged immutably for audit
- Only dummy insurance records used for pre-check
- No patient self-check-in allowed

## Development Workflow
1. Requirements analysis and validation
2. Architecture and technology stack selection
3. Data model and API design
4. AI/ML integration and validation
5. Security and compliance implementation
6. Testing and quality assurance
7. Deployment and monitoring
8. Documentation and user training
