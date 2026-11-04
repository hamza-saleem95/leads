# AI LEAD FINDER — PRODUCTION DEPLOYMENT GUIDE

This document provides complete instructions for deploying the **AI Lead Finder** platform on a Linux VPS (Ubuntu 22.04 / Debian 12 / AWS EC2 / DigitalOcean Droplet / Hetzner).

---

## 1. Prerequisites

- A Linux VPS with at least 2 vCPUs and 4GB RAM (8GB recommended for concurrent browser/extraction workers).
- Docker (v24+) and Docker Compose (v2+).
- A domain name pointing to your VPS IP (e.g. `leads.yourcompany.com`).

Install Docker on Ubuntu:
```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

---

## 2. Clone Repository & Setup Environment

```bash
git clone https://github.com/your-org/ai-lead-finder.git /opt/ai-lead-finder
cd /opt/ai-lead-finder

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

Ensure the following variables are populated in `.env`:
- `JWT_SECRET` (generate using `openssl rand -hex 32`)
- `POSTGRES_PASSWORD` (strong database password)
- `OPENAI_API_KEY`
- Provider keys (`TAVILY_API_KEY`, `SERPAPI_API_KEY`, `GOOGLE_PLACES_API_KEY`, `BING_API_KEY`)

---

## 3. Database Initialization & Migration

When starting for the first time, apply Prisma migrations to the PostgreSQL container:

```bash
# Start database & redis first
docker compose up -d postgres redis

# Run Prisma migrations
docker compose run --rm backend npx prisma migrate deploy

# (Optional) Seed initial administrator and sample datasets
docker compose run --rm backend npm run prisma:seed
```

---

## 4. Launch Production Stack

```bash
# Build and start all services (postgres, redis, backend, frontend, nginx)
docker compose up -d --build

# Verify all containers are healthy
docker compose ps
```

Services will be running on:
- Nginx reverse proxy: `http://<your-server-ip>:80`
- Backend API: `http://<your-server-ip>:5000`
- Health check: `http://<your-server-ip>/health`

---

## 5. SSL / HTTPS Configuration with Certbot

To secure the platform with Let's Encrypt SSL certificates:

```bash
# 1. Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 2. Stop docker nginx temporarily
docker compose stop nginx

# 3. Obtain certificate
sudo certbot certonly --standalone -d leads.yourcompany.com

# 4. Map SSL certs into docker/nginx.conf and restart
docker compose up -d nginx
```

Example HTTPS Nginx block to add to `docker/nginx.conf`:
```nginx
server {
    listen 443 ssl http2;
    server_name leads.yourcompany.com;

    ssl_certificate /etc/letsencrypt/live/leads.yourcompany.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/leads.yourcompany.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Include existing location blocks for /api/, /events/, and /
}
```

---

## 6. Backup & Restore Procedures

### Database Backup (Automated Cron Job)

Create a backup script at `/usr/local/bin/backup-leads-db.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/ai_lead_finder"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/ai_lead_finder_$TIMESTAMP.sql.gz"

docker compose -f /opt/ai-lead-finder/docker-compose.yml exec -T postgres pg_dump -U postgres ai_lead_finder | gzip > "$FILENAME"

# Retain last 14 days of backups
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +14 -exec rm {} \;
```

Make executable and add to crontab:
```bash
chmod +x /usr/local/bin/backup-leads-db.sh
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/backup-leads-db.sh") | crontab -
```

### Database Restore

```bash
gunzip < /var/backups/ai_lead_finder/ai_lead_finder_20261104.sql.gz | docker compose exec -T postgres psql -U postgres -d ai_lead_finder
```

---

## 7. Monitoring & Log Inspection

```bash
# View backend logs in real time
docker compose logs -f backend

# View discovery worker jobs
docker compose logs -f redis

# Check application health
curl http://localhost/health
```
