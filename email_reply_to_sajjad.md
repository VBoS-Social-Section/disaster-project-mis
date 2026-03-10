Subject: Re: MIS platform backend and domain name transfer

Hi Sajjad,

Thanks for your email. I wanted to clarify our current setup and timeline.

You're right about the path-based routing (/titiler, /api). I chose this approach because we're running everything on one VM with a single IP, so it was the most straightforward solution for now.

This is a temporary setup - we don't have custom domains yet because this will only run for 1-2 years until we migrate to the National Disaster Management Office (NDMO) server. When that happens, NDMO will purchase a dedicated server and proper domains.

The system is running via Docker Compose with Nginx handling the routing on port 80:
- `/api/*` → Django (internal port 8000)
- `/titiler/*` → TiTiler (internal port 8000)
- `/` → Frontend static files

I used `.env.production.local` for the frontend config to avoid Git conflicts when pulling updates.

Current access is via the VM IP (10.252.0.158):
- Main app: http://10.252.0.158/
- API docs: http://10.252.0.158/api/v1/docs/
- TiTiler docs: http://10.252.0.158/titiler/api.html

When we move to NDMO, we'll implement the subdomain architecture you recommended and set up SSL certificates.

The system is fully functional - just waiting on land cover classification maps to complete TiTiler testing.

Best,
Herman
