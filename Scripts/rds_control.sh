#!/bin/bash
# RDS Control Script for macOS/Linux
# Usage: ./rds_control.sh [start|stop|status] [db-instance-identifier]

# Get current timestamp and user info
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S")
CURRENT_USER=$(whoami)

echo "RDS Control Script"
echo "Current Date and Time (UTC): $TIMESTAMP"
echo "Current User's Login: $CURRENT_USER"
echo ""

ACTION=$1
DB_INSTANCE=$2

if [ -z "$ACTION" ] || [ -z "$DB_INSTANCE" ]; then
    echo "Usage: $0 [start|stop|status] [db-instance-identifier]"
    exit 1
fi

if [ "$ACTION" = "start" ]; then
    echo "Starting RDS instance: $DB_INSTANCE"
    aws rds start-db-instance --db-instance-identifier "$DB_INSTANCE"
    echo "Start command issued. Instance will be available in a few minutes."
elif [ "$ACTION" = "stop" ]; then
    echo "Stopping RDS instance: $DB_INSTANCE"
    aws rds stop-db-instance --db-instance-identifier "$DB_INSTANCE"
    echo "Stop command issued. Instance will be stopped in a few minutes."
elif [ "$ACTION" = "status" ]; then
    STATUS=$(aws rds describe-db-instances --db-instance-identifier "$DB_INSTANCE" --query 'DBInstances[0].DBInstanceStatus' --output text)
    echo "Current status of $DB_INSTANCE: $STATUS"
else
    echo "Invalid action. Use 'start' or 'stop'."
    exit 1
fi
