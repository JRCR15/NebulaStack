variable "project_name" { type = string }
variable "environment" { type = string }
variable "subnet_ids" { type = list(string) }
variable "vpc_id" { type = string }
variable "db_username" { type = string }
variable "db_password" {
  type      = string
  sensitive = true
}

resource "aws_db_subnet_group" "this" {
  name       = "${var.project_name}-${var.environment}-pg"
  subnet_ids = var.subnet_ids
}

resource "aws_security_group" "pg" {
  name   = "${var.project_name}-${var.environment}-pg"
  vpc_id = var.vpc_id
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "this" {
  identifier                 = "${var.project_name}-${var.environment}"
  engine                     = "postgres"
  engine_version             = "15"
  instance_class             = "db.t4g.micro"
  allocated_storage          = 20
  db_name                    = "nebulastack"
  username                   = var.db_username
  password                   = var.db_password
  db_subnet_group_name       = aws_db_subnet_group.this.name
  vpc_security_group_ids     = [aws_security_group.pg.id]
  skip_final_snapshot        = true
  publicly_accessible        = false
  backup_retention_period    = 1
  deletion_protection        = false
  # Password must come from TF_VAR_db_password / Secrets Manager — never hardcoded.
}

output "endpoint" { value = aws_db_instance.this.address }
