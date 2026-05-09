#!/bin/bash
set -e
cd /home/wsy/final_proj
bash stop_all.sh
sleep 3
nohup bash start_all.sh > logs/start_all_stdout.log 2>&1 < /dev/null &
echo "PorcelainAI stack restart triggered via /home/wsy/final_proj/start_all.sh"
