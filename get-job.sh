#!/bin/sh
# Based on code from api.wheresitup.com
# H. Dahle

JOBID=$1

if [ "$JOBID" = "" ]; then
  echo "Missing Job ID"
  exit
fi

curl -i "https://api.wheresitup.com/v4/jobs/${JOBID}" \
    -H "Auth: Bearer `cat wheresitup.id` `cat wheresitup.token`"

echo ""

