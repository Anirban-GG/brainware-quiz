# Brainware Quiz - Online Examination & Monitoring System
### Official Examination & Assessment Portal for Brainware University

---

## 1. Project Overview

**Brainware Quiz** is a full-featured, production-ready online examination and real-time monitoring web application developed for **Brainware University**. Unlike basic CRUD assessment platforms, it mimics an institutional university examination portal with strict academic integrity mechanisms, real-time proctoring feeds via WebSockets, server-enforced countdown timers, automated negative marking evaluation, anti-cheating browser detection, and multi-tier role authorization.

The system natively supports three primary stakeholders:
1. **Students** (Institutional registration using Brainware Student Codes, randomized question/answer assessment interface, auto-saving, anti-cheat detection, instant scorecards, and question inquiry remark tracking).
2. **Faculty / Teachers** (Assessment creation, question bank curation with randomization overrides, live monitoring dashboard via Socket.IO, warning dispatches, remote exam termination, and question inquiry resolutions).
3. **Administrators** (Global oversight across students and faculty, quiz lifecycle moderation, full security breach audit trails, password resets enforcing first-login changes, and audit compliance logging).

---

## 2. Technology Stack

### Frontend
- **Framework:** React.js (Vite)
- **Routing:** React Router DOM (v6)
- **State & Context:** React Hooks (`useContext`, `useReducer`, `useMemo`, `useCallback`)
- **HTTP Client:** Axios (with request & response interceptors)
- **Real-Time Client:** Socket.IO Client (v4)
- **Styling:** Tailwind CSS (v3) with Custom Brainware Crimson & Dark Surface Palettes
- **Data Visualizations:** Recharts (Cohort score distributions, pass/fail ratios, course demographics)
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js (v24+)
- **Server Framework:** Express.js (RESTful architecture)
- **Real-Time Engine:** Socket.IO Server (rooms for monitoring and attempts)
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs
- **Validation:** Express-Validator and Custom Brainware Code Parsers
- **Audit Engine:** Centralized persistent system event logger

### Database
- **Engine:** MongoDB
- **ODM:** Mongoose (v8) with schema validations, indices, and virtual attributes

---

## 3. Visual Identity & Theming

- **University Branding:** Brainware University crimson/red primary accent (`#b91c1c`, `#dc2626`), clean academic card styling, and subtle institutional gradients.
- **☀ Light Mode:** Clean, high-contrast university portal surface styling.
- **🌙 Dark Mode:** Eye-friendly deep charcoal background (`#0F1115`), card surfaces (`#171A21`), and balanced contrast borders (`#2A2F3D`).
- **Persistent Preferences:** Theme choice is stored in `localStorage` and preserved across page refreshes.

---

## 4. Student Code Structure & Parsing

Student registration adheres strictly to Brainware University student identifiers:
```
BWU / COURSE / ADMISSION_YEAR / ROLL_NUMBER
```
*Example:* `BWU/BCA/24/001`

- **BWU:** Brainware University
- **BCA:** Bachelor of Computer Applications (mapped via centralized course catalog)
- **24:** Admission Year 2024
- **001:** Campus Roll Number (preserved as string with leading zeros)

### Live Code Validation & Extraction
- **Regex:** `^BWU\/[A-Z]{2,10}\/\d{2}\/\d{3,}$`
- Live validation is presented on the client while typing, and verified independently on the server.

---

## 5. Security & Credential Rules

1. **Default Passwords:** Newly registered students receive their Student Code (e.g. `BWU/BCA/24/001`) as their initial password.
2. **No Plaintext Passwords:** Passwords are never stored in plaintext and are salted and hashed with `bcryptjs`.
3. **Forced Password Update (`mustChangePassword = true`):**
   - On first login, students are redirected to `/change-password`.
   - Only after successfully submitting a new password is `mustChangePassword` cleared to allow dashboard access.
4. **Admin Protection:** Administrators cannot view student or teacher passwords. Admins can initiate password resets, which sets `mustChangePassword = true` and resets student credentials to their default Student Code.

---

## 6. Anti-Cheating & Surveillance System

The application incorporates multi-layered browser-level event detection:
- **Tab Switching:** Monitored using `document.visibilitychange`.
- **Window Blur:** Focus loss logged when candidates click outside browser window.
- **Clipboard Restriction:** Copy, cut, and paste operations are intercepted, prevented, and logged.
- **Right-Click Prevention:** Context menu is suppressed across the examination interface.
- **Shortcut Interception:** Keyboard shortcuts (`Ctrl+C`, `Ctrl+V`, `Ctrl+X`, `Ctrl+U`, `Ctrl+P`, `F12`, `Ctrl+Shift+I`) are blocked.
- **Fullscreen Surveillance:** Fullscreen mode is tracked, logging exits as severe security events.
- **Faculty Remote Invigilation:** Invigilators monitor candidates live and can dispatch pop-up warnings or remotely terminate offending sessions.

---

## 7. User Roles & Permissions

| Role | Access Permissions |
|---|---|
| **Student** | Browse available quizzes, take scheduled exams with auto-save, view timers, submit, view detailed scorecards & explanations, report question errors, view profile. |
| **Teacher** | Author quizzes, manage question banks with randomization overrides, monitor live exam sessions via Socket.IO, issue warnings, terminate exams, resolve question reports. |
| **Admin** | Full system control, activate/deactivate students and faculty, reset passwords, manage global quiz repository, inspect cheating audit logs and system audit trails. |

---

## 8. Development Credentials (Seed Data)

Running `npm run seed` creates the following accounts:

### 1. System Administrator
- **Email:** `admin@brainwareuniversity.ac.in`
- **Password:** `Admin@2024`
- **Role:** `admin`

### 2. Faculty Instructor
- **Name:** Dr. Debasis Mukherjee
- **Email:** `teacher@brainwareuniversity.ac.in`
- **Password:** `Teacher@2024`
- **Role:** `teacher`

### 3. Student Candidate (Forced Password Change Test)
- **Name:** Mijanul Islam
- **Student Code:** `BWU/BCA/24/003`
- **Password:** `BWU/BCA/24/003`
- **Role:** `student` (Will prompt for password change upon sign-in)

### 4. Student Candidate (Ready for Instant Examination)
- **Name:** Riya Sen
- **Student Code:** `BWU/BCA/24/045`
- **Password:** `Student@123`
- **Role:** `student`

---

## 9. Folder Structure

```
brainware-quiz/
│
├── client/                      # React frontend with Vite & Tailwind CSS
│   ├── src/
│   │   ├── assets/              # Logos and graphics
│   │   ├── components/          # Reusable UI components (Navbar, Sidebar, Modal, Badge, StatCard)
│   │   ├── context/             # AuthContext & ThemeContext
│   │   ├── layouts/             # DashboardLayout & AuthLayout
│   │   ├── pages/
│   │   │   ├── auth/            # Login, Register, ChangePassword
│   │   │   ├── student/         # Dashboard, AvailableQuizzes, ExamInterface, ExamResult, ResultsHistory, QuestionReports, Profile
│   │   │   ├── teacher/         # Dashboard, QuizList, QuizCreateEdit, QuestionBank, LiveMonitoring, ResultsAnalytics, QuestionReportsList, Profile
│   │   │   └── admin/           # Dashboard, StudentsManagement, TeachersManagement, QuizzesManagement, ExamAttemptsManagement, CheatingLogs, AuditLogs, SystemSettings
│   │   ├── routes/              # ProtectedRoute & AppRoutes
│   │   ├── services/            # Axios API instances & Socket.IO service
│   │   └── utils/               # Student code parser and formatters
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                      # Node.js Express REST API & WebSockets
│   ├── config/                  # Database connection & course catalog mapping
│   ├── controllers/             # Auth, Student, Teacher, and Admin controllers
│   ├── middleware/              # JWT authentication, role authorization, validation, error handler
│   ├── models/                  # User, Quiz, Question, ExamAttempt, CheatingEvent, QuestionReport, AuditLog
│   ├── routes/                  # Express route definitions
│   ├── services/                # Audit logger service
│   ├── sockets/                 # Socket.IO live exam monitoring handlers
│   ├── seed/                    # Database seeder with sample exams & users
│   ├── server.js                # Server entry point
│   └── package.json
│
├── .env.example
├── README.md
└── package.json                 # Root orchestration scripts
```

---

## 10. Installation & Setup Guide

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Server running on `mongodb://127.0.0.1:27017`

### Step 1: Install Dependencies
Run the install command from the root directory:
```bash
npm run install:all
```
*(Or install manually in `server/` and `client/` directories).*

### Step 2: Configure Environment
Copy `.env.example` to `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/brainware_quiz
JWT_SECRET=brainware_quiz_super_secret_jwt_key_2024_secure_production
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Step 3: Populate Database Seed Data
Run the database seed script:
```bash
npm run seed
```

### Step 4: Run the Application
Start both the backend server and frontend development client concurrently:
```bash
npm run dev
```

- **Frontend Client:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **API Health Check:** http://localhost:5000/api/health

---

## 11. Core API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register student with code validation
- `POST /login` - Authenticate using student code or email
- `POST /change-password` - Mandatory/voluntary password change
- `GET /me` - Retrieve current session profile
- `POST /parse-code` - Helper parser for student codes

### Student (`/api/student`)
- `GET /quizzes` - List published available exams
- `POST /attempts` - Start/resume attempt with question randomization
- `GET /attempts/:id` - Retrieve active exam interface (sanitized: no answers exposed)
- `PATCH /attempts/:id/answers` - Autosave option selection & review flag
- `POST /attempts/:id/cheating-event` - Log browser focus/tab violation
- `POST /attempts/:id/submit` - Conclude and evaluate exam server-side
- `GET /results` - Examination submission history
- `GET /results/:id` - Detailed scorecard with explanations
- `POST /reports` - Submit remark on question

### Teacher (`/api/teacher`)
- `GET /dashboard` - KPIs, score distributions, and recent attempts
- `GET /quizzes` - List instructor's quizzes
- `POST /quizzes` - Create new examination
- `PUT /quizzes/:id` - Edit parameters & anti-cheat settings
- `DELETE /quizzes/:id` - Remove examination
- `POST /quizzes/:id/questions` - Add question with randomization override
- `GET /monitoring` - Live exam surveillance feed
- `POST /attempts/:id/warning` - Send real-time warning to candidate screen
- `POST /attempts/:id/terminate` - Remotely terminate candidate attempt
- `GET /results` - Cohort performance analytics
- `GET /reports` - Student question inquiries
- `PUT /reports/:id` - Resolve remark and provide academic feedback

### Admin (`/api/admin`)
- `GET /dashboard` - University-wide operational KPIs and analytics
- `GET /users` - Search and filter students and faculty
- `PUT /users/:id/status` - Activate/Deactivate user access
- `POST /users/:id/reset-password` - Reset password enforcing next-login change
- `POST /teachers` - Authorize new faculty account
- `GET /quizzes` - Universal quiz repository oversight
- `PATCH /quizzes/:id/publish` - Toggle publication status
- `GET /cheating-events` - Anti-cheating security audit trail
- `GET /audit-logs` - System administration compliance log

---

## 12. Verification & Testing

The platform has been validated against all academic examination requirements:
- **Authentication & Code Parsing:** Full validation of `BWU/BCA/24/001` student code format with automatic field parsing.
- **Forced Password Changes:** Prevents default password logins from accessing student portals until updated.
- **Examination Security:** Questions and options shuffle dynamically while protecting questions marked with "Fixed Option Order". Correct answers are never sent to the client during an exam.
- **Timer Enforcement:** Server validates duration, auto-submits on time expiry, and locks attempts post-submission.
- **Live Proctored Surveillance:** Real-time Socket.IO transmissions of tab-switching, copy/paste blocks, and faculty warning/termination commands.

## Demo Login

To create local demo accounts, configure these variables in `server/.env`:

- `SEED_ADMIN_PASSWORD`
- `SEED_TEACHER_PASSWORD`
- `SEED_STUDENT_PASSWORD`

Use your own local demo credentials. Never publish real student information or production passwords.
