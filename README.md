# EduCare Solutions 🎓

A full-featured, Dockerized **School Management System** built with Node.js, React, and MongoDB.  
Manage students, teachers, classes, exams, marks (with OCR upload), result memos (PDF), and notifications — all in one place.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Free Service Options](#free-service-options)
4. [Folder Structure](#folder-structure)
5. [Prerequisites](#prerequisites)
6. [Quick Start (Docker)](#quick-start-docker)
7. [Development Mode](#development-mode)
8. [Production Deployment](#production-deployment)
9. [Environment Variables Reference](#environment-variables-reference)
10. [Default Credentials & Roles](#default-credentials--roles)
11. [API Endpoints](#api-endpoints)

---

## Project Overview

EduCare Solutions digitalises the administrative and academic workflow of a school:

- **Role-based access** — Admin, Teacher, Student, Parent each see tailored dashboards
- **OCR marks entry** — Teachers upload a photo of a mark sheet; Tesseract.js extracts the numbers automatically
- **Result memos** — PDF memos generated per student with grades, rank, and school branding
- **Notifications** — Email (Nodemailer) and SMS (Twilio / fast2sms) alerts when results are published
- **Audit trail** — Every data change is logged with user, old value, and new value
- **Fully Dockerized** — single `docker-compose up` to run everything

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend Runtime** | Node.js 20 + Express.js |
| **Database** | MongoDB 7 (Mongoose ODM) |
| **Authentication** | JWT (access + refresh tokens) + bcryptjs |
| **OCR** | Tesseract.js (open-source, free) |
| **PDF Generation** | PDFKit |
| **File Uploads** | Multer (local filesystem / Cloudinary / Backblaze B2) |
| **Image Processing** | Sharp |
| **Email** | Nodemailer (SMTP) |
| **SMS** | Twilio (free trial) / fast2sms (India, free tier) |
| **Logging** | Winston + Morgan |
| **Frontend** | React 18 + Vite + Tailwind CSS |
| **State / Data** | React Query (TanStack Query v5) |
| **Forms** | React Hook Form + Zod validation |
| **UI Components** | shadcn/ui |
| **Routing** | React Router v6 |
| **Containerization** | Docker + Docker Compose |
| **Web Server** | Nginx (frontend reverse proxy) |

---

## Free Service Options

### 📦 File Storage

| Provider | Free Tier | Notes |
|---|---|---|
| **Local filesystem** (default) | Unlimited (your server disk) | Files stored in `uploads/` via Docker volume |
| **Cloudinary** | 10 GB storage · 25 GB bandwidth/month | Set `STORAGE_PROVIDER=cloudinary` in `.env` |
| **Backblaze B2** | 10 GB storage · 1 GB/day download | Set `STORAGE_PROVIDER=backblaze` in `.env` |

### 📱 SMS Providers

| Provider | Free Tier | Notes |
|---|---|---|
| **Twilio** | $15.50 trial credit (~500 SMS) | Works globally; set `TWILIO_*` vars |
| **fast2sms** | Freemium — limited SMS/day | India only; set `FAST2SMS_API_KEY` |

---

## Folder Structure

```
educare-solutions/
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── server.js
│       ├── app.js
│       ├── config/
│       │   ├── db.js
│       │   └── logger.js
│       ├── models/
│       │   ├── User.js
│       │   ├── Student.js
│       │   ├── Teacher.js
│       │   ├── Parent.js
│       │   ├── Class.js
│       │   ├── Subject.js
│       │   ├── Exam.js
│       │   ├── Marks.js
│       │   ├── Memo.js
│       │   ├── AuditLog.js
│       │   └── Notification.js
│       ├── middlewares/
│       │   ├── auth.js
│       │   ├── errorHandler.js
│       │   ├── upload.js
│       │   ├── rateLimiter.js
│       │   ├── validate.js
│       │   └── auditLogger.js
│       ├── utils/
│       │   ├── apiResponse.js
│       │   ├── generateToken.js
│       │   ├── ocr.js
│       │   ├── pdfGenerator.js
│       │   ├── gradeCalculator.js
│       │   ├── notificationService.js
│       │   └── emailTemplates.js
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── studentController.js
│       │   ├── teacherController.js
│       │   ├── parentController.js
│       │   ├── classController.js
│       │   ├── subjectController.js
│       │   ├── examController.js
│       │   ├── marksController.js
│       │   ├── memoController.js
│       │   ├── notificationController.js
│       │   ├── adminController.js
│       │   └── reportController.js
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── student.routes.js
│       │   ├── teacher.routes.js
│       │   ├── parent.routes.js
│       │   ├── class.routes.js
│       │   ├── subject.routes.js
│       │   ├── exam.routes.js
│       │   ├── marks.routes.js
│       │   ├── memo.routes.js
│       │   ├── notification.routes.js
│       │   ├── admin.routes.js
│       │   └── report.routes.js
│       ├── scripts/
│       │   ├── seed.js
│       │   ├── seed-class20.js
│       │   └── migrate.js
│       └── uploads/
│           └── .gitkeep
├── frontend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── nginx.conf
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── store/
│       └── utils/
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── .gitignore
├── Makefile
└── README.md
```

---

## Prerequisites

| Tool | Minimum Version |
|---|---|
| Docker | 24+ |
| Docker Compose | v2.20+ (bundled with Docker Desktop) |
| GNU Make | any (optional — you can run compose commands directly) |

> No local Node.js or MongoDB installation is required when using Docker.

---

## Quick Start (Docker)

```bash
# 1. Clone the repository
git clone <repo-url> educare-solutions
cd educare-solutions

# 2. Create your environment file
cp .env.example .env
# Edit .env with your SMTP, Twilio, etc. credentials

# 3. Start all services (production mode)
make prod
# -- or without Make:
# docker-compose -f docker-compose.yml up -d

# 4. Seed the database with the full demo dataset
make seed
# -- or:
# docker exec -it educare_backend node src/scripts/seed.js

# 5. Open the app
open http://localhost
```

---

## Development Mode

Development mode enables:
- **Hot-reload** for the backend via `nodemon`
- **HMR** (Hot Module Replacement) for the frontend via Vite
- MongoDB port exposed on `27017` for local tools (Compass, mongosh)

```bash
make dev
# -- or:
# docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

| Service | URL |
|---|---|
| Frontend (Vite dev server) | http://localhost:5173 |
| Backend API | http://localhost:5000/api |
| MongoDB | mongodb://localhost:27017 |

---

## Production Deployment

### Deploy to Render with Docker

The root `Dockerfile` builds the React frontend and Node.js API into one Render
web service. In Render, create a **Web Service**, connect this repository, set
the root directory to `.`, choose **Docker** as the runtime, and use
`./Dockerfile` as the Dockerfile path. Render supplies the listening `PORT`.

Add these environment variables in the Render dashboard:

| Variable | Value |
|---|---|
| `MONGODB_URI` | Connection string for a reachable MongoDB deployment (for example, MongoDB Atlas) |
| `JWT_SECRET` | A long, random secret for access tokens |
| `JWT_REFRESH_SECRET` | A separate long, random secret for refresh tokens |
| `NODE_ENV` | `production` |

Set any optional email, SMS, school branding, and upload variables there as
needed. Do not put production secrets in the Dockerfile or commit them to the
repository. Configure the MongoDB provider's network access to allow the
Render service to connect. The API health check is available at `/health`.

Render's container filesystem is ephemeral. If users need uploaded photos and
memo PDFs to survive redeployments, attach a persistent disk at
`/app/backend/uploads` and set `UPLOAD_DIR=/app/backend/uploads`.

### Minimum server requirements
- 2 vCPU, 2 GB RAM (4 GB recommended)
- 20 GB disk (more if storing many file uploads locally)
- Docker + Docker Compose installed

### Steps

```bash
# On the server
git clone <repo-url> educare-solutions
cd educare-solutions
cp .env.example .env
nano .env   # fill in production credentials

# Build and start
docker-compose -f docker-compose.yml up -d --build

# Check all services are healthy
docker-compose ps

# View logs
make logs
```

### HTTPS / TLS (recommended for production)

Add an Nginx reverse proxy (or Traefik) in front of the frontend container and terminate TLS there. Use [Let's Encrypt](https://letsencrypt.org/) (free) with Certbot.

---

## Environment Variables Reference

| Variable | Description | Default |
|---|---|---|
| `MONGO_ROOT_USER` | MongoDB root username | `admin` |
| `MONGO_ROOT_PASSWORD` | MongoDB root password | *(required)* |
| `MONGO_DB_NAME` | Database name | `educare` |
| `MONGO_URI` | Full MongoDB connection URI | *(auto-assembled)* |
| `JWT_SECRET` | JWT signing secret | *(required)* |
| `JWT_EXPIRES_IN` | Access token TTL | `7d` |
| `JWT_REFRESH_SECRET` | Refresh token secret | *(required)* |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `30d` |
| `PORT` | Backend listen port | `5000` |
| `NODE_ENV` | Environment | `production` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:80` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username / email | *(required)* |
| `SMTP_PASS` | SMTP password / app password | *(required)* |
| `EMAIL_FROM` | From address in emails | *(required)* |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | *(optional)* |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | *(optional)* |
| `TWILIO_PHONE_NUMBER` | Twilio sender number | *(optional)* |
| `STORAGE_PROVIDER` | `local` / `cloudinary` / `backblaze` | `local` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | *(optional)* |
| `CLOUDINARY_API_KEY` | Cloudinary API key | *(optional)* |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | *(optional)* |
| `SCHOOL_NAME` | School name used in PDF memos | `EduCare School` |
| `SCHOOL_ADDRESS` | School address in PDF memos | *(optional)* |

---

## Default Credentials & Roles

> These are created by the seed script (`make seed`).
> The script clears its demo collections before reseeding: 1 admin, 20 teachers,
> 120 parents, 300 students, 10 classes, 60 subjects, 30 exams, 3,650 marks,
> 600 published memos/PDFs, 120 notifications, and 150 audit logs.

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@educare.com | `Admin@123` |
| **Teacher** | teacher01@educare.com | `Teacher@123` |
| **Parent** | parent001@educare.com | `Parent@123` |
| **Student** | student001@educare.com | `Student@123` |

> ⚠️ Change all passwords immediately after first login in production.
> All seeded accounts share the role password shown above. Seeded student and
> parent profiles are linked to their login accounts, classes, and published
> results.

### Add Class 20A students without clearing existing data

Run `make seed-class20` (Docker) or `cd backend && npm run seed:class20` (local).
This additive seed is idempotent for the current academic year. It creates
Class 20 / Section A and adds the eight names from the supplied image with roll
numbers 1–8. It does not create marks, exams, parents, or memos and does not
clear existing collections. Since the image did not include last names, dates
of birth, or genders, these fields use placeholders (`Student`, `2000-01-01`,
and `other`). All eight student accounts use the password `Student@123`.

### Role Permissions Summary

| Feature | Admin | Teacher | Student | Parent |
|---|:---:|:---:|:---:|:---:|
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Manage classes & subjects | ✅ | ❌ | ❌ | ❌ |
| Manage exams | ✅ | ✅ | ❌ | ❌ |
| Upload / enter marks | ✅ | ✅ | ❌ | ❌ |
| Review marks (OCR) | ✅ | ✅ | ❌ | ❌ |
| Generate memos | ✅ | ✅ | ❌ | ❌ |
| View own marks / memo | ❌ | ❌ | ✅ | ✅ |
| View audit logs | ✅ | ❌ | ❌ | ❌ |

---

## API Endpoints

Base URL: `http://localhost:5000/api`

### Authentication
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/login` | Login and receive JWT | Public |
| POST | `/auth/logout` | Invalidate token | 🔒 Any |
| POST | `/auth/refresh` | Refresh access token | 🔒 Any |
| POST | `/auth/change-password` | Change own password | 🔒 Any |
| POST | `/auth/forgot-password` | Send password reset email | Public |
| POST | `/auth/reset-password/:token` | Reset password with token | Public |

### Students
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/students` | List all students (paginated, filterable) | 🔒 Admin, Teacher |
| POST | `/students` | Create student | 🔒 Admin |
| GET | `/students/:id` | Get student by ID | 🔒 Admin, Teacher |
| PUT | `/students/:id` | Update student | 🔒 Admin |
| DELETE | `/students/:id` | Delete student | 🔒 Admin |
| POST | `/students/:id/photo` | Upload student photo | 🔒 Admin |
| GET | `/students/class/:classId` | List students by class | 🔒 Admin, Teacher |

### Teachers
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/teachers` | List all teachers | 🔒 Admin |
| POST | `/teachers` | Create teacher | 🔒 Admin |
| GET | `/teachers/:id` | Get teacher by ID | 🔒 Admin |
| PUT | `/teachers/:id` | Update teacher | 🔒 Admin |
| DELETE | `/teachers/:id` | Delete teacher | 🔒 Admin |

### Parents
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/parents` | List all parents | 🔒 Admin |
| POST | `/parents` | Create parent | 🔒 Admin |
| GET | `/parents/:id` | Get parent by ID | 🔒 Admin |
| PUT | `/parents/:id` | Update parent | 🔒 Admin |
| DELETE | `/parents/:id` | Delete parent | 🔒 Admin |
| POST | `/parents/:id/link/:studentId` | Link student to parent | 🔒 Admin |

### Classes
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/classes` | List all classes | 🔒 Admin, Teacher |
| POST | `/classes` | Create class | 🔒 Admin |
| GET | `/classes/:id` | Get class details | 🔒 Admin, Teacher |
| PUT | `/classes/:id` | Update class | 🔒 Admin |
| DELETE | `/classes/:id` | Delete class | 🔒 Admin |
| POST | `/classes/:id/students` | Add students to class | 🔒 Admin |

### Subjects
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/subjects` | List subjects | 🔒 Admin, Teacher |
| POST | `/subjects` | Create subject | 🔒 Admin |
| GET | `/subjects/:id` | Get subject | 🔒 Admin, Teacher |
| PUT | `/subjects/:id` | Update subject | 🔒 Admin |
| DELETE | `/subjects/:id` | Delete subject | 🔒 Admin |

### Exams
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/exams` | List exams | 🔒 Admin, Teacher |
| POST | `/exams` | Create exam | 🔒 Admin |
| GET | `/exams/:id` | Get exam | 🔒 Admin, Teacher |
| PUT | `/exams/:id` | Update exam | 🔒 Admin |
| DELETE | `/exams/:id` | Delete exam | 🔒 Admin |
| PUT | `/exams/:id/publish` | Publish exam | 🔒 Admin |

### Marks
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/marks/upload-image` | Upload marksheet image (OCR) | 🔒 Admin, Teacher |
| POST | `/marks/manual` | Manual marks entry | 🔒 Admin, Teacher |
| GET | `/marks/exam/:examId` | Get all marks for an exam | 🔒 Admin, Teacher |
| GET | `/marks/student/:studentId` | Get marks for a student | 🔒 Admin, Teacher, Student (own) |
| PUT | `/marks/:id/review` | Approve / reject OCR marks | 🔒 Admin, Teacher |
| POST | `/marks/bulk` | Bulk marks upload (CSV) | 🔒 Admin, Teacher |

### Memos (Result PDFs)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/memos/generate/:studentId/:examId` | Generate result memo | 🔒 Admin, Teacher |
| GET | `/memos/:id/download` | Download PDF memo | 🔒 Admin, Teacher, Student (own), Parent |
| PUT | `/memos/:id/publish` | Publish memo (notify student/parent) | 🔒 Admin |
| GET | `/memos/student/:studentId` | List memos for a student | 🔒 Admin, Teacher, Student (own) |

### Notifications
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/notifications/email` | Send email notification | 🔒 Admin |
| POST | `/notifications/sms` | Send SMS notification | 🔒 Admin |
| GET | `/notifications` | List notifications | 🔒 Admin |
| GET | `/notifications/my` | Get my notifications | 🔒 Any |

### Admin
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/admin/dashboard` | Dashboard stats | 🔒 Admin |
| GET | `/admin/audit-logs` | Audit log history | 🔒 Admin |
| GET | `/admin/users` | List all users | 🔒 Admin |
| PUT | `/admin/users/:id/toggle` | Activate / deactivate user | 🔒 Admin |

### Reports
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/reports/class/:classId` | Class performance report | 🔒 Admin, Teacher |
| GET | `/reports/student/:studentId` | Student progress report | 🔒 Admin, Teacher, Student (own) |
| GET | `/reports/exam/:examId` | Exam result report | 🔒 Admin, Teacher |

### Health
| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Service health check |

---

## Makefile Commands

```bash
make dev          # Start in development mode (hot-reload)
make prod         # Start in production mode (detached)
make build        # Rebuild all Docker images (no cache)
make down         # Stop and remove all containers
make logs         # Tail logs for all services
make mongo-shell  # Open interactive MongoDB shell
make seed         # Run database seed script
```

---

*Built with ❤️ for schools everywhere.*
