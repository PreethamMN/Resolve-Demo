import os

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-for-e-commerce-support-system-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./support_system.db")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
