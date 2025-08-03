#!/bin/bash

# Yeti DEX Environment Variables Setup Script
# This script helps you set up environment variables for different deployment scenarios

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to create local .env file
setup_local_env() {
    print_header "Setting up Local Environment"
    
    if [ -f ".env" ]; then
        print_warning ".env file already exists. Creating backup..."
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    fi
    
    # Copy template
    cp env.docker.example .env
    
    print_success "Created .env file from template"
    echo -e "${YELLOW}Please edit .env file with your actual values:${NC}"
    echo "1. Get Privy credentials from: https://dashboard.privy.io"
    echo "2. Get 1inch API key from: https://portal.1inch.dev/"
    echo "3. Update RPC_URL if needed"
    echo "4. Review all URLs and addresses"
    echo
    echo -e "${BLUE}To edit: nano .env${NC}"
}

# Function to display Railway setup instructions
setup_railway() {
    print_header "Railway Deployment Setup"
    
    echo "1. Go to https://railway.app and connect your GitHub repo"
    echo "2. Add these environment variables in Railway dashboard:"
    echo
    echo -e "${BLUE}Basic Configuration:${NC}"
    echo "NODE_ENV=production"
    echo "PORT=3000"
    echo "ORDERBOOK_PORT=3002"
    echo
    echo -e "${BLUE}Authentication (get from https://dashboard.privy.io):${NC}"
    echo "NEXT_PUBLIC_PRIVY_APP_ID=your_app_id"
    echo "NEXT_PUBLIC_PRIVY_CLIENT_ID=your_client_id"
    echo
    echo -e "${BLUE}API Keys (get from https://portal.1inch.dev/):${NC}"
    echo "1INCH_API_KEY=your_api_key"
    echo
    echo -e "${BLUE}After first deployment, update these URLs:${NC}"
    echo "NEXT_PUBLIC_WEBHOOK_SERVER_URL=https://your-app.railway.app/webhook"
    echo "NEXT_PUBLIC_ORDERBOOK_SERVER_URL=https://your-app.railway.app/api/orderbook"
    echo "CORS_ORIGIN=https://your-app.railway.app"
    echo
    echo -e "${BLUE}Blockchain Configuration:${NC}"
    echo "RPC_URL=https://mainnet.base.org"
    echo "WEBHOOK_ORACLE_ADDRESS=0x65bec6934b24390F9195C5bCF8A59fa008964722"
    echo "WEBHOOK_PREDICATE_ADDRESS=0x3410e3dBef8bc2e5eB7a8e983926B971831177f7"
}

# Function to display Google Cloud Run setup
setup_gcp() {
    print_header "Google Cloud Run Setup"
    
    echo "1. Build and push your image:"
    echo "   gcloud builds submit --tag gcr.io/PROJECT_ID/yeti-dex"
    echo
    echo "2. Deploy with environment variables:"
    echo
    cat << 'EOF'
gcloud run deploy yeti-dex \
  --image gcr.io/PROJECT_ID/yeti-dex \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars="NODE_ENV=production" \
  --set-env-vars="PORT=3000" \
  --set-env-vars="ORDERBOOK_PORT=3002" \
  --set-env-vars="NEXT_PUBLIC_PRIVY_APP_ID=your_app_id" \
  --set-env-vars="NEXT_PUBLIC_PRIVY_CLIENT_ID=your_client_id" \
  --set-env-vars="1INCH_API_KEY=your_api_key" \
  --set-env-vars="RPC_URL=https://mainnet.base.org"
EOF
    echo
    echo "Replace PROJECT_ID and credential values with your actual values."
}

# Function to display DigitalOcean setup
setup_digitalocean() {
    print_header "DigitalOcean App Platform Setup"
    
    echo "Create an app.yaml file with your environment variables:"
    echo
    cat << 'EOF'
name: yeti-dex
services:
- name: web
  source_dir: /
  github:
    repo: your-username/your-repo
    branch: main
  dockerfile_path: Dockerfile
  http_port: 3000
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: PORT
    value: "3000"
  - key: ORDERBOOK_PORT
    value: "3002"
  - key: NEXT_PUBLIC_PRIVY_APP_ID
    value: your_app_id
  - key: NEXT_PUBLIC_PRIVY_CLIENT_ID
    value: your_client_id
  - key: 1INCH_API_KEY
    value: your_api_key
    type: SECRET
  - key: RPC_URL
    value: https://mainnet.base.org
EOF
}

# Function to validate required tools
check_requirements() {
    print_header "Checking Requirements"
    
    # Check if template exists
    if [ ! -f "env.docker.example" ]; then
        print_error "env.docker.example file not found!"
        exit 1
    fi
    
    print_success "Environment template found"
}

# Function to show environment variables checklist
show_checklist() {
    print_header "Environment Variables Checklist"
    
    echo -e "${BLUE}Required Variables:${NC}"
    echo "□ NEXT_PUBLIC_PRIVY_APP_ID (from dashboard.privy.io)"
    echo "□ NEXT_PUBLIC_PRIVY_CLIENT_ID (from dashboard.privy.io)"
    echo "□ 1INCH_API_KEY (from portal.1inch.dev)"
    echo "□ RPC_URL (blockchain endpoint)"
    echo
    echo -e "${BLUE}Production URLs (update after first deployment):${NC}"
    echo "□ NEXT_PUBLIC_WEBHOOK_SERVER_URL"
    echo "□ NEXT_PUBLIC_ORDERBOOK_SERVER_URL"
    echo "□ CORS_ORIGIN"
    echo
    echo -e "${BLUE}Optional but Recommended:${NC}"
    echo "□ NODE_ENV=production"
    echo "□ Database persistence configuration"
    echo "□ Monitoring and alerting setup"
}

# Main menu
show_menu() {
    print_header "Yeti DEX Environment Setup"
    echo "Choose your deployment target:"
    echo "1) Local development (.env file)"
    echo "2) Railway deployment"
    echo "3) Google Cloud Run"
    echo "4) DigitalOcean App Platform"
    echo "5) Show environment variables checklist"
    echo "6) View documentation"
    echo "7) Exit"
    echo
}

# Handle menu selection
handle_choice() {
    case $1 in
        1)
            setup_local_env
            ;;
        2)
            setup_railway
            ;;
        3)
            setup_gcp
            ;;
        4)
            setup_digitalocean
            ;;
        5)
            show_checklist
            ;;
        6)
            echo "Opening environment setup documentation..."
            if command -v xdg-open &> /dev/null; then
                xdg-open ENV_SETUP.md
            elif command -v open &> /dev/null; then
                open ENV_SETUP.md
            else
                echo "Please read ENV_SETUP.md for detailed instructions"
            fi
            ;;
        7)
            print_success "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid option. Please choose 1-7."
            ;;
    esac
}

# Main execution
main() {
    check_requirements
    
    # If argument provided, run directly
    if [ $# -eq 1 ]; then
        handle_choice $1
        exit 0
    fi
    
    # Interactive mode
    while true; do
        show_menu
        read -p "Enter your choice (1-7): " choice
        echo
        handle_choice $choice
        echo
        read -p "Press Enter to continue..."
        clear
    done
}

# Run the script
main "$@" 