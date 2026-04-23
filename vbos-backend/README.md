# vbos-backend

[![Docker](https://github.com/developmentseed/vbos-backend/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/developmentseed/vbos-backend/actions/workflows/docker-publish.yml)
[![Built with](https://img.shields.io/badge/Built_with-Cookiecutter_Django_Rest-F7B633.svg)](https://github.com/agconti/cookiecutter-django-rest)

VBOS Django application and data services. Check out the project's [documentation](http://developmentseed.github.io/vbos-backend/).

# Prerequisites

- [Docker Engine](https://docs.docker.com/engine/install)
- [Docker Compose](https://docs.docker.com/compose/install)

# Local Development

Start the dev server for local development:

```bash
cd deploy/
docker compose up
```

Run a command inside the docker container:

```bash
docker compose run --rm web [command]
```

# Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. For local development, the defaults in `.env` are sufficient. `DJANGO_SECRET_KEY` is set; AWS variables can stay empty (files are stored locally in `./media/`).

3. For production deployment with DigitalOcean Spaces (S3-compatible storage), fill in the AWS variables in `.env` with your Space's access credentials.
