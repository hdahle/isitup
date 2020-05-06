#!/bin/sh
# This is pretty much cloned from api.wheresitup.com
# H. Dahle

curl -i "https://api.wheresitup.com/v4/jobs" \
    -H "Auth: Bearer `cat wheresitup.id` `cat wheresitup.token`" \
    -H "Content-Type: application/json" \
    -d \
    '{
        "uri": "https://futureplanet.eco",
        "tests": [ "fast" ],
        "sources": [ "newyork", "amsterdam", "singapore" ],
        "options": {
            "fast": { "timeout": 10 }
        }
    }'
echo ""
