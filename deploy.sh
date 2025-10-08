#!/bin/bash

# Production Deployment Script for nxfs.no
# This script helps deploy the application using Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="nxfs_frontend"
APP_NAME="nxfs_frontend"
DOMAIN="https://www.nxfs.no" # Change this to your actual domain
EMAIL="nxfs.xyz@gmail.com" # Change this to your email

echo -e "${GREEN}🚀 Starting deployment of $PROJECT_NAME...${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Create necessary directories
echo -e "${YELLOW}📁 Creating necessary directories...${NC}"
mkdir -p ssl
mkdir -p public

# Copy environment file if it doesn't exist
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}📝 Creating .env.production file...${NC}"
    cp .env.production.example .env.production
    echo -e "${RED}⚠️  IMPORTANT: Edit .env.production with your actual production values!${NC}"
    echo -e "${YELLOW}   Required changes:${NC}"
    echo -e "${YELLOW}   • Set NEXT_PUBLIC_N8N_SECRET_KEY to your actual secret key${NC}"
    echo -e "${YELLOW}   • Verify API URLs are correct for production${NC}"
    echo -e "${YELLOW}   • Never commit .env.production to git (it's ignored)${NC}"
    echo ""
    echo -e "${YELLOW}   Opening .env.production for editing...${NC}"

    # Try to open with available editors
    if command -v micro &> /dev/null; then
        micro .env.production
    elif command -v nano &> /dev/null; then
        nano .env.production
    elif command -v vi &> /dev/null; then
        vi .env.production
    else
        echo -e "${RED}   No text editor found. Please edit .env.production manually.${NC}"
        read -p "   Press Enter after editing .env.production..."
    fi

    echo ""
    echo -e "${GREEN}✅ .env.production configured. Continuing with deployment...${NC}"
fi

# Build and start services
echo -e "${YELLOW}🏗️  Building and starting services...${NC}"
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Clean up dangling images
echo -e "${YELLOW}🧹 Cleaning up old Docker images...${NC}"
DANGLING_IMAGES=$(docker images -f "dangling=true" -q)
if [ -n "$DANGLING_IMAGES" ]; then
    docker rmi $DANGLING_IMAGES && echo -e "${GREEN}✅ Removed dangling images${NC}" || echo -e "${YELLOW}⚠️  Some images couldn't be removed (may be in use)${NC}"
else
    echo -e "${GREEN}✅ No dangling images to remove${NC}"
fi

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Services are running successfully!${NC}"
    
    # Show status
    echo -e "${YELLOW}📊 Service Status:${NC}"
    docker-compose ps
    
    # Show logs
    echo -e "${YELLOW}📋 Recent logs:${NC}"
    docker-compose logs --tail=20 nxfs_frontend
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${GREEN}🌐 Your application should be available at: https://www.nxfs.no${NC}"
    
    if [ "$DOMAIN" != "your-domain.com" ]; then
        echo -e "${YELLOW}🔐 For HTTPS setup, make sure to:${NC}"
        echo -e "${YELLOW}   1. Update DOMAIN and EMAIL in this script${NC}"
        echo -e "${YELLOW}   2. Place your SSL certificates in ./ssl/${NC}"
        echo -e "${YELLOW}   3. Update server_name in nginx.conf${NC}"
    fi
else
    echo -e "${RED}❌ Failed to start services. Check logs with: docker-compose logs${NC}"
    exit 1
fi

echo -e "${GREEN}📖 Useful commands:${NC}"
echo "  View logs:          docker-compose logs -f [service-name]"
echo "  Stop services:      docker-compose down"
echo "  Restart services:   docker-compose restart"
echo "  Update image:       docker-compose pull && docker-compose up -d"
echo "  Enter container:     docker-compose exec nxfs_frontend sh"