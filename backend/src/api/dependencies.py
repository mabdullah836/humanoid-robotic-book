"""
FastAPI dependencies for the backend.

Use these in route handlers when you need request-scoped data (e.g. user context
from the Next.js proxy headers). Auth is enforced by the frontend proxy; these
dependencies only extract optional context.
"""

from typing import Annotated, Optional

from fastapi import Header


def get_user_context(
    x_user_id: Annotated[Optional[str], Header(alias="X-User-ID")] = None,
    x_user_email: Annotated[Optional[str], Header(alias="X-User-Email")] = None,
    x_user_name: Annotated[Optional[str], Header(alias="X-User-Name")] = None,
) -> dict:
    """
    Extract user context from headers set by the frontend proxy.
    Use in routes when you need user id/email/name for logging or personalization.
    """
    return {
        "user_id": x_user_id,
        "email": x_user_email,
        "name": x_user_name,
    }
