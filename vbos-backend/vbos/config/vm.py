"""
VM / self-hosted deployment configuration.
Uses local file storage (no S3) and relaxed CORS for VM IP access.
"""
import os

from .common import Common


class Vm(Common):
    DEBUG = False
    INSTALLED_APPS = Common.INSTALLED_APPS + ("gunicorn",)

    # Static files in Docker volume at /app/staticfiles (shared with nginx)
    STATIC_ROOT = "/app/staticfiles"

    # Media files: Docker mounts vbos-backend/media to /app/media (see docker-compose volume)
    MEDIA_ROOT = "/app/media"

    # Allow cookies over HTTP for VM (no HTTPS)
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False

    # Allow VM host in CSRF (set DJANGO_VM_HOST or default to common IPs)
    _vm_host = os.getenv("DJANGO_VM_HOST", "http://10.252.0.158")
    CSRF_TRUSTED_ORIGINS = list(Common.CSRF_TRUSTED_ORIGINS) + [
        _vm_host,
        f"{_vm_host}:8000",
        "http://localhost",
        "http://127.0.0.1",
    ]

    # CORS – allow VM origin (CORS_ALLOW_ALL_ORIGINS=True for simplicity on VM)
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOW_CREDENTIALS = True
    
    # CSRF - disable for VM if needed, or allow all
    CSRF_ALLOW_ALL_ORIGINS = True
    
    # Ensure we trust the proxy (Nginx)
    USE_X_FORWARDED_HOST = True
    SECURE_PROXY_SSL_HEADER = None # Disable SSL check for VM (HTTP)
