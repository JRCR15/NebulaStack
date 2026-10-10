provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "NebulaStack"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
