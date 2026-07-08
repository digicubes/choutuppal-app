#!/bin/bash
# Keep-alive wrapper that restarts the server if it dies
while true; do
  cd /home/z/my-project
  npx next dev -p 3000 -H 0.0.0.0
  echo "Server died at $(date), restarting in 3s..." >> /home/z/my-project/server-restart.log
  sleep 3
done
