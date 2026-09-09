from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.exc import IntegrityError
from server.core.config import settings

db_url = settings.DATABASE_URL
connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}

engine = create_engine(db_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from server import models  # noqa: F401

    Base.metadata.create_all(bind=engine)


_SEED_USERS = [
    {
        "id": "11111111-1111-1111-1111-111111111111",
        "email": "admin@example.com",
        "password": "adminpassword",
        "full_name": "Dr. Arthur Vance (Admin)",
        "role": "Admin",
    },
    {
        "id": "22222222-2222-2222-2222-222222222222",
        "email": "doctor@example.com",
        "password": "doctorpassword",
        "full_name": "Dr. Sarah Jenkins, MD",
        "role": "Doctor",
    },
    {
        "id": "33333333-3333-3333-3333-333333333333",
        "email": "nurse@example.com",
        "password": "nursepassword",
        "full_name": "Nurse Clara Barton",
        "role": "Nurse",
    },
    {
        "id": "44444444-4444-4444-4444-444444444444",
        "email": "test@example.com",
        "password": "testpassword",
        "full_name": "Elena Rostova, MHA",
        "role": "Receptionist",
    },
]


def seed_data(db):
    from server.models.user import User
    from server.models.doctor import Doctor
    from server.core.security import get_password_hash

    for u in _SEED_USERS:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if not existing:
            user = User(
                id=u["id"],
                email=u["email"],
                hashed_password=get_password_hash(u["password"]),
                full_name=u["full_name"],
                role=u["role"],
                is_active=True,
            )
            db.add(user)
            try:
                db.commit()
            except IntegrityError:
                db.rollback()

    # Seed a default doctor profile for Dr. Sarah Jenkins
    doctor_user = db.query(User).filter(User.email == "doctor@example.com").first()
    if doctor_user:
        doc_profile = db.query(Doctor).filter(Doctor.user_id == doctor_user.id).first()
        if not doc_profile:
            doc = Doctor(
                id="d1111111-1111-1111-1111-111111111111",
                user_id=doctor_user.id,
                department="Cardiology",
                specialization="Cardiovascular Diseases",
                working_hours={
                    "monday": {"start": "08:00", "end": "16:00"},
                    "tuesday": {"start": "08:00", "end": "16:00"},
                    "wednesday": {"start": "08:00", "end": "16:00"},
                    "thursday": {"start": "08:00", "end": "16:00"},
                    "friday": {"start": "08:00", "end": "16:00"},
                },
                slot_duration_mins=30,
            )
            db.add(doc)
            try:
                db.commit()
            except IntegrityError:
                db.rollback()
