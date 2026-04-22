"""
Session manager for maintaining conversation context.
Stores conversation history in memory (can be extended to Redis).
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from collections import defaultdict
import threading

from src.config import settings

logger = logging.getLogger(__name__)


class SessionManager:
    """Manages conversation sessions and history."""

    def __init__(self):
        """Initialize session manager."""
        # In-memory storage: session_id -> list of messages
        self._sessions: Dict[str, List[Dict[str, str]]] = defaultdict(list)

        # Track last access time for cleanup
        self._last_access: Dict[str, datetime] = {}

        # Lock for thread safety
        self._lock = threading.Lock()

        logger.info("Session manager initialized (in-memory mode)")

    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
    ):
        """
        Add a message to the session history.

        Args:
            session_id: Session identifier.
            role: Message role ('user' or 'assistant').
            content: Message content.
        """
        with self._lock:
            message = {"role": role, "content": content}
            self._sessions[session_id].append(message)
            self._last_access[session_id] = datetime.now()

            # Trim history if too long
            max_history = settings.max_conversation_history
            if len(self._sessions[session_id]) > max_history:
                # Keep only the most recent messages
                self._sessions[session_id] = self._sessions[session_id][-max_history:]

            logger.debug(
                f"Added {role} message to session {session_id}. "
                f"History length: {len(self._sessions[session_id])}"
            )

    def get_history(
        self,
        session_id: str,
        max_messages: Optional[int] = None,
    ) -> List[Dict[str, str]]:
        """
        Get conversation history for a session.

        Args:
            session_id: Session identifier.
            max_messages: Maximum number of recent messages to return.

        Returns:
            List of messages in chronological order.
        """
        with self._lock:
            history = self._sessions.get(session_id, [])
            self._last_access[session_id] = datetime.now()

            if max_messages:
                return history[-max_messages:]
            return history

    def clear_session(self, session_id: str):
        """
        Clear a session's history.

        Args:
            session_id: Session identifier.
        """
        with self._lock:
            if session_id in self._sessions:
                del self._sessions[session_id]
            if session_id in self._last_access:
                del self._last_access[session_id]
            logger.info(f"Cleared session: {session_id}")

    def cleanup_expired_sessions(self):
        """Remove sessions that haven't been accessed recently."""
        with self._lock:
            now = datetime.now()
            timeout = timedelta(minutes=settings.session_timeout_minutes)
            expired = [
                sid
                for sid, last_access in self._last_access.items()
                if now - last_access > timeout
            ]

            for session_id in expired:
                del self._sessions[session_id]
                del self._last_access[session_id]

            if expired:
                logger.info(f"Cleaned up {len(expired)} expired sessions")

    def get_session_count(self) -> int:
        """Get the number of active sessions."""
        with self._lock:
            return len(self._sessions)

    def session_exists(self, session_id: str) -> bool:
        """Check if a session exists."""
        with self._lock:
            return session_id in self._sessions


# Global session manager instance
_session_manager: SessionManager | None = None


def get_session_manager() -> SessionManager:
    """Get or create the global session manager instance."""
    global _session_manager
    if _session_manager is None:
        _session_manager = SessionManager()
    return _session_manager