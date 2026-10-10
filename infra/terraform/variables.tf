variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "staging"
}

variable "project_name" {
  type    = string
  default = "nebulastack"
}

variable "vpc_cidr" {
  type    = string
  default = "10.20.0.0/16"
}

variable "db_username" {
  type    = string
  default = "nebulastack"
}

variable "db_password" {
  type        = string
  sensitive   = true
  default     = ""
  description = "Inject via TF_VAR_db_password — never commit. Required when enable_rds=true."
}

variable "jwt_secret" {
  type        = string
  sensitive   = true
  default     = ""
  description = "Inject via TF_VAR_jwt_secret — never commit"
}

variable "image_tag" {
  type        = string
  default     = "latest"
  description = "Immutable git SHA preferred"
}

variable "enable_rds" {
  type    = bool
  default = true
}
