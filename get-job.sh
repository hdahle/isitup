#!/bin/sh

JOBID=$1

if [ "$JOBID" = "" ]; then
  echo "Missing Job ID"
  exit
fi

curl -i "https://api.wheresitup.com/v4/jobs/${JOBID}" \
    -H "Auth: Bearer 5eac3ce040d03f563c201b0e 3e723771ee0443b812b3138e5fae3b4f"

echo ""

