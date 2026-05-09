from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class TelegramAccount(TimestampMixin, Base):
    __tablename__ = "telegram_accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    chat_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    username: Mapped[str | None] = mapped_column(String(128), nullable=True)
    bot_token: Mapped[str | None] = mapped_column(String(256), nullable=True)

    user = relationship("User", back_populates="telegram_account")

    @property
    def bot_token_configured(self) -> bool:
        return bool(self.bot_token)
