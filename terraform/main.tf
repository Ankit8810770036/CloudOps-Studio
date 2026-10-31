terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# 1. Lookup Default VPC and Subnet
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# 2. Dynamic Lookup for Latest Ubuntu 22.04 LTS AMI
data "aws_ami" "ubuntu_lts" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# 3. Optional Automated SSH Key Pair Generation
resource "tls_private_key" "devops_key" {
  count     = var.key_name == "" ? 1 : 0
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "generated_key" {
  count      = var.key_name == "" ? 1 : 0
  key_name   = "devops-platform-key-${var.environment}"
  public_key = tls_private_key.devops_key[0].public_key_openssh
}

resource "local_file" "private_key_pem" {
  count           = var.key_name == "" ? 1 : 0
  content         = tls_private_key.devops_key[0].private_key_pem
  filename        = "${path.module}/devops-key.pem"
  file_permission = "0600"
}

# 4. Security Group for Web, SSH & Nagios NRPE
resource "aws_security_group" "devops_sg" {
  name        = "devops-platform-sg-${var.environment}"
  description = "Allow SSH, HTTP, HTTPS, and Nagios NRPE inbound traffic"
  vpc_id      = data.aws_vpc.default.id

  # SSH Access
  ingress {
    description = "SSH access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  # HTTP Web Application Access
  ingress {
    description = "HTTP Web traffic"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS Web Application Access
  ingress {
    description = "HTTPS Web traffic"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Nagios NRPE Monitoring Port
  ingress {
    description = "Nagios NRPE monitoring"
    from_port   = 5666
    to_port     = 5666
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound Internet Access
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "devops-platform-sg"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# 5. EC2 Instance Provisioning
resource "aws_instance" "web_server" {
  ami                         = data.aws_ami.ubuntu_lts.id
  instance_type               = var.instance_type
  subnet_id                   = element(data.aws_subnets.default.ids, 0)
  vpc_security_group_ids      = [aws_security_group.devops_sg.id]
  associate_public_ip_address = true
  key_name                    = var.key_name != "" ? var.key_name : aws_key_pair.generated_key[0].key_name

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
    tags = {
      Name = "devops-platform-root-disk"
    }
  }

  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y python3 python3-pip curl wget htop ufw
              echo "DevOps Node Initialized at $(date)" > /var/log/devops_init.log
              EOF

  tags = {
    Name        = "DevOps-Cloud-Server-${var.environment}"
    Environment = var.environment
    Role        = "Web-Monitoring-Target"
    ManagedBy   = "Terraform"
  }
}
