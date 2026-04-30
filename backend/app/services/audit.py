from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AuditLog


def log_action(db: AsyncSession, user_id: int | None, action: str, details: str) -> None:
    db.add(AuditLog(user_id=user_id, action=action, details=details))
