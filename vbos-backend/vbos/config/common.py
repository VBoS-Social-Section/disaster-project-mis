import os
from os.path import join

import dj_database_url
from configurations import Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Common(Configuration):

    DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

    INSTALLED_APPS = (
        "jazzmin",               # must be before django.contrib.admin
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
        "vbos.organisations",
        # Audit must load before climate/datasets: vbos.audit.signals imports AuditLog from .models.
        "vbos.audit.apps.AuditConfig",
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
        "vbos.alerts",
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

    # General — release metadata (keep in sync with frontend `src/config/version.ts`)
    DRMIS_API_VERSION = os.getenv("DRMIS_API_VERSION", "1.0.0")
    DRMIS_BUILD_ID = os.getenv("DRMIS_BUILD", "2026.03.21")
    DRMIS_VERSION_DISPLAY = os.getenv(
        "DRMIS_VERSION_DISPLAY",
        f"v{DRMIS_API_VERSION} · Build {DRMIS_BUILD_ID}",
    )
    # Natural-language map query (OpenAI). Uses OPENAI_API_KEY or AI_OPENAI_API_KEY.
    AI_OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "") or os.getenv("AI_OPENAI_API_KEY", "")
    AI_MAP_QUERY_MODEL = os.getenv("AI_MAP_QUERY_MODEL", "gpt-4o-mini")
    APPEND_SLASH = False
    # When True, API catalog visibility is restricted by User.organisation, owning_organisation, shares, and cluster access.
    # Default False preserves pre–multi-tenant behaviour until organisations and rules are populated.
    VBOS_ORGANISATION_SCOPING = os.getenv("VBOS_ORGANISATION_SCOPING", "").lower() in (
        "1",
        "true",
        "yes",
    )
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
            # Project-level `vbos-backend/templates/` is listed first so overrides
            # (e.g. unfold/helpers/app_list.html) win over django-unfold's packaged copy.
            "DIRS": [
                os.path.join(os.path.dirname(BASE_DIR), "templates"),
                os.path.join(BASE_DIR, "templates"),
            ],
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
        "DEFAULT_PAGINATION_CLASS": "vbos.pagination.VbosPageNumberPagination",
        "PAGE_SIZE": int(os.getenv("DJANGO_PAGINATION_LIMIT", 20)),
        "EXCEPTION_HANDLER": "vbos.drf_exception_handler.vbos_exception_handler",
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

    # ── Jazzmin admin (Bootstrap 4 / AdminLTE 3 — Datta Able inspired) ──────
    JAZZMIN_SETTINGS = {
        # Browser tab / header
        "site_title": "DRMIS Admin",
        "site_header": "DRMIS",
        "site_brand": "DRMIS",
        "site_logo": None,
        "site_logo_classes": "img-circle",
        "site_icon": None,
        "welcome_sign": "Disaster Risk Management Information System — Vanuatu NDMO",
        "copyright": "Vanuatu Bureau of Statistics / NDMO",
        "search_model": [],

        # Override admin index with custom dashboard
        "custom_index": "admin/drmis_dashboard.html",

        # Top nav links
        "topmenu_links": [
            {"name": "Live Map", "url": "/", "new_window": True, "icon": "fas fa-map"},
            {"name": "API Docs", "url": "/api/schema/swagger-ui/", "new_window": True, "icon": "fas fa-book"},
        ],

        # User menu
        "usermenu_links": [
            {"name": "Live Map", "url": "/", "new_window": True, "icon": "fas fa-map"},
        ],

        # Sidebar
        "show_sidebar": True,
        "navigation_expanded": False,
        "hide_apps": [
            "auth",
            "admin",
            "organisations",
            "area_submissions",
            "field_check",
            "feedback",
            "land_accounts",
            "coastal_changes",
            "maintenance",
            "django_celery_beat",
            "django_celery_results",
            "authtoken",
            "otp_totp",
            "contenttypes",
            "sessions",
        ],
        "hide_models": [
            # native models hidden — shown via custom_links instead
            "auth.group",
            "auth.user",
            "users.user",
            "users.role",
            "users.smtpsettings",
            "datasets.cluster",
            "datasets.cycloneevent",
            "datasets.disasterdatasettag",
            "datasets.pmtilesdataset",
            "datasets.vectordataset",
            "datasets.vectoritem",
            "datasets.rasterdataset",
            "datasets.tabulardataset",
            "datasets.tabularitem",
            "datasets.mapsavedworkspace",
            "rap_import.rapimportbatch",
            "rap_import.rapimportfile",
            "alerts.alert",
            "climate.climaterasterdataset",
            "climate.climaterasterfile",
            "climate.climatepmtilesdataset",
            "climate.climatevectordataset",
            "climate.climatevectoritem",
            "integrations.integrationsource",
            "integrations.integrationapikey",
            "integrations.externaldatasource",
            "audit.auditlog",
            "admin.logentry",
        ],
        "order_with_respect_to": [
            "users",
            "datasets",
            "rap_import",
            "alerts",
            "climate",
            "integrations",
            "audit",
        ],

        # Fully custom grouped sidebar navigation
        "custom_links": {
            "users": [
                # ── Settings ──────────────────────────────
                {
                    "name": "Users",
                    "url": "admin:users_user_changelist",
                    "icon": "fas fa-user",
                },
                {
                    "name": "Roles",
                    "url": "admin:users_role_changelist",
                    "icon": "fas fa-user-shield",
                },
                {
                    "name": "Organisations",
                    "url": "admin:organisations_organisation_changelist",
                    "icon": "fas fa-sitemap",
                },
                {
                    "name": "SMTP Settings",
                    "url": "admin:users_smtpsettings_changelist",
                    "icon": "fas fa-envelope",
                },
            ],
            "datasets": [
                # ── Disaster ──────────────────────────────
                {
                    "name": "Clusters",
                    "url": "admin:datasets_cluster_changelist",
                    "icon": "fas fa-layer-group",
                },
                {
                    "name": "Hazard Events",
                    "url": "admin:datasets_cycloneevent_changelist",
                    "icon": "fas fa-bolt",
                },
                {
                    "name": "Disaster Dataset Tags",
                    "url": "admin:datasets_disasterdatasettag_changelist",
                    "icon": "fas fa-tag",
                },
                {
                    "name": "PMTiles Datasets",
                    "url": "admin:datasets_pmtilesdataset_changelist",
                    "icon": "fas fa-map",
                },
                {
                    "name": "Vector Datasets",
                    "url": "admin:datasets_vectordataset_changelist",
                    "icon": "fas fa-draw-polygon",
                },
                {
                    "name": "Vector Items",
                    "url": "admin:datasets_vectoritem_changelist",
                    "icon": "fas fa-map-marker-alt",
                },
                {
                    "name": "Raster Datasets",
                    "url": "admin:datasets_rasterdataset_changelist",
                    "icon": "fas fa-image",
                },
                {
                    "name": "Tabular Datasets",
                    "url": "admin:datasets_tabulardataset_changelist",
                    "icon": "fas fa-table",
                },
                {
                    "name": "Tabular Items",
                    "url": "admin:datasets_tabularitem_changelist",
                    "icon": "fas fa-th",
                },
                {
                    "name": "Saved Workspaces",
                    "url": "admin:datasets_mapsavedworkspace_changelist",
                    "icon": "fas fa-bookmark",
                },
            ],
            "rap_import": [
                {
                    "name": "Import Batches",
                    "url": "admin:rap_import_rapimportbatch_changelist",
                    "icon": "fas fa-boxes",
                },
                {
                    "name": "Compare RAP Batches",
                    "url": "/admin/compare/event/",
                    "icon": "fas fa-code-branch",
                },
            ],
            "alerts": [
                {
                    "name": "Live Alerts",
                    "url": "admin:alerts_alert_changelist",
                    "icon": "fas fa-exclamation-triangle",
                },
                {
                    "name": "Area Submissions",
                    "url": "admin:area_submissions_areadatasubmission_changelist",
                    "icon": "fas fa-file-upload",
                },
                {
                    "name": "Field Checks",
                    "url": "admin:field_check_fieldcheckrecord_changelist",
                    "icon": "fas fa-clipboard-check",
                },
                {
                    "name": "Feedback",
                    "url": "admin:feedback_feedback_changelist",
                    "icon": "fas fa-comment-dots",
                },
            ],
            "climate": [
                {
                    "name": "PMTiles Datasets",
                    "url": "admin:climate_climatepmtilesdataset_changelist",
                    "icon": "fas fa-map",
                },
                {
                    "name": "Raster Datasets",
                    "url": "admin:climate_climaterasterdataset_changelist",
                    "icon": "fas fa-image",
                },
                {
                    "name": "Vector Datasets",
                    "url": "admin:climate_climatevectordataset_changelist",
                    "icon": "fas fa-draw-polygon",
                },
                {
                    "name": "Vector Items",
                    "url": "admin:climate_climatevectoritem_changelist",
                    "icon": "fas fa-map-marker-alt",
                },
            ],
            "integrations": [
                {
                    "name": "Integration Sources",
                    "url": "admin:integrations_integrationsource_changelist",
                    "icon": "fas fa-server",
                },
                {
                    "name": "API Keys",
                    "url": "admin:integrations_integrationapikey_changelist",
                    "icon": "fas fa-key",
                },
                {
                    "name": "External Data Sources",
                    "url": "admin:integrations_externaldatasource_changelist",
                    "icon": "fas fa-cloud-download-alt",
                },
            ],
            "audit": [
                {
                    "name": "DRMIS Audit Log",
                    "url": "admin:audit_auditlog_changelist",
                    "icon": "fas fa-search",
                },
                {
                    "name": "Admin Action Log",
                    "url": "admin:admin_logentry_changelist",
                    "icon": "fas fa-list-alt",
                },
                {
                    "name": "Backup & Restore",
                    "url": "/admin/maintenance/",
                    "icon": "fas fa-tools",
                },
                {
                    "name": "Backup History",
                    "url": "admin:maintenance_backuplog_changelist",
                    "icon": "fas fa-hdd",
                },
            ],
        },

        # Icons — Material/FontAwesome mapped to app/model
        "icons": {
            # App group icons (shown as collapsible section headers)
            "auth":                     "fas fa-users-cog",
            "users":                    "fas fa-users",
            "organisations":            "fas fa-building",
            "datasets":                 "fas fa-database",
            "rap_import":               "fas fa-file-import",
            "alerts":                   "fas fa-bell",
            "area_submissions":         "fas fa-upload",
            "field_check":              "fas fa-check-circle",
            "feedback":                 "fas fa-comment-alt",
            "climate":                  "fas fa-thermometer-half",
            "land_accounts":            "fas fa-leaf",
            "coastal_changes":          "fas fa-water",
            "integrations":             "fas fa-plug",
            "audit":                    "fas fa-history",
            "maintenance":              "fas fa-tools",
            # Models
            "users.user":                           "fas fa-user",
            "users.role":                           "fas fa-user-shield",
            "users.smtpsettings":                   "fas fa-envelope",
            "organisations.organisation":           "fas fa-sitemap",
            "organisations.organisationclusteraccess": "fas fa-key",
            "organisations.datasetorganisationshare":  "fas fa-share-alt",
            "datasets.cluster":                     "fas fa-layer-group",
            "datasets.cycloneevent":                "fas fa-bolt",
            "datasets.pmtilesdataset":              "fas fa-map",
            "datasets.vectordataset":               "fas fa-draw-polygon",
            "datasets.vectoritem":                  "fas fa-map-marker-alt",
            "datasets.rasterdataset":               "fas fa-image",
            "datasets.tabulardataset":              "fas fa-table",
            "datasets.tabularitem":                 "fas fa-th",
            "datasets.mapsavedworkspace":           "fas fa-bookmark",
            "datasets.disasterdatasettag":          "fas fa-tag",
            "rap_import.rapimportbatch":            "fas fa-boxes",
            "rap_import.rapimportfile":             "fas fa-file-excel",
            "alerts.alert":                         "fas fa-exclamation-triangle",
            "area_submissions.areadatasubmission":  "fas fa-file-upload",
            "area_submissions.areaadministrator":   "fas fa-user-tie",
            "field_check.fieldcheckrecord":         "fas fa-clipboard-check",
            "feedback.feedback":                    "fas fa-comment-dots",
            "climate.climaterasterdataset":         "fas fa-image",
            "climate.climatepmtilesdataset":        "fas fa-map",
            "climate.climatevectordataset":         "fas fa-draw-polygon",
            "climate.climatevectoritem":            "fas fa-map-marker-alt",
            "land_accounts.landaccountsdata":       "fas fa-seedling",
            "coastal_changes.coastalchangesdata":   "fas fa-water",
            "integrations.integrationsource":       "fas fa-server",
            "integrations.integrationapikey":       "fas fa-key",
            "integrations.externaldatasource":      "fas fa-cloud-download-alt",
            "audit.auditlog":                       "fas fa-search",
            "maintenance.backuplog":                "fas fa-hdd",
            "admin.logentry":                       "fas fa-list-alt",
        },

        "default_icon_parents": "fas fa-chevron-right",
        "default_icon_children": "fas fa-circle",

        # Override the display names of the app groups in the sidebar
        "apps_icons": {
            "users":        "fas fa-cog",
            "datasets":     "fas fa-database",
            "rap_import":   "fas fa-file-import",
            "alerts":       "fas fa-bell",
            "climate":      "fas fa-thermometer-half",
            "integrations": "fas fa-plug",
            "audit":        "fas fa-history",
        },

        # UI tweaks
        "related_modal_active": True,
        "custom_css": "admin/css/drmis_jazzmin.css",
        "custom_js": "admin/js/drmis_sidebar.js",
        "use_google_fonts_cdn": True,
        "show_ui_builder": False,
        "changeform_format": "horizontal_tabs",
        "changeform_format_overrides": {
            "auth.user": "collapsible",
            "auth.group": "vertical_tabs",
        },
        "language_chooser": False,
    }

    JAZZMIN_UI_TWEAKS = {
        "navbar_small_text": False,
        "footer_small_text": False,
        "body_small_text": False,
        "brand_small_text": False,
        # Datta Able colour palette
        "brand_colour": "navbar-primary",
        "accent": "accent-primary",
        "navbar": "navbar-white navbar-light",
        "no_navbar_border": True,
        "navbar_fixed": True,
        "layout_boxed": False,
        "footer_fixed": False,
        "sidebar_fixed": True,
        "sidebar": "sidebar-light-primary",
        "sidebar_nav_small_text": False,
        "sidebar_disable_expand": False,
        "sidebar_nav_child_indent": True,
        "sidebar_nav_compact_style": False,
        "sidebar_nav_legacy_style": True,
        "sidebar_nav_flat_style": False,
        "theme": "default",
        "dark_mode_theme": None,
        "button_classes": {
            "primary": "btn-primary",
            "secondary": "btn-secondary",
            "info": "btn-info",
            "warning": "btn-warning",
            "danger": "btn-danger",
            "success": "btn-success",
        },
    }

    # OpenAPI / Swagger — product-facing docs
    _spectacular_description = """\
**Disaster Risk Management Information System (DRMIS)** — Vanuatu NDMO.

### Authentication
- Obtain a token: `POST /api-token-auth/` with JSON `{"username":"…","password":"…"}`.
- Send `Authorization: Token <your-token>` on API requests.
- Some flows require email OTP or TOTP after password verification (`/api/v1/auth/…`).

### Conventions
- **Pagination** (list endpoints): `count`, `next`, `previous`, `results`. Use `?page=` and `?page_size=` where supported.
- **Errors**: validation → `{"errors": {"field_name": ["message"]}}`; other 4xx/5xx → `{"detail": "message"}`.

### Metadata
- `GET /api/v1/meta/` — API name, version, build, doc links.
- `GET /api/v1/health/` or `GET /health/` — liveness and dependency checks.
"""

    SPECTACULAR_SETTINGS = {
        "TITLE": "DRMIS API",
        "DESCRIPTION": _spectacular_description,
        "VERSION": DRMIS_API_VERSION,
        "SERVE_INCLUDE_SCHEMA": False,
        "CONTACT": {
            "name": "NDMO / DRMIS operators",
            "email": "info@developmentseed.org",
        },
        "LICENSE": {"name": "Proprietary"},
        "TAGS": [
            {"name": "metadata", "description": "API info, health, and discovery"},
            {"name": "datasets", "description": "Clusters, rasters, vectors, tabular data, provinces"},
            {"name": "auth", "description": "Tokens, 2FA, current user"},
            {"name": "alerts", "description": "Live hazard feeds (USGS, VMGD, GDACS, DRMIS)"},
            {"name": "maintenance", "description": "Tasks, backups, operator tools"},
        ],
        "APPEND_COMPONENTS": {
            "securitySchemes": {
                "TokenAuth": {
                    "type": "apiKey",
                    "in": "header",
                    "name": "Authorization",
                    "description": (
                        "Obtain a token with `POST /api-token-auth/` (username + password). "
                        "Header value: `Token <your-token>`"
                    ),
                },
            },
        },
        "SECURITY": [{"TokenAuth": []}],
        "SWAGGER_UI_SETTINGS": {
            "deepLinking": True,
            "persistAuthorization": True,
            "displayRequestDuration": True,
            "filter": True,
            "tryItOutEnabled": True,
        },
        "COMPONENT_SPLIT_REQUEST": True,
        "SORT_OPERATIONS": True,
    }
