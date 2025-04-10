#!/usr/bin/env bash

# SSL Certificate Expiration Monitor
# =================================
#
# This script monitors SSL certificate expiration dates and sends notifications
# via Discord when certificates are approaching expiration or have expired.
#
# Usage:
#   ./ssl-check.sh <path_to_pem_file>
#
# Functionality:
#   - Reads the expiration date from a PEM certificate file
#   - Sends a warning notification if the certificate will expire within 14 days
#   - Sends an urgent notification if the certificate has already expired
#   - Notifications are sent via a Discord bot located in the notification-bot directory
#
# Notification Bot:
#   - Uses the Node.js bot located in the parent directory
#   - Sends formatted Markdown messages through Discord
#   - Messages include expiration dates in a friendly format and days remaining
#
# Exit Codes:
#   0 - Success
#   1 - Error (invalid arguments, file not found, or notification failure)

# Exit on error, undefined variables, and pipe failures
set -euo pipefail

# Constants
readonly THRESHOLD_DAYS=14
readonly NOTIFICATION_BOT_DIR="../"

# Function to display usage information
usage() {
    echo "Usage: $0 <path_to_pem_file>"
    echo "Checks SSL certificate expiration and sends notifications if needed."
    exit 1
}

# Function to send Discord message
send_dm() {
    local message="$1"
    
    if [[ ! -d "$NOTIFICATION_BOT_DIR" ]]; then
        echo "Error: Notification bot directory not found at $NOTIFICATION_BOT_DIR"
        exit 1
    fi
    
    cd "$NOTIFICATION_BOT_DIR" || exit 1
    npm run send <<EOF
${message}
EOF
}

# Function to format date in a friendly way
format_date() {
    local date_str="$1"
    date --date="$date_str" "+%B %d, %Y"
}

# Function to check if a number is less than or equal to threshold
is_below_threshold() {
    local days="$1"
    [[ "$days" -le "$THRESHOLD_DAYS" ]]
}

# Function to get days until expiration
get_days_until_expiration() {
    local expires_at="$1"
    local now
    now=$(date +%s)
    echo $(( (expires_at - now) / 86400 ))
}

# Function to create expiration message
create_expiration_message() {
    local days="$1"
    local friendly_date="$2"
    local plural="days"
    [[ "$days" -eq 1 ]] && plural="day"
    
    echo "# 🔒 SSL Certificate Expiration Notice

Your SSL certificate will expire in **${days} ${plural}** (on ${friendly_date}).

Please ensure to renew your certificate before expiration to maintain secure connections."
}

# Function to create expired message
create_expired_message() {
    local friendly_date="$1"
    
    echo "# ⚠️ SSL Certificate Expired

Your SSL certificate has expired on **${friendly_date}**.

❗️ **Immediate action required**: Please renew your certificate as soon as possible to restore secure connections."
}

# Main function
main() {
    # Check if PEM file is provided
    if [[ $# -ne 1 ]]; then
        usage
    fi

    local pem_file="$1"
    
    # Check if PEM file exists
    if [[ ! -f "$pem_file" ]]; then
        echo "Error: PEM file not found at $pem_file"
        exit 1
    fi

    # Get certificate expiration date
    local output
    output=$(openssl x509 -enddate -noout -in "$pem_file") || {
        echo "Error: Failed to read certificate information"
        exit 1
    }
    
    local not_after
    not_after=$(echo "${output#notAfter=}")
    
    # Convert dates to timestamps
    local expires_at
    local now
    expires_at=$(date --date="$not_after" +%s)
    now=$(date +%s)
    
    # Check certificate status and send appropriate notification
    if [[ $now -lt $expires_at ]]; then
        local days
        days=$(get_days_until_expiration "$expires_at")
        echo "ℹ️ Days until expiration: $days"
        
        if is_below_threshold "$days"; then
            echo "Threshold met. Notifying..."
            local friendly_date
            friendly_date=$(format_date "$not_after")
            send_dm "$(create_expiration_message "$days" "$friendly_date")"
        fi
    else
        local friendly_date
        friendly_date=$(format_date "$not_after")
        echo "⚠️ Certificate expired on: $friendly_date"
        send_dm "$(create_expired_message "$friendly_date")"
    fi
}

# Run main function with all arguments
main "$@"
