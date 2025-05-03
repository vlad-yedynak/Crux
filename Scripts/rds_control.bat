@echo off
REM RDS Control Script for Windows
REM Usage: rds_control.bat [start|stop|status] [db-instance-identifier]

REM Get current timestamp and user info
for /f "tokens=2 delims==" %%G in ('wmic os get LocalDateTime /value') do set DATETIME=%%G
set TIMESTAMP=%DATETIME:~0,4%-%DATETIME:~4,2%-%DATETIME:~6,2% %DATETIME:~8,2%:%DATETIME:~10,2%:%DATETIME:~12,2%
set CURRENT_USER=%USERNAME%

echo RDS Control Script
echo Current Date and Time (UTC): %TIMESTAMP%
echo Current User's Login: %CURRENT_USER%
echo.

set ACTION=%1
set DB_INSTANCE=%2

if "%ACTION%"=="" goto usage
if "%DB_INSTANCE%"=="" goto usage

if "%ACTION%"=="start" (
    echo Starting RDS instance: %DB_INSTANCE%
    aws rds start-db-instance --db-instance-identifier %DB_INSTANCE%
    echo Start command issued. Instance will be available in a few minutes.
    goto end
)

if "%ACTION%"=="stop" (
    echo Stopping RDS instance: %DB_INSTANCE%
    aws rds stop-db-instance --db-instance-identifier %DB_INSTANCE%
    echo Stop command issued. Instance will be stopped in a few minutes.
    goto end
)

if "%ACTION%"=="status" (
    aws rds describe-db-instances --db-instance-identifier %$DB_INSTANCE --query 'DBInstances[0].DBInstanceStatus' --output text
    echo Status command issued.
    goto end
)

echo Invalid action. Use 'start', 'stop' or 'status'.
goto end

:usage
echo Usage: %0 [start^|stop] [db-instance-identifier]
goto end

:end
