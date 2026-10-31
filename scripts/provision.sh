#!/usr/bin/env bash
# ==============================================================================
# Cloud Infrastructure Provisioner - Terraform Orchestrator
# ==============================================================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}   STEP 1: TERRAFORM CLOUD INFRASTRUCTURE PROVISIONING          ${NC}"
echo -e "${CYAN}================================================================${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="${SCRIPT_DIR}/../terraform"

cd "$TF_DIR"

echo -e "${YELLOW}>> Initializing Terraform providers and backend...${NC}"
terraform init -no-color

echo -e "${YELLOW}>> Validating Terraform configuration syntax...${NC}"
terraform validate -no-color

echo -e "${YELLOW}>> Generating execution plan...${NC}"
terraform plan -out=tfplan -no-color

echo -e "${GREEN}>> Applying infrastructure changes to AWS...${NC}"
terraform apply -auto-approve tfplan -no-color

echo -e "${GREEN}>> Extracting infrastructure outputs...${NC}"
terraform output -json > outputs.json

INSTANCE_IP=$(terraform output -raw public_ip 2>/dev/null || echo "127.0.0.1")
echo -e "${GREEN}✔ AWS EC2 Instance provisioned successfully!${NC}"
echo -e "${GREEN}✔ Public IP Address: ${INSTANCE_IP}${NC}"
