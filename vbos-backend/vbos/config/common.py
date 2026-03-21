import os
from os.path import join

import dj_database_url
from configurations import Configuration
from django.templatetags.static import static

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Common(Configuration):

    DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

    INSTALLED_APPS = (
        "unfold",
        "unfold.contrib.filters",
        "unfold.contrib.forms",
        "unfold.contrib.inlines",
        "django.contrib.admin",
        "django.contrib.gis",
        "vbos.auth_config.RolesAndPermissionsConfig",  # was django.contrib.auth
        "django.contrib.contenttypes",
        "django.contrib.sessions",
        "django.contrib.messages",
        "django.contrib.staticfiles",
        # Third party apps
        "django_otp",
        "django_otp.plugins.otp_totp",
        "rest_framework",  # utilities for rest apis
        "rest_framework.authtoken",  # token authentication
        "rest_framework_gis",
        "drf_spectacular",  # api-docs
        "django_filters",  # for filtering rest endpoints
        "corsheaders",
        "adminsortable2",  # drag-and-drop reordering in admin
        "django_celery_beat",
        "django_celery_results",
        # Your apps
        "vbos.users",
        "vbos.climate",
        "vbos.land_accounts",
        "vbos.coastal_changes",
        "vbos.datasets.apps.DatasetsConfig",
        "vbos.integrations",
        "vbos.feedback",
        "vbos.area_submissions",
        "vbos.field_check",
        "vbos.maintenance",
        "vbos.rap_import",
        "vbos.compare",
    )

    # https://docs.djangoproject.com/en/2.0/topics/http/middleware/
    MIDDLEWARE = (
        "django.middleware.security.SecurityMiddleware",
        "whitenoise.middleware.WhiteNoiseMiddleware",
        "django.contrib.sessions.middleware.SessionMiddleware",
        "corsheaders.middleware.CorsMiddleware",
        "django.middleware.common.CommonMiddleware",
        "django.middleware.csrf.CsrfViewMiddleware",
        "django.contrib.auth.middleware.AuthenticationMiddleware",
        "django_otp.middleware.OTPMiddleware",
        "django.contrib.messages.middleware.MessageMiddleware",
        "django.middleware.clickjacking.XFrameOptionsMiddleware",
    )

    ALLOWED_HOSTS = ["*"]
    ROOT_URLCONF = "vbos.urls"
    SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")
    WSGI_APPLICATION = "vbos.wsgi.application"

    # Handle CSRF
    CSRF_TRUSTED_ORIGINS = ["https://*.ds.io", "http://localhost:8000"]
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True  # Ensure session cookie is sent over HTTPS
    CSRF_COOKIE_SECURE = True  # Ensures CSRF cookie is sent over HTTPS
    CSRF_COOKIE_HTTPONLY = False  # Allows CSRF cookie to be read by JavaScript

    # Email
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    # Require 6-digit OTP sent to email on every login (set False to use password-only or per-user 2FA)
    # DISABLE_2FA_GLOBALLY=true bypasses OTP entirely (e.g. for recovery)
    _otp_env = os.getenv("OTP_REQUIRED_FOR_ALL_LOGINS", "true").lower() in ("true", "1", "yes")
    _disable_globally = os.getenv("DISABLE_2FA_GLOBALLY", "").lower() in ("true", "1", "yes")
    OTP_REQUIRED_FOR_ALL_LOGINS = _otp_env and not _disable_globally

    ADMINS = (("Author", "info@developmentseed.org"),)

    # Postgres – use DJANGO_DB_URL (config reads DATABASE_URL by default)
    _db_url = os.getenv(
        "DJANGO_DB_URL",
        os.getenv("DATABASE_URL", "postgis://postgres:postgres@postgres:5432/vbos"),
    )
    DATABASES = {
        "default": {
            **dj_database_url.parse(_db_url),
            "CONN_MAX_AGE": int(os.getenv("POSTGRES_CONN_MAX_AGE", 600)),
        }
    }

    # General
    APPEND_SLASH = False
    # Allow bulk delete and changelist edits for many items (TabularItems, VectorItems)
    DATA_UPLOAD_MAX_NUMBER_FIELDS = int(os.getenv("DATA_UPLOAD_MAX_NUMBER_FIELDS", 200000))
    TIME_ZONE = "UTC"
    LANGUAGE_CODE = "en-us"
    # If you set this to False, Django will make some optimizations so as not
    # to load the internationalization machinery.
    USE_I18N = False
    USE_L10N = True
    USE_TZ = True
    LOGIN_REDIRECT_URL = "/"

    # Static files (CSS, JavaScript, Images)
    # https://docs.djangoproject.com/en/2.0/howto/static-files/
    STATIC_ROOT = os.path.normpath(join(os.path.dirname(BASE_DIR), "static"))
    STATICFILES_DIRS = [os.path.join(BASE_DIR, "static")]
    STATIC_URL = "/static/"
    STATICFILES_FINDERS = (
        "django.contrib.staticfiles.finders.FileSystemFinder",
        "django.contrib.staticfiles.finders.AppDirectoriesFinder",
    )

    # Media files
    MEDIA_ROOT = join(os.path.dirname(BASE_DIR), "media")
    MEDIA_URL = "/media/"

    TEMPLATES = [
        {
            "BACKEND": "django.template.backends.django.DjangoTemplates",
            "DIRS": [os.path.join(BASE_DIR, "templates")],
            "APP_DIRS": True,
            "OPTIONS": {
                "context_processors": [
                    "django.template.context_processors.debug",
                    "django.template.context_processors.request",
                    "django.contrib.auth.context_processors.auth",
                    "django.contrib.messages.context_processors.messages",
                ],
            },
        },
    ]

    # Set DEBUG to False as a default for safety
    # https://docs.djangoproject.com/en/dev/ref/settings/#debug
    DEBUG = os.getenv("DJANGO_DEBUG", "no").lower() in ("true", "1", "yes")

    # Password Validation
    # https://docs.djangoproject.com/en/2.0/topics/auth/passwords/#module-django.contrib.auth.password_validation
    AUTH_PASSWORD_VALIDATORS = [
        {
            "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
        },
        {
            "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        },
        {
            "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
        },
        {
            "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
        },
    ]

    # Logging
    LOGGING = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "django.server": {
                "()": "django.utils.log.ServerFormatter",
                "format": "[%(server_time)s] %(message)s",
            },
            "verbose": {
                "format": "%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s"
            },
            "simple": {"format": "%(levelname)s %(message)s"},
        },
        "filters": {
            "require_debug_true": {
                "()": "django.utils.log.RequireDebugTrue",
            },
        },
        "handlers": {
            "django.server": {
                "level": "INFO",
                "class": "logging.StreamHandler",
                "formatter": "django.server",
            },
            "console": {
                "level": "DEBUG",
                "class": "logging.StreamHandler",
                "formatter": "simple",
            },
            "mail_admins": {
                "level": "ERROR",
                "class": "django.utils.log.AdminEmailHandler",
            },
        },
        "loggers": {
            "django": {
                "handlers": ["console"],
                "propagate": True,
            },
            "django.server": {
                "handlers": ["django.server"],
                "level": "INFO",
                "propagate": False,
            },
            "django.request": {
                "handlers": ["mail_admins", "console"],
                "level": "ERROR",
                "propagate": False,
            },
            "django.db.backends": {"handlers": ["console"], "level": "INFO"},
        },
    }

    # Custom user app
    AUTH_USER_MODEL = "users.User"

    # Caching - LocMem for dev; set DJANGO_CACHE_BACKEND for production
    # Options: django.core.cache.backends.db.DatabaseCache (LOCATION=vbos_cache)
    #          django.core.cache.backends.redis.RedisCache (LOCATION=redis://...)
    # For DatabaseCache: run "python manage.py createcachetable" before use
    _cache_backend = os.getenv(
        "DJANGO_CACHE_BACKEND",
        "django.core.cache.backends.locmem.LocMemCache",
    )
    CACHES = {
        "default": {
            "BACKEND": _cache_backend,
            "LOCATION": os.getenv("DJANGO_CACHE_LOCATION", "vbos-default"),
            "TIMEOUT": int(os.getenv("DJANGO_CACHE_TIMEOUT", 300)),  # 5 min default
        }
    }

    # Celery (broker from env; result backend via django-celery-results)
    CELERY_BROKER_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND = "django-db"
    CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"
    CELERY_TASK_SERIALIZER = "json"
    CELERY_ACCEPT_CONTENT = ["json"]
    CELERY_TIMEZONE = TIME_ZONE

    # Django Rest Framework
    REST_FRAMEWORK = {
        "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
        "PAGE_SIZE": int(os.getenv("DJANGO_PAGINATION_LIMIT", 20)),
        "DATETIME_FORMAT": "%Y-%m-%dT%H:%M:%S%z",
        "DEFAULT_RENDERER_CLASSES": (
            "rest_framework.renderers.JSONRenderer",
            "rest_framework.renderers.BrowsableAPIRenderer",
            "drf_excel.renderers.XLSXRenderer",
        ),
        "DEFAULT_FILTER_BACKENDS": [
            "django_filters.rest_framework.DjangoFilterBackend"
        ],
        "DEFAULT_PERMISSION_CLASSES": [
            "rest_framework.permissions.IsAuthenticated",
        ],
        "DEFAULT_AUTHENTICATION_CLASSES": (
            "rest_framework.authentication.SessionAuthentication",
            "rest_framework.authentication.TokenAuthentication",
        ),
        "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    }

    # Unfold admin — DRMIS light enterprise (red accent, white sidebar)
    UNFOLD = {
        "SITE_TITLE": "DRMIS Admin",
        "SITE_HEADER": "Disaster Risk Management Information System",
        "SITE_SUBHEADER": "Vanuatu — NDMO",
        "SITE_URL": "/",
        "SITE_ICON": None,
        "SHOW_HISTORY": True,
        "SHOW_VIEW_ON_SITE": True,
        "THEME": "light",
        "ENVIRONMENT": "vbos.admin_env.environment_callback",
        # GeoDjango map widget; full light theme loads after Unfold via admin/base_site.html extrastyle
        "STYLES": [
            lambda request: static("admin/css/gis_fix.css"),
        ],
        "DASHBOARD_CALLBACK": "vbos.admin_dashboard.dashboard_callback",
        "COLORS": {
            "primary": {
                "50": "255 241 238",
                "100": "255 213 204",
                "200": "255 160 140",
                "300": "255 115 90",
                "400": "255 75 43",
                "500": "230 62 32",
                "600": "200 50 25",
                "700": "165 38 18",
                "800": "130 28 12",
                "900": "95 18 8",
                "950": "60 10 4",
            },
            "base": {
                "50": "245 246 248",
                "100": "248 249 251",
                "200": "226 230 238",
                "300": "200 204 214",
                "400": "154 165 184",
                "500": "107 116 136",
                "600": "74 85 104",
                "700": "53 59 71",
                "800": "33 38 48",
                "900": "13 16 24",
                "950": "8 10 14",
            },
            "font": {
                "subtle-light": "154 165 184",
                "default-light": "13 16 24",
                "important-light": "13 16 24",
                "subtle-dark": "154 165 184",
                "default-dark": "13 16 24",
                "important-dark": "13 16 24",
            },
        },
        "SIDEBAR": {
            "show_search": True,
            "show_all_applications": False,
            "navigation": "vbos.admin_config.get_navigation",
        },
    }

    SPECTACULAR_SETTINGS = {
        "TITLE": "VBoS MIS API",
        "DESCRIPTION": "VBoS Management Information System API. Built with Django.",
        "VERSION": "1.0.0",
        "SERVE_INCLUDE_SCHEMA": False,
        "APPEND_COMPONENTS": {
            "securitySchemes": {
                "TokenAuth": {
                    "type": "apiKey",
                    "in": "header",
                    "name": "Authorization",
                    "description": (
                        "Token authentication. Obtain a token via POST /api-token-auth/ "
                        "with username and password. Use: 'Token <your-token>'"
                    ),
                },
            },
        },
        "SECURITY": [{"TokenAuth": []}],
        "SWAGGER_UI_SETTINGS": {
            "deepLinking": True,
            "persistAuthorization": True,
        },
    }
