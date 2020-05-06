#!/bin/sh
# Get list of source servers
# Code is from api.wheresitup.com
# H.Dahle

curl -i "https://api.wheresitup.com/v4/sources" \
  -H "Auth: Bearer `cat wheresitup.id` `cat wheresitup.token`"

echo ""
