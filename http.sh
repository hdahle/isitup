#!/bin/sh

URL=$1

if [ "$URL" =  "" ]; then
  echo "Please specify URL"
  exit
fi

echo "Trying $URL "

curl -i "https://api.wheresitup.com/v4/jobs" \
    -H "Auth: Bearer 5eac3ce040d03f563c201b0e 3e723771ee0443b812b3138e5fae3b4f" \
    -H "Content-Type: application/json" \
    -d \
    "{
        \"uri\": \"${URL}\",
        \"tests\": [ \"http\" ],
        \"sources\": [ \"newyork\" ],
        \"options\": {
            \"http\": { \"method\": \"HEAD\", \"max-redirects\" : 4 }
        }
    }"
