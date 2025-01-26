#!/bin/bash            

# Get the boot time
boot_time=$(date -d "$(uptime -s)" +%s)

# Timestamp from the log (in seconds)
log_timestamp=1901793

# Calculate the OOM event time
oom_time=$(date -d "@$((boot_time + log_timestamp))")

echo "OOM event occurred at: $oom_time"

