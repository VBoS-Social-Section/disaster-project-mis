#!/bin/bash
# Refresh DRMIS data from the RAP and shape-file repositories.
#   deploy/vm/load-data.sh              load anything not yet loaded
#   deploy/vm/load-data.sh --replace    reload every table and layer from the repositories
#   deploy/vm/load-data.sh --dry-run    check everything, change nothing
# A database dump is written to $BACKUP_DIR (default /opt/drmis-backups) before loading.
set -euo pipefail
cd "$(dirname "$0")/../.."
COMPOSE="docker compose -f deploy/vm/docker-compose.yml"
BACKUP_DIR="${BACKUP_DIR:-/opt/drmis-backups}"
RAP_REPO="${RAP_REPO:-https://github.com/VBoS-Social-Section/disaster-project-rap}"
SHAPES_REPO="${SHAPES_REPO:-https://github.com/VBoS-Social-Section/disaster-project-shape-files}"

work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
git clone -q --depth 1 "$RAP_REPO" "$work/rap"
git clone -q --depth 1 "$SHAPES_REPO" "$work/shapes"

mkdir -p "$BACKUP_DIR"
$COMPOSE exec -T postgres pg_dump -U postgres -Fc vbos > "$BACKUP_DIR/before-load-$(date +%Y%m%d-%H%M%S).dump"

web="$($COMPOSE ps -q web)"
docker exec "$web" rm -rf /tmp/drmis-load
docker exec "$web" mkdir -p /tmp/drmis-load/rap /tmp/drmis-load/shapes
docker cp "$work/rap/output" "$web:/tmp/drmis-load/rap/output"
docker cp "$work/shapes/clusters" "$web:/tmp/drmis-load/shapes/clusters"
# Run as root so the tile file can be written into the mounted media folder
docker exec -u 0 "$web" ./manage.py load_drmis_data --rap /tmp/drmis-load/rap --shapes /tmp/drmis-load/shapes "$@"
docker exec -u 0 "$web" rm -rf /tmp/drmis-load
