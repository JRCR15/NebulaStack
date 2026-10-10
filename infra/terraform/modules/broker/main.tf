variable "project_name" { type = string }
variable "environment" { type = string }

resource "aws_sqs_queue" "payment_dlq" {
  name = "${var.project_name}-${var.environment}-payment-hold-dlq"
}

resource "aws_sqs_queue" "payment_hold" {
  name                       = "${var.project_name}-${var.environment}-payment-hold"
  visibility_timeout_seconds = 60
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.payment_dlq.arn
    maxReceiveCount     = 5
  })
}

resource "aws_sqs_queue" "notification_dlq" {
  name = "${var.project_name}-${var.environment}-notification-dlq"
}

resource "aws_sqs_queue" "notification" {
  name                       = "${var.project_name}-${var.environment}-notification"
  visibility_timeout_seconds = 60
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.notification_dlq.arn
    maxReceiveCount     = 5
  })
}

output "payment_hold_queue_url" { value = aws_sqs_queue.payment_hold.url }
output "payment_hold_queue_arn" { value = aws_sqs_queue.payment_hold.arn }
output "notification_queue_url" { value = aws_sqs_queue.notification.url }
output "notification_queue_arn" { value = aws_sqs_queue.notification.arn }
