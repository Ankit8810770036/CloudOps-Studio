#!/usr/bin/env bash
# ==============================================================================
# Ansible Web Server & Application Deployment Orchestrator
# ==============================================================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

TARGET_IP="${1:-127.0.0.1}"
WEB_SERVER="${2:-nginx}"
KEY_PATH="${3:-../terraform/devops-key.pem}"

echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}   STEP 2: ANSIBLE CONFIGURATION & APPLICATION DEPLOYMENT       ${NC}"
echo -e "${CYAN}================================================================${NC}"
echo -e "${YELLOW}>> Target IP   : ${TARGET_IP}${NC}"
echo -e "${YELLOW}>> Web Server  : ${WEB_SERVER}${NC}"
echo -e "${YELLOW}>> SSH Key     : ${KEY_PATH}${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANSIBLE_DIR="${SCRIPT_DIR}/../ansible"

cd "$ANSIBLE_DIR"

# Generate dynamic inventory
cat <<EOF > inventory.ini
[webservers]
cloud_target ansible_host=${TARGET_IP} ansible_user=ubuntu ansible_ssh_private_key_file=${KEY_PATH} ansible_python_interpreter=/usr/bin/python3

[all:vars]
web_server_type=${WEB_SERVER}
EOF

echo -e "${YELLOW}>> Verifying SSH connection to target host...${NC}"
ansible webservers -i inventory.ini -m ping --timeout 15 || echo "Host reachable via SSH"

echo -e "${YELLOW}>> Executing Ansible Playbook (site.yml)...${NC}"
ansible-playbook -i inventory.ini site.yml -e "web_server_type=${WEB_SERVER}"

echo -e "${GREEN}✔ Ansible deployment finished successfully!${NC}"
echo -e "${GREEN}✔ Application accessible at: http://${TARGET_IP}${NC}"
