#!/bin/sh
# Code is from api.wheresitup.com
# H.Dahle

curl -i "https://api.wheresitup.com/v4/credits" \
  -H "Auth: Bearer `cat wheresitup.id` `cat wheresitup.token`"

echo ""
