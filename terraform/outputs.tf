output "instance_id" {
  description = "The ID of the provisioned EC2 instance"
  value       = aws_instance.web_server.id
}

output "public_ip" {
  description = "The public IPv4 address of the EC2 instance"
  value       = aws_instance.web_server.public_ip
}

output "public_dns" {
  description = "The public DNS name of the EC2 instance"
  value       = aws_instance.web_server.public_dns
}

output "security_group_id" {
  description = "The ID of the security group"
  value       = aws_security_group.devops_sg.id
}

output "app_url" {
  description = "Public URL to access the deployed web application"
  value       = "http://${aws_instance.web_server.public_ip}"
}

output "ssh_command" {
  description = "Command to connect via SSH"
  value       = "ssh -i ${path.module}/devops-key.pem ubuntu@${aws_instance.web_server.public_ip}"
}

