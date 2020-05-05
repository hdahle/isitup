#!/bin/sh
# This is pretty much cloned from api.wheresitup.com
# H. Dahle

curl -i "https://api.wheresitup.com/v4/jobs" \
    -H "Auth: Bearer 5eac3ce040d03f563c201b0e 3e723771ee0443b812b3138e5fae3b4f" \
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
