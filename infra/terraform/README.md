# NebulaStack Terraform (AWS IaC — design / classroom)

Provisions AWS foundation modules for NebulaStack: VPC/network, ECR, optional RDS, ElastiCache Redis, SQS broker, ECS service skeleton, Lambda FaaS.

## Classroom workflow (no paid apply required)

Terraform CLI is free; **running the stack on AWS is not** (NAT Gateway, RDS, ElastiCache, Fargate, Lambda+SQS traffic, etc. typically incur charges).

Recommended evidence for Delivery 4:

```powershell
cd infra\terraform
.\validate.ps1
# = terraform init -backend=false + terraform validate
```

Optional if you have AWS credentials and accept cost risk:

```powershell
$env:TF_VAR_db_password = "use-a-strong-password"
$env:TF_VAR_jwt_secret = "use-a-long-random-secret"
terraform plan -var-file=env/local.tfvars.example
```

**Do not** treat a full `terraform apply` of staging/prod as mandatory for classroom. Prefer the **local blue-green** demo: [docs/deployment-blue-green.md](../../docs/deployment-blue-green.md).

### Cost hotspots (avoid Free Tier assumptions)

| Resource | Why it costs |
|----------|----------------|
| NAT Gateway | Hourly + data processing |
| RDS / Aurora | Instance hours + storage |
| ElastiCache | Node hours |
| ECS Fargate | vCPU/memory hours |
| Lambda + SQS | Usually low, but not zero at scale |
| DocumentDB | Often expensive; module may be stub/placeholder |

Profile `env/local.tfvars.example` sets `enable_rds = false` for lighter plans.

## Blue-green on AWS (design mapping)

Local edge nginx + Compose fleets map to:

| Local | AWS design |
|-------|------------|
| `nebulastack-edge` | Application Load Balancer |
| Active color upstream | Listener default action → target group **blue** or **green** |
| `bg-deploy` / `bg-switch` | Register new ECS tasks in standby TG → flip listener / weighted forward |
| `IMAGE_TAG` git SHA | ECR tag + new task definition revision |
| Payment/notification containers | Lambda versions/aliases (or ECS) behind SQS |

Cutover sketch (not fully wired as applyable resources in every module):

1. Deploy green ECS service / scale green tasks with image `:SHA`.
2. Health-check green target group.
3. Change ALB listener rule from TG-blue → TG-green (or 100% weight).
4. Keep blue warm for rollback; drain later.

Local equivalent (run this for demos):

```powershell
.\deploy\scripts\bg-up.ps1
.\deploy\scripts\bg-deploy.ps1
.\deploy\scripts\bg-switch.ps1 -Color blue   # rollback
```

## Secrets (never commit)

```bash
export TF_VAR_db_password='use-a-strong-password'
export TF_VAR_jwt_secret='use-a-long-random-secret'
# optional: export AWS_PROFILE=nebulastack
terraform init
terraform plan -var-file=env/staging.tfvars
# terraform apply   # only with budget approval
```

Copy `env/staging.tfvars.example` → `env/staging.tfvars` (gitignored via `*.tfvars`).

Prefer AWS Secrets Manager / SSM for long-lived environments; variables above are for classroom experiments.

## Immutable artifacts

Build and push images tagged with git SHA:

```bash
SHA=$(git rev-parse --short HEAD)
docker build -t <account>.dkr.ecr.<region>.amazonaws.com/nebulastack-scheduling:$SHA services/scheduling-engine
```

Pass `image_tag = SHA` into Terraform / ECS task definitions. Local blue-green scripts export the same `IMAGE_TAG`.

## Optional: LocalStack

Not required. If used for experiments, keep it optional and never block classroom demos on it.
