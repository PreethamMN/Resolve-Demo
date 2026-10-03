import json
from datetime import datetime, timezone, timedelta
import pymongo
from sqlmodel import SQLModel, create_engine, Session, select
from app.config import DATABASE_URL
from app.models import (
    User, UserRole, TicketCategory, TicketStatus, TicketPriority,
    Order, Ticket, Comment, Attachment, AuditLog
)
from app.security import hash_password

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

MONGO_URI = "mongodb://localhost:27017"
MONGO_DB_NAME = "ecommerce_support"

def get_mongo_db():
    try:
        client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        return client[MONGO_DB_NAME]
    except Exception as e:
        print(f"MongoDB Connection Warning: {e}")
        return None

def mongo_insert_or_update(collection_name: str, doc_id: str, data: dict):
    try:
        mongo_db = get_mongo_db()
        if mongo_db is not None:
            data_copy = dict(data)
            data_copy["_id"] = doc_id
            mongo_db[collection_name].update_one(
                {"_id": doc_id},
                {"$set": data_copy},
                upsert=True
            )
    except Exception as e:
        print(f"MongoDB real-time sync warning: {e}")

def sync_to_mongodb():
    mongo_db = get_mongo_db()
    if mongo_db is None:
        return

    with Session(engine) as session:
        # Sync Users
        users = session.exec(select(User)).all()
        if users:
            mongo_db.users.delete_many({})
            user_docs = [{"_id": u.id, "name": u.name, "email": u.email, "password_hash": u.password_hash, "role": u.role, "created_at": u.created_at.isoformat()} for u in users]
            mongo_db.users.insert_many(user_docs)

        # Sync Orders
        orders = session.exec(select(Order)).all()
        if orders:
            mongo_db.orders.delete_many({})
            order_docs = [{"_id": o.id, "customer_id": o.customer_id, "items": json.loads(o.items_json), "total_amount": o.total_amount, "payment_status": o.payment_status, "delivery_status": o.delivery_status, "order_date": o.order_date.isoformat()} for o in orders]
            mongo_db.orders.insert_many(order_docs)

        # Sync Tickets
        tickets = session.exec(select(Ticket)).all()
        if tickets:
            mongo_db.tickets.delete_many({})
            ticket_docs = [{
                "_id": t.id,
                "customer_id": t.customer_id,
                "order_id": t.order_id,
                "category": t.category,
                "subject": t.subject,
                "description": t.description,
                "status": t.status,
                "priority": t.priority,
                "assigned_agent_id": t.assigned_agent_id,
                "created_at": t.created_at.isoformat(),
                "updated_at": t.updated_at.isoformat(),
                "resolved_at": t.resolved_at.isoformat() if t.resolved_at else None,
                "closed_at": t.closed_at.isoformat() if t.closed_at else None,
            } for t in tickets]
            mongo_db.tickets.insert_many(ticket_docs)

        # Sync Categories
        mongo_db.categories.delete_many({})
        cat_docs = [{"_id": cat.value, "name": cat.value.replace("_", " ")} for cat in TicketCategory]
        mongo_db.categories.insert_many(cat_docs)

        # Sync Comments
        comments = session.exec(select(Comment)).all()
        if comments:
            mongo_db.comments.delete_many({})
            comment_docs = [{
                "_id": c.id,
                "ticket_id": c.ticket_id,
                "user_id": c.user_id,
                "user_name": c.user_name,
                "user_role": c.user_role,
                "message": c.message,
                "is_internal": c.is_internal,
                "created_at": c.created_at.isoformat()
            } for c in comments]
            mongo_db.comments.insert_many(comment_docs)

        # Sync Attachments
        attachments = session.exec(select(Attachment)).all()
        if attachments:
            mongo_db.attachments.delete_many({})
            att_docs = [{
                "_id": a.id,
                "ticket_id": a.ticket_id,
                "file_name": a.file_name,
                "file_url": a.file_url,
                "uploaded_by_id": a.uploaded_by_id,
                "uploaded_by_name": a.uploaded_by_name,
                "created_at": a.created_at.isoformat()
            } for a in attachments]
            mongo_db.attachments.insert_many(att_docs)

        # Sync Audit Logs
        logs = session.exec(select(AuditLog)).all()
        if logs:
            mongo_db.audit_logs.delete_many({})
            log_docs = [{
                "_id": l.id,
                "ticket_id": l.ticket_id,
                "action": l.action,
                "performed_by_id": l.performed_by_id,
                "performed_by_name": l.performed_by_name,
                "performed_by_role": l.performed_by_role,
                "details": l.details,
                "created_at": l.created_at.isoformat()
            } for l in logs]
            mongo_db.audit_logs.insert_many(log_docs)

    print("MongoDB collections successfully populated in database 'ecommerce_support'!")

def get_now() -> datetime:
    return datetime.now(timezone.utc)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    seed_demo_data()
    sync_to_mongodb()

def get_session():
    with Session(engine) as session:
        yield session

def seed_demo_data():
    with Session(engine) as session:
        if session.exec(select(User)).first():
            return

        print("Seeding demo data into database...")
        now = get_now()

        # 1. Users
        pass_hash = hash_password("password123")
        users = [
            User(id="user_customer_1", name="Sarah Connor", email="customer@example.com", password_hash=pass_hash, role=UserRole.CUSTOMER, created_at=now),
            User(id="user_customer_2", name="John Smith", email="john@example.com", password_hash=pass_hash, role=UserRole.CUSTOMER, created_at=now),
            User(id="user_agent_1", name="Alex Rivera (Agent)", email="agent@example.com", password_hash=pass_hash, role=UserRole.SUPPORT_AGENT, created_at=now),
            User(id="user_agent_2", name="Emily Davis (Agent)", email="emily@example.com", password_hash=pass_hash, role=UserRole.SUPPORT_AGENT, created_at=now),
            User(id="user_lead_1", name="Marcus Vance (Team Lead)", email="lead@example.com", password_hash=pass_hash, role=UserRole.TEAM_LEAD, created_at=now),
            User(id="user_admin_1", name="System Admin", email="admin@example.com", password_hash=pass_hash, role=UserRole.ADMIN, created_at=now),
        ]
        for u in users:
            session.add(u)

        # 2. Orders
        items_ord1 = [
            {"product_id": "P-101", "name": "Wireless Noise-Canceling Headphones", "quantity": 1, "price": 149.99},
            {"product_id": "P-102", "name": "USB-C Fast Charging Cable", "quantity": 2, "price": 19.99}
        ]
        items_ord2 = [
            {"product_id": "P-205", "name": "Ergonomic Mechanical Keyboard", "quantity": 1, "price": 119.00}
        ]
        items_ord3 = [
            {"product_id": "P-309", "name": "Ultra-Wide 4K Gaming Monitor", "quantity": 1, "price": 499.99}
        ]

        orders = [
            Order(id="ORD-9021", customer_id="user_customer_1", items_json=json.dumps(items_ord1), total_amount=189.97, payment_status="PAID", delivery_status="DELIVERED", order_date=now - timedelta(days=5)),
            Order(id="ORD-9022", customer_id="user_customer_1", items_json=json.dumps(items_ord2), total_amount=119.00, payment_status="PAID", delivery_status="SHIPPED", order_date=now - timedelta(days=2)),
            Order(id="ORD-9023", customer_id="user_customer_2", items_json=json.dumps(items_ord3), total_amount=499.99, payment_status="PAID", delivery_status="DELIVERED", order_date=now - timedelta(days=10)),
        ]
        for o in orders:
            session.add(o)

        # 3. Tickets
        tickets = [
            Ticket(
                id="TKT-1001",
                customer_id="user_customer_1",
                order_id="ORD-9021",
                category=TicketCategory.WRONG_ITEM,
                subject="Received wrong color headphones",
                description="I ordered the Matte Black version but received silver instead.",
                status=TicketStatus.ASSIGNED,
                priority=TicketPriority.HIGH,
                assigned_agent_id="user_agent_1",
                created_at=now - timedelta(hours=12),
                updated_at=now - timedelta(hours=2)
            ),
            Ticket(
                id="TKT-1002",
                customer_id="user_customer_1",
                order_id="ORD-9022",
                category=TicketCategory.DELIVERY_ISSUE,
                subject="Package tracking not updating",
                description="The tracking link has been stuck on 'In Transit' for 48 hours.",
                status=TicketStatus.NEW,
                priority=TicketPriority.MEDIUM,
                created_at=now - timedelta(hours=4),
                updated_at=now - timedelta(hours=4)
            ),
            Ticket(
                id="TKT-1003",
                customer_id="user_customer_2",
                order_id="ORD-9023",
                category=TicketCategory.DAMAGED_ITEM,
                subject="Screen scratched on arrival",
                description="Unboxed the monitor and noticed a deep scratch across the panel.",
                status=TicketStatus.IN_PROGRESS,
                priority=TicketPriority.URGENT,
                assigned_agent_id="user_agent_2",
                created_at=now - timedelta(days=1),
                updated_at=now - timedelta(hours=6)
            ),
            Ticket(
                id="TKT-1004",
                customer_id="user_customer_2",
                order_id="ORD-9023",
                category=TicketCategory.REFUND,
                subject="Requesting partial refund for shipping delay",
                description="Paid for 1-day express delivery but it took 4 days.",
                status=TicketStatus.RESOLVED,
                priority=TicketPriority.LOW,
                assigned_agent_id="user_agent_1",
                created_at=now - timedelta(days=3),
                updated_at=now - timedelta(days=1),
                resolved_at=now - timedelta(days=1)
            )
        ]
        for t in tickets:
            session.add(t)

        # 4. Comments
        comments = [
            Comment(
                id="CMT-01",
                ticket_id="TKT-1001",
                user_id="user_customer_1",
                user_name="Sarah Connor",
                user_role=UserRole.CUSTOMER,
                message="Here is a picture showing the box barcode and silver color.",
                is_internal=False,
                created_at=now - timedelta(hours=11)
            ),
            Comment(
                id="CMT-02",
                ticket_id="TKT-1001",
                user_id="user_agent_1",
                user_name="Alex Rivera (Agent)",
                user_role=UserRole.SUPPORT_AGENT,
                message="Verified warehouse SKU match error. Initiated return shipping label creation.",
                is_internal=True,
                created_at=now - timedelta(hours=2)
            ),
            Comment(
                id="CMT-03",
                ticket_id="TKT-1001",
                user_id="user_agent_1",
                user_name="Alex Rivera (Agent)",
                user_role=UserRole.SUPPORT_AGENT,
                message="Hi Sarah, we apologize for the mix-up! I have generated a free prepaid return label for you.",
                is_internal=False,
                created_at=now - timedelta(hours=1)
            ),
        ]
        for c in comments:
            session.add(c)

        # 5. Audit logs
        logs = [
            AuditLog(
                id="AUD-01",
                ticket_id="TKT-1001",
                action="ticket_created",
                performed_by_id="user_customer_1",
                performed_by_name="Sarah Connor",
                performed_by_role=UserRole.CUSTOMER,
                details="Ticket created for order ORD-9021 with category WRONG_ITEM",
                created_at=now - timedelta(hours=12)
            ),
            AuditLog(
                id="AUD-02",
                ticket_id="TKT-1001",
                action="ticket_assigned",
                performed_by_id="user_lead_1",
                performed_by_name="Marcus Vance (Team Lead)",
                performed_by_role=UserRole.TEAM_LEAD,
                details="Assigned ticket TKT-1001 to agent Alex Rivera",
                created_at=now - timedelta(hours=6)
            ),
        ]
        for l in logs:
            session.add(l)

        session.commit()
        print("Demo data seeded successfully.")
