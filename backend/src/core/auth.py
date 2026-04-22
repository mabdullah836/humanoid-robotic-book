"""
Auth context for the backend.

Authentication (sign-in, sign-up, session) is handled by the frontend (Next.js + Better Auth).
The frontend proxy sends requests to this backend with session cookies; the proxy validates
the session and forwards these headers:

  - X-User-ID: Better Auth user id
  - X-User-Email: User email (if present)
  - X-User-Name: User display name (if present)

This module is a placeholder for optional backend use (e.g. extracting user from headers
in a dependency, logging, or rate-limiting by user). No JWT or session validation is
done in the backend; the proxy is the only auth boundary.
"""
