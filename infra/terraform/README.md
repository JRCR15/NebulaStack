# NebulaStack Terraform

Provisions AWS foundation for Delivery 4: VPC, RDS Postgres, ElastiCache Redis, SQS broker, ECR, ECS service skeleton, Lambda FaaS.

## Secrets (never commit)

```bash
export TF_VAR_db_password='use-a-strong-password'
export TF_VAR_jwt_secret='use-a-long-random-secret'
# optional: export AWS_PROFILE=nebulastack
terraform init
terraform plan -var-file=env/staging.tfvars
terraform apply -var-file=env/staging.tfvars
```

Copy `env/staging.tfvars.example` → `env/staging.tfvars` (gitignored via `*.tfvars`).

Prefer AWS Secrets Manager / SSM for long-lived environments; variables above are for classroom applies.

## Immutable artifacts

Build and push images tagged with git SHA:

```bash
SHA=$(git rev-parse --short HEAD)
docker build -t <account>.dkr.ecr.<region>.amazonaws.com/nebulastack-scheduling:$SHA services/scheduling-engine
```

Pass `image_tag = SHA` into Terraform / ECS task definitions.
