# Production Deployment Guide

This guide will help you deploy your nxfs.no application to your home server using Docker.

## Prerequisites

1. **Docker and Docker Compose** installed on your server
2. **Domain name** pointing to your server (optional but recommended)
3. **SSL certificates** (can be self-signed for testing)

## Quick Start

### 1. Clone and Prepare the Repository

```bash
git clone <your-repo-url>
cd nxfs-project
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.production.example .env.production

# Edit the file with your actual values
nano .env.production
```

**Required variables:**

- `NEXT_PUBLIC_N8N_SECRET_KEY` - Your N8N webhook secret key
- `NEXT_PUBLIC_API_URL` - Your Django backend API URL
- `NEXT_PUBLIC_N8N_WEBHOOK_URL` - Your N8N webhook URL

### 3. Deploy the Application

```bash
# Make the deployment script executable
chmod +x deploy.sh

# Run the deployment
./deploy.sh
```

The script will:

- Build the Docker image
- Start all services
- Check if everything is running correctly

## Manual Deployment

If you prefer to deploy manually:

### 1. Build the Docker Image

```bash
docker-compose build
```

### 2. Start the Services

```bash
docker-compose up -d
```

### 3. Check Service Status

```bash
docker-compose ps
docker-compose logs
```

## Configuration Options

### Environment Variables

Create a `.env.production` file:

```bash
# Django Backend
NEXT_PUBLIC_API_URL=https://api.nxfs.no/api
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.nxfs.no/webhook/nxfs
NEXT_PUBLIC_N8N_SECRET_KEY=your-secret-key-here

# Next.js
NEXT_TELEMETRY_DISABLED=1
```

### Docker Compose Override

Create a `docker-compose.override.yml` for custom configurations:

```yaml
version: '3.8'

services:
  nxfs-app:
    environment:
      - NODE_ENV=production
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
```

## SSL/TLS Setup

### Option 1: Self-Signed Certificates (Development)

```bash
# Generate self-signed certificates
chmod +x generate-ssl.sh
./generate-ssl.sh
```

### Option 2: Let's Encrypt (Production)

1. Update `nginx.conf` with your domain
2. Run Certbot:

```bash
# Install certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Option 3: Custom Certificates

Place your certificates in the `./ssl/` directory:

- `ssl/cert.pem` - Certificate
- `ssl/key.pem` - Private key
- `ssl/dhparam.pem` - DH parameters (optional)

## Service Management

### Useful Commands

```bash
# View logs
docker-compose logs -f nxfs-app

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Update and restart
docker-compose pull
docker-compose up -d --force-recreate

# Enter container for debugging
docker-compose exec nxfs-app sh

# Remove all containers and volumes
docker-compose down -v
```

### Health Checks

The application includes health checks:

```bash
# Check application health
curl http://localhost:3000/api/health

# Check nginx health
curl http://localhost/health
```

## Production Considerations

### Security

1. **Firewall Configuration:**

   ```bash
   # Allow only necessary ports
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw enable
   ```

2. **SSL/TLS:**
   - Use proper SSL certificates in production
   - Configure HSTS headers
   - Enable OCSP stapling

3. **Environment Variables:**
   - Never commit secrets to version control
   - Use Docker secrets or environment files
   - Rotate secrets regularly

### Performance

1. **Caching:**
   - Redis is included in the docker-compose setup
   - Configure Next.js caching strategies
   - Use CDN for static assets

2. **Resource Limits:**
   ```yaml
   # Add to docker-compose.override.yml
   services:
     nxfs-app:
       deploy:
         resources:
           limits:
             memory: 512M
             cpus: '0.5'
   ```

### Monitoring

1. **Logs:**

   ```bash
   # View logs in real-time
   docker-compose logs -f --tail=100 nxfs-app

   # Archive logs
   docker-compose logs nxfs-app > logs/app.log
   ```

2. **Metrics:**
   - Consider adding Prometheus/Grafana for monitoring
   - Monitor resource usage and response times

## Backup Strategy

### Application Backup

```bash
# Backup the entire application
tar -czf backup-$(date +%Y%m%d).tar.gz \
  docker-compose.yml \
  nginx.conf \
  .env.production \
  ssl/
```

### Database Backup

If you're using a database:

```bash
# Backup PostgreSQL (example)
docker exec postgres_container pg_dump -U user database > backup.sql
```

## Troubleshooting

### Common Issues

1. **Port Already in Use:**

   ```bash
   # Check what's using the port
   sudo lsof -i :3000

   # Kill the process
   sudo kill -9 <PID>
   ```

2. **Permission Issues:**

   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   chmod +x deploy.sh generate-ssl.sh
   ```

3. **Container Won't Start:**

   ```bash
   # Check logs
   docker-compose logs nxfs-app

   # Check resource usage
   docker stats

   # Rebuild and restart
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Debug Mode

To run in debug mode:

```bash
# Start with debug logging
docker-compose run --rm nxfs-app npm run dev

# Or attach to running container
docker-compose exec nxfs-app sh
```

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs`
2. Verify environment variables
3. Check port availability
4. Ensure Docker and Docker Compose are up to date
5. Review this guide for configuration steps

For additional help, check the [Next.js Docker documentation](https://nextjs.org/docs/app/building-your-application/deploying#docker-image) and [Docker Compose documentation](https://docs.docker.com/compose/).
