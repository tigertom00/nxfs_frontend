#!/bin/bash

# SSL Certificate Generation Script
# This script helps generate self-signed SSL certificates for development
# For production, use Let's Encrypt or purchase proper SSL certificates

set -e

# Configuration
DOMAIN="localhost"
COUNTRY="NO"
STATE="Oslo"
LOCALITY="Oslo"
ORGANIZATION="nxfs"
ORGANIZATIONAL_UNIT="IT"
EMAIL="admin@nxfs.no"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔐 Generating SSL certificates for $DOMAIN...${NC}"

# Create ssl directory if it doesn't exist
mkdir -p ssl

# Generate private key
echo -e "${YELLOW}🔑 Generating private key...${NC}"
openssl genrsa -out ssl/key.pem 2048

# Generate certificate signing request (CSR)
echo -e "${YELLOW}📋 Generating certificate signing request...${NC}"
openssl req -new -key ssl/key.pem -out ssl/csr.pem -subj "/C=$COUNTRY/ST=$STATE/L=$LOCALITY/O=$ORGANIZATION/OU=$ORGANIZATIONAL_UNIT/CN=$DOMAIN/emailAddress=$EMAIL"

# Generate self-signed certificate
echo -e "${YELLOW}📜 Generating self-signed certificate...${NC}"
openssl x509 -req -in ssl/csr.pem -signkey ssl/key.pem -out ssl/cert.pem -days 365

# Generate DH parameters for better security
echo -e "${YELLOW}🔒 Generating DH parameters...${NC}"
openssl dhparam -out ssl/dhparam.pem 2048

# Clean up CSR
rm ssl/csr.pem

echo -e "${GREEN}✅ SSL certificates generated successfully!${NC}"
echo -e "${GREEN}📁 Files created in ./ssl/${NC}"
echo "  - key.pem (private key)"
echo "  - cert.pem (certificate)"
echo "  - dhparam.pem (DH parameters)"

echo -e "${YELLOW}⚠️  Note: These are self-signed certificates for development only.${NC}"
echo -e "${YELLOW}   For production, use Let's Encrypt or purchase proper certificates.${NC}"