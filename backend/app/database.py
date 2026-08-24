"""Async SQLAlchemy motoru ve oturum fabrikasi."""
from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings


class Base(DeclarativeBase):
    """Tum ORM modelleri icin ortak taban."""


_settings = get_settings()

engine = create_async_engine(
    _settings.database_url,
    echo=False,
    future=True,
    connect_args={"timeout": 30} if "sqlite" in _settings.database_url else {},
)

from sqlalchemy import event

@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    import sqlite3
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA busy_timeout=30000")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA cache_size=-64000")  # 64MB RAM cache
        cursor.execute("PRAGMA mmap_size=268435456")  # 256MB Memory-Mapped I/O
        cursor.execute("PRAGMA temp_store=MEMORY")  # In-memory temporary tables
        cursor.close()

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def init_db() -> None:
    """Uygulama baslangicinda tablolari olusturur ve sema migration uygular."""
    # Modellerin import edilmesi gerekiyor - circular'i onlemek icin burada
    from app.models import (  # noqa: F401
        conversation,
        message,
        scheduled_task,
        log,
        plan,
        approval,
        audit,
        dream,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Idempotent sema migration: mevcut tablolara eksik sutunlari ekle
        await conn.run_sync(_apply_schema_migrations)


def _apply_schema_migrations(sync_conn) -> None:
    """SQLite icin basit additive migration: ALTER TABLE ADD COLUMN.

    SQLAlchemy create_all() mevcut tabloya yeni sutun EKLEMEZ. Bu yuzden
    model'e sonradan sutun eklediğimizde elle ALTER TABLE atmak gerekir.
    Bu fonksiyon her başlangıçta çalışır, tüm operasyonlar idempotent
    (sutun varsa hata yok, yoksa eklenir).
    """
    from sqlalchemy import inspect, text

    inspector = inspect(sync_conn)

    # Tablo varsa sütun listesini al, yoksa atla
    def _has_column(table: str, column: str) -> bool:
        try:
            cols = [c["name"] for c in inspector.get_columns(table)]
            return column in cols
        except Exception:
            return False

    def _add_column_if_missing(table: str, column: str, sql_type: str) -> None:
        """Tablo + sutun yoksa ekle, durumunu logla."""
        try:
            if not inspector.has_table(table):
                return
            if _has_column(table, column):
                return
            sync_conn.execute(text(f'ALTER TABLE {table} ADD COLUMN {column} {sql_type}'))
            logger.info("Veritabanı Şeması Güncellendi: %s tablosuna %s kolonu eklendi.", table, column)
        except Exception as exc:
            logger.warning("Veritabanı migration Uyarısı (%s.%s): %s", table, column, exc)

    # plans tablosu: failure_analysis_json (Sprint F.4)
    _add_column_if_missing("plans", "failure_analysis_json", "TEXT")


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: her istek icin yeni async session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def session_scope() -> AsyncGenerator[AsyncSession, None]:
    """Scheduler gibi dependency olmayan yerlerde kullanim icin."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()