# Changelog

All notable changes to the VBoS Management Information System project.

---

## [Unreleased] – 2026-02-24

### Documentation & Onboarding

- **CONTRIBUTING.md**: Setup instructions, code conventions, pull request process.
- **Architecture diagram**: Mermaid diagram in README showing SPA, API, DB, TiTiler, PMTiles, and S3.
- **Environment templates**: `.env.example` with commented placeholders for all backend and frontend variables (Django, Postgres, AWS/S3, cache, API).
- **Changelog**: `CHANGELOG.md` maintained for releases and notable changes.

---

### Backend

#### API Response Caching
- **Caching for reference data endpoints**: `ClusterListView`, `ProvinceListView`, and `AreaCouncilListView` now use 15-minute response caching (`cache_page`) to reduce load on frequently accessed data.
- **Configurable cache backend**: `CACHES` in `vbos/config/common.py` uses:
  - **Default**: `LocMemCache` for local development
  - **Production**: Set `DJANGO_CACHE_BACKEND` to `django.core.cache.backends.db.DatabaseCache` or `django.core.cache.backends.redis.RedisCache`
  - `DJANGO_CACHE_LOCATION` – table name (DB) or Redis URL
  - `DJANGO_CACHE_TIMEOUT` – default 300 seconds
- **Database cache**: Run `python manage.py createcachetable` before using DB cache.

#### Database Indexes
- **TabularItem composite index**: Added `(dataset, province, area_council)` to speed up tabular data queries.
- Migration: `0023_add_tabular_item_indexes.py`
- Apply with: `docker-compose exec web ./manage.py migrate`

#### OpenAPI / drf-spectacular
- Token auth scheme (`TokenAuth`) documented in the schema (`apiKey` in `Authorization` header).
- Swagger UI `persistAuthorization: true` so tokens are retained across page reloads.
- Obtain a token via `POST /api-token-auth/` with username and password.

---

### Frontend

#### Performance

- **React Query cache tuning** (`Providers.tsx`): `staleTime` 5 min, `gcTime` 10 min to cut down refetches.
- **Lazy-loaded Map** (`App.tsx`): Map component loaded with `React.lazy()` for quicker initial paint after login.
- **Accordion `lazyMount`** (`LeftSidebar`): Cluster dataset fetches happen only when a cluster accordion is expanded.
- **Indicator loading**:
  - Backend: `DataResultsSetPagination` (1000/page, max 5000) for tabular data.
  - Backend: `select_related("province", "area_council")` on `TabularDatasetDataView` to avoid N+1 queries.
  - Frontend: `page_size` raised from 500 to 2000.

#### Bug Fixes

- **`useAdminAreaStats` infinite loop**: Switched from `useEffect` + `useState` to `useMemo` and stable GeoJSON fallbacks in `useLegendLayers` and `AdminAreaLayers`.
- **Stats list key**: Added `key={attr}` to `Stat.Root` in the stats list map.
- **StatsChart dimensions**: Fixed width/height `-1` warning by using fixed height and explicit dimensions.

#### UX Improvements

- **Error boundary** (`ErrorBoundary.tsx`): Catches render errors and shows a fallback with retry.
- **PWA** (`vite-plugin-pwa`): Manifest and service worker; map tiles cached for limited offline use; `autoUpdate` for SW updates.
- **Skeleton loaders**: Replaced `Spinner` with `Skeleton` for Map, VectorLayers, and TabularLayer.
- **Toast notifications** (Sonner): Login success/failure; session expired and offline in HTTP client; download success/error in `DownloadDataDialog`.
- **Keyboard shortcuts**: Escape closes the time series panel (BottomDrawer).
- **Focus management**: Login form auto-focuses on username; `aria-label`s on login fields and layer remove button.

#### Build & Performance (Vite)

- **Compression** (`vite-plugin-compression`): Gzip and Brotli compression of JS/CSS assets during build for smaller transfer sizes.
- **Chunk splitting**: Vendor code split into `map`, `react`, `chakra`, `charts`, and `vendor` chunks to improve caching and parallel loading.
- **Bundle analysis** (`rollup-plugin-visualizer`): `pnpm build` generates `dist/stats.html` with treemap of bundle composition (gzip/Brotli sizes). Open it to track bundle size.
- **Image optimization**: When adding images, use responsive formats (WebP, AVIF) and appropriate sizing for better performance.

#### Django Production Checks

- **`scripts/check-deploy.sh`**: Runs `python manage.py check --deploy` with `DEBUG=False` before production builds.
- **Docker**: `docker-compose run --rm -e DJANGO_DEBUG=false web python manage.py check --deploy`
- Documented in README Deployment section.

---

## Setup Notes (for new deployments)

- **Backend `.env`**: Copy `.env.example` to `.env`; set `DJANGO_SECRET_KEY` and other vars.
- **Frontend `.env.local`**: `VITE_API_HOST=http://localhost:8000`, `VITE_TITILER_API=http://localhost:8002` (or your API base URLs).
- **Admin user**: `docker-compose exec web ./manage.py createsuperuser`
- **Change admin password**: `docker-compose exec web ./manage.py changepassword <username>`
