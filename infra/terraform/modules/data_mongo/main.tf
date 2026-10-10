variable "project_name" { type = string }
variable "environment" { type = string }

# Placeholder module: DocumentDB incurs cost. Local MVP uses Compose Mongo.
# Wire aws_docdb_cluster here when cloud demo budget allows.

output "note" {
  value = "Use local Mongo via Compose for D4 MVP; DocumentDB optional stretch."
}
