variable "aws_region" {
  description = "The AWS region where resources will be provisioned"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "devops-production"
}

variable "key_name" {
  description = "Name of existing AWS key pair (or leave empty to generate a project key pair)"
  type        = string
  default     = ""
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed to access SSH (Port 22)"
  type        = string
  default     = "0.0.0.0/0"
}

