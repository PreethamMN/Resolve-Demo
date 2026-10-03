# Resolvify - E-Commerce Customer Support System

Resolvify is a full-stack, enterprise-grade E-Commerce Customer Support System built in accordance with the PRD specification.

## 🚀 Features

- **Multi-Role Support**:
  - **Customer**: View orders, create support tickets linked to orders, add comments, upload attachments, confirm resolution.
  - **Support Agent**: View assigned tickets, update status (NEW, ASSIGNED, IN_PROGRESS, ON_HOLD, RESOLVED, CLOSED), add internal/public notes.
  - **Team Lead**: Assign/reassign tickets, monitor agent workloads, track ticket statistics and SLA status.
  - **Admin**: User account management, ticket category setup, global audit log compliance tracking.
- **Audit Logging**: Full audit trail for every ticket action (`ticket_created`, `ticket_assigned`, `status_changed`, `comment_added`, `attachment_added`, `ticket_resolved`, `ticket_closed`).

---

## 📁 Repository File Structure

```text
E:/project/
├── prd.md                     # Original Product Requirements Document
├── README.md                  # Project overview & startup instructions
│
├── backend/                   # FastAPI Backend
│   ├── requirements.txt       # Python dependencies
│   └── app/
│       ├── main.py            # FastAPI main entry point & CORS
│       ├── config.py          # Configuration & JWT secrets
│       ├── database.py        # SQLite / SQLModel DB engine & seed data logic
│       ├── models.py          # SQLModel database tables (User, Ticket, Order, Comment, Attachment, AuditLog)
│       ├── schemas.py         # Pydantic validation schemas
│       ├── security.py        # Passlib password hashing & JWT token verification
│       └── routers/
│           ├── auth.py        # /api/auth/login, /api/auth/register, /api/auth/me
│           ├── users.py       # User CRUD & role management
│           ├── orders.py      # /api/orders, /api/customers/me/orders
│           ├── tickets.py     # Ticket CRUD, assignment, status, comments, attachments
│           └── audit.py       # /api/audit-logs, /api/stats
│
└── frontend/                  # React + TypeScript + Vite + Tailwind CSS
    ├── package.json           # Node dependencies
    ├── vite.config.ts         # Vite server proxy setup
    ├── tsconfig.json          # TypeScript configuration
    ├── tailwind.config.js     # Tailwind CSS styles & palette
    ├── index.html             # HTML template
    └── src/
        ├── main.tsx           # React app launcher
        ├── App.tsx            # Main layout & router definition
        ├── index.css          # Base CSS
        ├── types/             # TypeScript data interfaces
        ├── services/          # Axios API client
        ├── context/           # AuthContext with demo role switching
        ├── components/        # UI Badges, Navbar, Sidebar
        └── pages/             # CustomerDashboard, AgentDashboard, TeamLeadDashboard, AdminDashboard, TicketDetail, CreateTicket, OrdersList
```

---

## 🔑 Demo Account Credentials

| Role | Email | Password |
|---|---|---|
| **Customer** | `customer@example.com` | `password123` |
| **Support Agent** | `agent@example.com` | `password123` |
| **Support Team Lead** | `lead@example.com` | `password123` |
| **Admin** | `admin@example.com` | `password123` |

---

## ⚙️ How to Run

### 1. Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser!
