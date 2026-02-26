# VM Server Deployment Guide

This guide covers migrating the Disaster Project MIS (VBoS) to your VM server (e.g. `vbosadmin@10.252.0.158`).

## Prerequisites on the VM

- Ubuntu 24.04 LTS (or similar)
- Docker Engine
- Docker Compose v2
- Git

## 1. Prepare the VM

### Install Docker (if not already installed)

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl

# Add Docker's GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod 644 /etc/apt/keyrings/docker.gpg

# Add Docker repository (Ubuntu 24.04 = noble)
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Important: update apt cache before installing
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

If you get "no installation candidate", remove conflicting packages first:
```bash
sudo apt-get remove -y docker.io docker-doc podman-docker 2>/dev/null || true
sudo apt-get update
# Then retry the install
```

### Add your user to the docker group

```bash
sudo usermod -aG docker $USER
# Log out and back in for the group change to take effect
```

## 2. Transfer the Project to the VM

### Option A: Clone from Git (if using a repo)

```bash
ssh vbosadmin@10.252.0.158
cd ~
git clone <YOUR_REPO_URL> disaster-project-mis
cd disaster-project-mis
```

### Option B: Copy from your local machine with rsync

From your **local** machine (where the project lives):

```bash
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'media' \
  "/home/htevilili/Documents/Work/Disaster Project/disaster-project-mis/" \
  vbosadmin@10.252.0.158:~/disaster-project-mis/
```

Then on the VM:

```bash
ssh vbosadmin@10.252.0.158
cd ~/disaster-project-mis
```

## 3. Configure Environment

### Backend (.env)

```bash
cd ~/disaster-project-mis/vbos-backend
cp .env.example .env
```

Edit `.env` and set at minimum:

```bash
# Required – use a strong random string in production
DJANGO_SECRET_KEY="your-very-long-random-secret-key-here"

# Disable debug in production
DJANGO_DEBUG=false

# Database (default works with docker-compose)
DJANGO_DB_URL="postgis://postgres:postgres@postgres:5432/vbos"
```

Generate a secret key:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

### Frontend (for build)

Create `vbos-frontend/.env.production.local` with your VM's URL.

**If using the VM docker-compose** (nginx on port 80, API proxied):

```bash
cd ~/disaster-project-mis/vbos-frontend

# Replace 10.252.0.158 with your VM IP or hostname
# API goes through nginx (port 80), Titiler stays on 8002
echo 'VITE_API_HOST=http://10.252.0.158' > .env.production.local
echo 'VITE_TITILER_API=http://10.252.0.158:8002' >> .env.production.local
```

**If using backend-only** (no nginx, direct ports):

```bash
echo 'VITE_API_HOST=http://10.252.0.158:8000' > .env.production.local
echo 'VITE_TITILER_API=http://10.252.0.158:8002' >> .env.production.local
```

## 4. Build and Run

### Option A: Full stack with nginx (recommended)

This serves the app on port 80 and proxies API/admin to the backend.

1. **Create `.env`** in the project root (for docker-compose):

```bash
cd ~/disaster-project-mis
cp vbos-backend/.env.example vbos-backend/.env
# Edit vbos-backend/.env: set DJANGO_SECRET_KEY, DJANGO_DEBUG=false
```

2. **Build the frontend** (required before starting nginx):

```bash
# Install Node 20+ and pnpm if needed
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pnpm

cd ~/disaster-project-mis/vbos-frontend
pnpm install
# Create .env.production.local (see above) first
pnpm build
```

3. **Start all services**:

```bash
cd ~/disaster-project-mis
export DJANGO_SECRET_KEY="your-secret-key"
export DJANGO_VM_HOST="http://10.252.0.158"  # optional, default used
docker compose -f deploy/vm/docker-compose.yml up -d
```

Access at **http://10.252.0.158** (port 80).

### Option B: Backend only (dev-style)

```bash
cd ~/disaster-project-mis/vbos-backend
cp .env.example .env
# Edit .env
docker compose up -d
```

Then build and serve frontend separately:

```bash
cd ~/disaster-project-mis/vbos-frontend
pnpm install && pnpm build
npx serve dist -l 5173
# App at http://10.252.0.158:5173, API at :8000, Titiler at :8002
```

## 5. Create a Django Superuser

**Option A (VM compose):**

```bash
cd ~/disaster-project-mis
docker compose -f deploy/vm/docker-compose.yml exec web ./manage.py createsuperuser
```

**Option B (backend compose):**

```bash
cd ~/disaster-project-mis/vbos-backend
docker compose exec web ./manage.py createsuperuser
```

## 6. Verify Deployment

**Option A (nginx):** App + API at http://10.252.0.158, Titiler at :8002  
**Option B:** API at :8000, Frontend at :5173, Titiler at :8002

## Ports Summary

| Service   | Port | Description                    |
|----------|------|--------------------------------|
| Nginx    | 80   | App + API proxy (Option A)     |
| Django   | 8000 | API + Admin                    |
| Titiler  | 8002 | Raster tile service            |
| Postgres | 5432 | Database (internal to Docker)  |

## Troubleshooting

### "Connection refused" on admin or API

- Ensure the web container is running: `docker compose ps`
- Check logs: `docker compose logs web`
- Confirm firewall allows 8000, 8002, 5173 (if used)

### Database connection errors

- Wait for Postgres to be ready before starting web
- Verify `.env` has correct `DJANGO_DB_URL`

### Frontend shows blank or API errors

- Confirm `VITE_API_HOST` and `VITE_TITILER_API` match your VM URL
- Rebuild frontend after changing env: `pnpm build`
- Check browser console for CORS or network errors

### Bulk delete fails in admin

`DATA_UPLOAD_MAX_NUMBER_FIELDS` is set to 50000. If you need more, increase it in `vbos/config/common.py`.
