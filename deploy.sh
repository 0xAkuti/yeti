#!/bin/bash

# Yeti DEX Docker Deployment Script
# This script provides multiple deployment options for the Yeti DEX project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
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

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_success "Docker is installed"
}

# Check if docker-compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    print_success "Docker Compose is available"
}

# Build the Docker image
build_image() {
    print_header "Building Docker Image"
    
    echo "Building yeti-dex Docker image..."
    docker build -t yeti-dex . || {
        print_error "Docker build failed"
        exit 1
    }
    
    print_success "Docker image built successfully"
}

# Local deployment with docker-compose
deploy_local() {
    print_header "Local Deployment"
    
    check_docker_compose
    
    echo "Starting services with docker-compose..."
    docker-compose down 2>/dev/null || true
    docker-compose up --build -d || {
        print_error "Docker compose deployment failed"
        exit 1
    }
    
    print_success "Local deployment completed"
    echo -e "${GREEN}Frontend available at: http://localhost:3000${NC}"
    echo -e "${GREEN}Orderbook API available at: http://localhost:3002${NC}"
    echo -e "${YELLOW}Use 'docker-compose logs -f' to view logs${NC}"
}

# Deploy to Railway
deploy_railway() {
    print_header "Railway Deployment"
    
    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI not found. Installing..."
        npm install -g @railway/cli || {
            print_error "Failed to install Railway CLI"
            exit 1
        }
    fi
    
    echo "Deploying to Railway..."
    railway login || {
        print_error "Railway login failed"
        exit 1
    }
    
    railway up || {
        print_error "Railway deployment failed"
        exit 1
    }
    
    print_success "Railway deployment completed"
}

# Deploy to Vercel
deploy_vercel() {
    print_header "Vercel Deployment"
    
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel || {
            print_error "Failed to install Vercel CLI"
            exit 1
        }
    fi
    
    print_warning "Note: Vercel has limited Docker support. Consider Railway instead."
    
    echo "Deploying to Vercel..."
    vercel --prod || {
        print_error "Vercel deployment failed"
        exit 1
    }
    
    print_success "Vercel deployment completed"
}

# Deploy to Google Cloud Run
deploy_gcp() {
    print_header "Google Cloud Run Deployment"
    
    if ! command -v gcloud &> /dev/null; then
        print_error "Google Cloud CLI not found. Please install it first."
        exit 1
    fi
    
    read -p "Enter your GCP Project ID: " PROJECT_ID
    if [ -z "$PROJECT_ID" ]; then
        print_error "Project ID cannot be empty"
        exit 1
    fi
    
    echo "Building and pushing to Google Container Registry..."
    gcloud builds submit --tag gcr.io/$PROJECT_ID/yeti-dex || {
        print_error "GCP build failed"
        exit 1
    }
    
    echo "Deploying to Cloud Run..."
    gcloud run deploy yeti-dex \
        --image gcr.io/$PROJECT_ID/yeti-dex \
        --platform managed \
        --region us-central1 \
        --allow-unauthenticated \
        --port 3000 || {
        print_error "Cloud Run deployment failed"
        exit 1
    }
    
    print_success "Google Cloud Run deployment completed"
}

# Test the deployment
test_deployment() {
    print_header "Testing Deployment"
    
    echo "Testing frontend connection..."
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend is responding"
    else
        print_error "Frontend is not responding"
    fi
    
    echo "Testing orderbook API..."
    if curl -f http://localhost:3002 > /dev/null 2>&1; then
        print_success "Orderbook API is responding"
    else
        print_error "Orderbook API is not responding"
    fi
}

# Main menu
show_menu() {
    print_header "Yeti DEX Deployment Script"
    echo "Choose a deployment option:"
    echo "1) Local development (docker-compose)"
    echo "2) Railway (recommended for production)"
    echo "3) Vercel (limited Docker support)"
    echo "4) Google Cloud Run"
    echo "5) Build Docker image only"
    echo "6) Test local deployment"
    echo "7) View logs (local)"
    echo "8) Stop local deployment"
    echo "9) Exit"
    echo
}

# Handle menu selection
handle_choice() {
    case $1 in
        1)
            check_docker
            deploy_local
            ;;
        2)
            check_docker
            build_image
            deploy_railway
            ;;
        3)
            check_docker
            build_image
            deploy_vercel
            ;;
        4)
            check_docker
            deploy_gcp
            ;;
        5)
            check_docker
            build_image
            ;;
        6)
            test_deployment
            ;;
        7)
            docker-compose logs -f
            ;;
        8)
            docker-compose down
            print_success "Local deployment stopped"
            ;;
        9)
            print_success "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid option. Please choose 1-9."
            ;;
    esac
}

# Main execution
main() {
    # If argument provided, run directly
    if [ $# -eq 1 ]; then
        handle_choice $1
        exit 0
    fi
    
    # Interactive mode
    while true; do
        show_menu
        read -p "Enter your choice (1-9): " choice
        echo
        handle_choice $choice
        echo
        read -p "Press Enter to continue..."
        clear
    done
}

# Run the script
main "$@" 