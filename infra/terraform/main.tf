module "network" {
  source       = "./modules/network"
  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr
}

module "ecr" {
  source       = "./modules/ecr"
  project_name = var.project_name
  environment  = var.environment
  repositories = [
    "api-gateway",
    "scheduling-engine",
    "payment-orchestrator",
    "notification-service",
    "external-mocks",
    "auth-tenant-service",
    "catalog-service",
  ]
}

module "broker" {
  source       = "./modules/broker"
  project_name = var.project_name
  environment  = var.environment
}

module "data_postgres" {
  source       = "./modules/data_postgres"
  count        = var.enable_rds ? 1 : 0
  project_name = var.project_name
  environment  = var.environment
  subnet_ids   = module.network.private_subnet_ids
  vpc_id       = module.network.vpc_id
  db_username  = var.db_username
  db_password  = var.db_password
}

module "data_redis" {
  source       = "./modules/data_redis"
  project_name = var.project_name
  environment  = var.environment
  subnet_ids   = module.network.private_subnet_ids
  vpc_id       = module.network.vpc_id
}

module "data_mongo" {
  source       = "./modules/data_mongo"
  project_name = var.project_name
  environment  = var.environment
}

module "lambda_payment" {
  source             = "./modules/lambda_faas"
  project_name       = var.project_name
  environment        = var.environment
  function_name      = "payment-orchestrator"
  image_tag          = var.image_tag
  ecr_repository_url = module.ecr.repository_urls["payment-orchestrator"]
  queue_arn          = module.broker.payment_hold_queue_arn
  environment_variables = {
    MOCK_GATEWAY_URL = "http://external-mocks.local"
  }
}

module "lambda_notification" {
  source             = "./modules/lambda_faas"
  project_name       = var.project_name
  environment        = var.environment
  function_name      = "notification-service"
  image_tag          = var.image_tag
  ecr_repository_url = module.ecr.repository_urls["notification-service"]
  queue_arn          = module.broker.notification_queue_arn
  environment_variables = {
    MOCK_GATEWAY_URL = "http://external-mocks.local"
  }
}

module "ecs_scheduling" {
  source         = "./modules/ecs_service"
  project_name   = var.project_name
  environment    = var.environment
  service_name   = "scheduling-engine"
  subnet_ids     = module.network.private_subnet_ids
  vpc_id         = module.network.vpc_id
  image          = "${module.ecr.repository_urls["scheduling-engine"]}:${var.image_tag}"
  container_port = 8081
}
