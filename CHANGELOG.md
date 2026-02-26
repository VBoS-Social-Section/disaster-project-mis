# Changelog

All notable changes to the VBoS Management Information System project.

---

## [Unreleased] – 2026-02-24

### Charts (Highcharts)

- **Highcharts migration**: Replaced Recharts and Chakra Charts with Highcharts for all visualizations.
- **StatsChart**: Stacked bar chart (province level) or grouped bars (area council level) with Highcharts.
- **BottomDrawer time series**: Line chart with annual/monthly toggle using Highcharts.
- **Color palette**: Sequential blue-to-green palette for charts (`colors.ts`).
- **Dependencies**: Removed `@chakra-ui/charts` and `recharts`; added `highcharts` and `highcharts-react-official`.
- **Vite**: Chunk split for `highcharts` instead of recharts.

### Left Sidebar Performance

- **Lazy-load datasets**: Datasets are fetched only when a cluster accordion is expanded.
- **Cache dataset list views**: 15-minute `cache_page` on tabular, raster, vector, and pmtiles list endpoints.
- **Single dataset endpoint**: `GET /api/v1/datasets/?cluster=<name>` returns all dataset types in one response.
- **Higher page size**: `DatasetListPagination` (100/page, max 500) for dataset list views.

---

### CSV Import (Admin)

- **Multi-select files**: *Before*: One file per row; users had to click "Add another file" repeatedly. *After*: Single "Select CSV files..." button allows multiple selection at once. *Why*: Faster workflow when importing many files.
- **Auto-match dataset**: *Before*: User picked a dataset manually for every file. *After*: Dataset suggested from filename (e.g. `Education_01_baseline.csv` → "Education 01 baseline"). *Why*: Filenames and dataset names are similar; auto-match reduces manual selection.
- **Upload progress modal**: *Before*: No feedback during upload; users did not know if import was still running. *After*: Progress popup shows percentage and bytes during POST. *Why*: Clear feedback when uploading many large CSVs.
- **Backend format**: *Before*: Django formset (`form-0-file`, `form-0-dataset`, …). *After*: Simple format (`file_0`, `dataset_0`, …) posted via AJAX. *Why*: Simpler handling and better fit for dynamic multi-file selection.

### Admin (Tabular Items)

- **Year column**: *Before*: No year shown in the tabular items list. *After*: Year column added from `date` field. *Why*: Year is often needed for filtering and review.
- **Filters**: *Before*: Limited filters (dataset, province, area council). *After*: Added filters for Cluster, Dataset, Year, Province, Area Council, Attribute. *Why*: Easier to find and filter large tabular datasets.
- **Year filter**: *Before*: Using `date__year` in `list_filter` caused `admin.E116` SystemCheckError and crashed the server. *After*: Custom `YearListFilter` (SimpleListFilter). *Why*: `date__year` is a lookup, not a field; custom filter is required.
- **Bulk delete**: *Before*: `DATA_UPLOAD_MAX_NUMBER_FIELDS` default (1000) caused `TooManyFieldsSent` when selecting many items. *After*: Set to 50000. *Why*: Allows bulk delete of many tabular items at once.
- **Admin URL**: *Before*: Visiting `/admin` (no trailing slash) returned 404 because `APPEND_SLASH=False`. *After*: Redirect from `/admin` to `/admin/`. *Why*: Both URLs work regardless of slash.

### VM Deployment

- **Deployment guide**: *Before*: No documented VM migration path. *After*: `docs/DEPLOYMENT_VM.md` with steps for Docker install, transfer, env config, build, and run. *Why*: Clear path to deploy on self-hosted VMs.
- **Vm config**: *Before*: Production config required S3; Local config was for dev only. *After*: `vbos/config/vm.py` for self-hosted use (local storage, relaxed CORS). *Why*: Deploy without S3 on internal VMs.
- **Docker Compose**: *Before*: Only backend dev compose; production used external images. *After*: `deploy/vm/docker-compose.yml` with postgres, web, titiler, nginx. *Why*: Self-contained stack for VM deployment.
- **Titiler optional**: *Before*: Titiler required; deployment failed when `ghcr.io` unreachable (firewall, no internet). *After*: Titiler in `raster` profile; omit with `docker compose up -d` (no profile). *Why*: Deploy tabular/vector without raster when network is restricted.
- **Docker install**: *Before*: `chmod a644` failed on some systems; "no installation candidate" after adding repo. *After*: Use `gpg --dearmor`, `chmod 644`, and correct repo setup. *Why*: Docker installs reliably on Ubuntu.
- **Nginx port**: *Before*: Nginx on port 80 conflicted with existing system nginx. *After*: App nginx on port 8080. *Why*: Run alongside existing web server.
- **Source volume**: *Before*: `vbos-backend` mounted into container; slow I/O on every request. *After*: Code baked into image; only static/media volumes. *Why*: Better production performance.

### Bug Fixes

- **Frontend build (getDatasets.ts)**: *Before*: `TS2322` on `pnpm build` – `Record<string, unknown>[]` not assignable to `Dataset[]`. *After*: Type assertion `as Dataset[]` on mapped array. *Why*: Frontend builds on VM for deployment.

---

### Documentation & Onboarding

- **CONTRIBUTING.md**: Setup instructions, code conventions, pull request process.
- **Architecture diagram**: Mermaid diagram in README showing SPA, API, DB, TiTiler, PMTiles, and S3.
- **Environment templates**: `.env.example` with commented placeholders for all backend and frontend variables (Django, Postgres, AWS/S3, cache, API).
- **Changelog**: `CHANGELOG.md` maintained for releases and notable changes.

---

### Backend

#### API Response Caching
- **Caching for reference data endpoints**: `ClusterListView`, `ProvinceListView`, and `AreaCouncilListView` now use 15-minute response caching (`cache_page`) to reduce load on frequently accessed data.
- **Cache invalidation on cluster changes**: When Cluster is saved or deleted in admin, cache is cleared so the frontend shows changes immediately.
- **`clear_cache` management command**: Run `python manage.py clear_cache` to manually clear cache after admin changes.
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
- **Left sidebar lazy-loading** (see Left Sidebar Performance below): Cluster dataset fetches only when expanded.
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

#### Modern Features

- **Dark mode**: `ColorModeProvider` via next-themes for system preference; UI uses semantic tokens (`bg.panel`, `bg.subtle`, `bg`). Manual toggle removed.
- **Export to PDF**: "Export PDF" button in header; captures map canvas and stats section (chart/table) via jspdf + html2canvas; downloads `disaster-risk-report-YYYY-MM-DD.pdf`.
- **Shareable URLs**: Map view state (`lng`, `lat`, `zoom`) synced to URL; share links restore layers, province, area council, year, and map position. `syncToUrl` on map move-end; `syncFromUrl` on mount and popstate.
- **Mobile layout**: Map-first on tablets/phones; sidebars default to collapsed on viewports &lt; 768px; collapsible panels overlay the map (position absolute) with slide-out; grid `0 1fr 0` on base so map gets full width.

#### Mobile UX Refinements

- **Floating action button (FAB)**: On mobile/tablet, header actions (Help, Share, Export PDF, Admin, Logout) move to a bottom-right FAB; tap to open popover menu.
- **Header**: System name shortens to "DRMIS" on small screens; full name on desktop.
- **Panel management**: Only one panel (Data Layers or Analysis) open at a time on mobile; tap outside (map) to close; close (X) button in panel header; toggle at top when closed, side toggle preserved on desktop.
- **Z-index fixes**: FAB (9999), panels (1000), toggles (1001) so controls stay above map.

---

## Setup Notes (for new deployments)

- **Backend `.env`**: Copy `.env.example` to `.env`; set `DJANGO_SECRET_KEY` and other vars.
- **Frontend `.env.local`**: `VITE_API_HOST=http://localhost:8000`, `VITE_TITILER_API=http://localhost:8002` (or your API base URLs).
- **Admin user**: `docker-compose exec web ./manage.py createsuperuser`
- **Change admin password**: `docker-compose exec web ./manage.py changepassword <username>`
