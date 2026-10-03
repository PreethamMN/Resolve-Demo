# Product Requirements Document

## E-Commerce Customer Support System

### 1. Product Overview

The E-Commerce Customer Support System is a web application that allows customers to report problems related to their orders through support tickets.

Support agents investigate and resolve tickets, team leads manage assignment and workload, and administrators manage users, categories, and system configuration.

### 2. Problem Statement

Customers need a structured way to report order-related problems and track their resolution.

Support teams need a centralized system to:

* Receive customer complaints
* Associate complaints with specific orders
* Assign tickets to agents
* Track ticket status
* Communicate with customers
* Resolve and close tickets
* Maintain an audit history

### 3. Goals

The system should:

1. Allow customers to create support tickets.
2. Associate every ticket with an order.
3. Allow customers to view their own tickets.
4. Allow support agents to view assigned tickets.
5. Allow team leads to assign/reassign tickets.
6. Allow agents to investigate and resolve issues.
7. Allow customers to confirm resolution.
8. Maintain comments and attachments.
9. Maintain an audit trail of important actions.
10. Provide role-based access control.

### 4. Users / Roles

#### Customer

Permissions:

* Register/login
* View own orders
* Create tickets
* View own tickets
* Add comments
* Upload supporting attachments
* Confirm resolution
* Close resolved tickets

#### Support Agent

Permissions:

* Login
* View assigned tickets
* View associated order information
* Investigate tickets
* Add comments
* Change ticket status
* Mark tickets as resolved
* Upload attachments

#### Support Team Lead

Permissions:

* View all tickets
* Assign tickets
* Reassign tickets
* View agent workload
* Monitor ticket status
* View support metrics

#### Admin

Permissions:

* Manage users
* Manage categories
* Manage system configuration
* View all tickets
* View audit logs

### 5. Ticket Categories

The initial system must support:

* ORDER_NOT_RECEIVED
* WRONG_ITEM
* DAMAGED_ITEM
* CANCEL_ORDER
* REFUND
* RETURN
* PAYMENT_ISSUE
* DELIVERY_ISSUE

These categories are defined in the supplied project specification.

### 6. Ticket Lifecycle

Normal lifecycle:

NEW
↓
ASSIGNED
↓
IN_PROGRESS
↓
RESOLVED
↓
CLOSED

Alternative flow:

IN_PROGRESS
↓
ON_HOLD
↓
IN_PROGRESS

The supplied specification defines this exact lifecycle.

### 7. Core Entities

The database should contain:

* User
* Ticket
* Category
* Order
* Comment
* Attachment
* AuditLog

These entities are explicitly identified in the project specification.

### 8. Ticket Requirements

Every ticket should contain at minimum:

* Ticket ID
* Customer ID
* Order ID
* Category
* Subject
* Description
* Status
* Priority
* Assigned agent
* Created timestamp
* Updated timestamp
* Resolved timestamp
* Closed timestamp

### 9. Ticket Creation Flow

Customer:

1. Logs in.
2. Opens "Create Support Ticket".
3. Selects an order.
4. Selects issue category.
5. Enters subject.
6. Enters description.
7. Adds optional attachment.
8. Submits ticket.

System:

1. Creates ticket.
2. Sets status to NEW.
3. Records creation in AuditLog.
4. Makes ticket visible to the support team.

### 10. Assignment Flow

Team lead:

1. Opens NEW ticket.
2. Reviews category and order information.
3. Selects support agent.
4. Assigns ticket.

System:

1. Updates assigned_agent_id.
2. Changes status from NEW to ASSIGNED.
3. Creates an audit-log entry.
4. Notifies the assigned agent.

### 11. Investigation Flow

Agent:

1. Opens assigned ticket.
2. Reviews customer information.
3. Reviews order information.
4. Reviews previous comments.
5. Checks attachments.
6. Adds investigation notes/comments.
7. Performs the required support action.
8. Changes status to RESOLVED.

### 12. Resolution Flow

Example: Wrong Item

Customer
→ creates WRONG_ITEM ticket
→ support team receives ticket
→ agent is assigned
→ agent verifies order
→ return/replacement is coordinated
→ ticket becomes RESOLVED
→ customer confirms
→ ticket becomes CLOSED

This follows the supplied wrong-item example.

### 13. Refund Flow

Customer
→ creates REFUND ticket
→ support team receives ticket
→ agent is assigned
→ agent verifies order/payment
→ refund is processed
→ ticket becomes RESOLVED
→ customer confirms
→ ticket becomes CLOSED

This follows the supplied refund example.

### 14. Order Relationship

The most important domain relationship is:

Ticket → Order

A ticket must reference a specific order so that the support agent can investigate relevant:

* Order details
* Payment information
* Delivery information
* Return information
* Refund information

This relationship is explicitly highlighted in the supplied specification.

### 15. Functional Requirements

#### Authentication

* User registration
* Login
* Password hashing
* JWT access token
* Token validation
* Logout/token expiration handling

#### Authorization

The API must verify the user's role before allowing protected operations.

Example:

```text
Customer
    ↓
Can access only own tickets

Agent
    ↓
Can access assigned tickets

Team Lead
    ↓
Can assign/reassign tickets

Admin
    ↓
Can manage users/configuration
```

#### Ticket Management

* Create ticket
* Get ticket
* List tickets
* Filter tickets
* Assign ticket
* Reassign ticket
* Update ticket
* Change status
* Resolve ticket
* Close ticket

#### Comments

* Add comment
* View comments
* Associate comments with users
* Timestamp every comment

#### Attachments

* Upload attachment
* Associate attachment with ticket
* View/download attachment
* Store metadata

#### Audit Logs

Record important actions:

```text
ticket_created
ticket_assigned
ticket_reassigned
status_changed
comment_added
attachment_added
ticket_resolved
ticket_closed
```

### 16. API Requirements

#### Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

#### Users

```http
GET    /api/users
GET    /api/users/{id}
POST   /api/users
PATCH  /api/users/{id}
DELETE /api/users/{id}
```

#### Orders

```http
GET /api/orders
GET /api/orders/{id}
GET /api/customers/me/orders
```

#### Tickets

```http
POST  /api/tickets
GET   /api/tickets
GET   /api/tickets/{id}
PATCH /api/tickets/{id}
POST  /api/tickets/{id}/assign
POST  /api/tickets/{id}/status
POST  /api/tickets/{id}/resolve
POST  /api/tickets/{id}/close
```

#### Comments

```http
GET  /api/tickets/{ticket_id}/comments
POST /api/tickets/{ticket_id}/comments
```

#### Attachments

```http
POST /api/tickets/{ticket_id}/attachments
GET  /api/tickets/{ticket_id}/attachments
```

#### Audit Logs

```http
GET /api/tickets/{ticket_id}/audit-logs
GET /api/audit-logs
```

### 17. Suggested MongoDB Collections

```text
ecommerce_support
│
├── users
├── tickets
├── categories
├── orders
├── comments
├── attachments
└── audit_logs
```

### 18. Example User Document

```json
{
  "_id": "user_001",
  "name": "John Doe",
  "email": "john@example.com",
  "password_hash": "...",
  "role": "CUSTOMER",
  "created_at": "2026-09-25T10:00:00Z"
}
```

### 19. Example Ticket Document

```json
{
  "_id": "TKT-1001",
  "customer_id": "user_001",
  "order_id": "ORD-1001",
  "category": "WRONG_ITEM",
  "subject": "Wrong product received",
  "description": "I received a different product.",
  "status": "ASSIGNED",
  "priority": "HIGH",
  "assigned_agent_id": "agent_001",
  "created_at": "2026-09-25T10:00:00Z",
  "updated_at": "2026-09-25T11:00:00Z"
}
```

### 20. Example Order Document

```json
{
  "_id": "ORD-1001",
  "customer_id": "user_001",
  "items": [
    {
      "product_id": "P001",
      "name": "Wireless Headphones",
      "quantity": 1,
      "price": 1999
    }
  ],
  "total_amount": 1999,
  "payment_status": "PAID",
  "delivery_status": "DELIVERED",
  "order_date": "2026-09-20T10:00:00Z"
}
```

### 21. Frontend Pages

#### Customer

```text
Login
Register
Dashboard
My Orders
Create Ticket
My Tickets
Ticket Details
Profile
```

#### Support Agent

```text
Login
Agent Dashboard
Assigned Tickets
Ticket Details
Order Details
Comments
Resolution
```

#### Team Lead

```text
Lead Dashboard
All Tickets
Unassigned Tickets
Agent Workload
Assignment Panel
Ticket Analytics
```

#### Admin

```text
Admin Dashboard
Users
Categories
Configuration
Audit Logs
System Statistics
```

### 22. Dashboard Metrics

The system should eventually display:

* Total tickets
* New tickets
* Assigned tickets
* In-progress tickets
* On-hold tickets
* Resolved tickets
* Closed tickets
* Tickets by category
* Tickets by agent
* Average resolution time

### 23. Non-Functional Requirements

#### Security

* Passwords must never be stored in plaintext.
* APIs must require authentication where appropriate.
* Role-based authorization must be enforced server-side.
* Users must not be able to access another customer's tickets.
* Uploaded files must be validated.
* Sensitive configuration must use environment variables.

#### Performance

Initial target:

* API response: <500 ms for normal CRUD operations
* Pagination for ticket lists
* Database indexes for frequent queries

MongoDB recommends designing indexes around common query patterns because indexes can improve query performance, while excessive indexes add write/storage overhead.

#### Scalability

The architecture should allow later addition of:

* Redis
* Background workers
* Email notifications
* Cloud file storage
* Search
* Analytics
* AI support assistant

### 24. MVP Scope

Build these first:

```text
1. Authentication
2. Role-based authorization
3. Users
4. Orders
5. Ticket creation
6. Ticket assignment
7. Ticket status management
8. Comments
9. Customer ticket tracking
10. Agent dashboard
11. Team-lead dashboard
12. Basic audit logging
```

Do NOT start with AI, microservices, Kubernetes, complex analytics, or real payment integration.

### 25. Phase 2

Add:

* Email notifications
* File storage
* Advanced search
* Filtering
* Pagination
* SLA timers
* Agent workload management
* Analytics dashboard

### 26. Phase 3

Add AI:

```text
Customer message
       ↓
AI classification
       ↓
Category prediction
       ↓
Priority prediction
       ↓
Suggested response
       ↓
Agent approval
       ↓
Customer
```

Possible AI features:

* Automatic ticket categorization
* Suggested replies
* Duplicate ticket detection
* Order issue summarization
* Agent response assistance
* FAQ chatbot
* Ticket priority recommendation

AI should initially assist the support agent rather than autonomously making sensitive decisions such as issuing refunds.

### 27. Recommended Technology Stack

Frontend:

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Axios

Backend:

* Python
* FastAPI
* Pydantic
* PyJWT
* pwdlib
* python-multipart

Database:

* MongoDB
* PyMongo

Infrastructure:

* Docker
* Docker Compose

Optional later:

* Redis
* Celery/RQ
* S3-compatible object storage
* Nginx
* CI/CD

### 28. Development Milestones

#### Milestone 1 — Backend Foundation

```text
FastAPI setup
      ↓
MongoDB connection
      ↓
Environment variables
      ↓
User model
      ↓
Authentication
```

#### Milestone 2 — Ticket System

```text
Order model
      ↓
Ticket model
      ↓
Ticket creation API
      ↓
Ticket listing
      ↓
Ticket details
```

#### Milestone 3 — Workflow

```text
Assignment
    ↓
IN_PROGRESS
    ↓
ON_HOLD
    ↓
RESOLVED
    ↓
CLOSED
```

#### Milestone 4 — Frontend

```text
Login
  ↓
Dashboard
  ↓
Ticket list
  ↓
Ticket details
  ↓
Comments
  ↓
Assignment/status controls
```

#### Milestone 5 — Admin

```text
User management
Category management
Audit logs
Statistics
```

#### Milestone 6 — Deployment

```text
Docker
   ↓
Docker Compose
   ↓
MongoDB
   ↓
FastAPI
   ↓
React
```

### 29. Success Criteria

The MVP is considered complete when:

* A customer can register/login.
* A customer can view their orders.
* A customer can create an order-related ticket.
* A team lead can assign the ticket.
* An agent can investigate it.
* The agent can update its status.
* The agent can resolve it.
* The customer can confirm/close it.
* Comments are preserved.
* Unauthorized users cannot access restricted resources.
* Important actions appear in audit logs.

### 30. Future Architecture

```text
                    React
                      │
                      ▼
                 API Gateway
                      │
                ┌─────┴─────┐
                ▼           ▼
            FastAPI       Redis
                │
        ┌───────┼────────┐
        ▼       ▼        ▼
     MongoDB   Worker    File Storage
                 │
                 ▼
              AI/LLM
```

The first version should remain a modular monolith. Split services only after the application actually requires it.
