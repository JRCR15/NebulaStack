output "vpc_id" {
  value = module.network.vpc_id
}

output "ecr_repository_urls" {
  value = module.ecr.repository_urls
}

output "payment_queue_url" {
  value = module.broker.payment_hold_queue_url
}

output "notification_queue_url" {
  value = module.broker.notification_queue_url
}

output "rds_endpoint" {
  value     = try(module.data_postgres[0].endpoint, null)
  sensitive = true
}

output "redis_endpoint" {
  value = module.data_redis.primary_endpoint
}

output "jwt_secret_configured" {
  value       = length(var.jwt_secret) > 0
  description = "True when TF_VAR_jwt_secret was provided (value never outputted)"
}
