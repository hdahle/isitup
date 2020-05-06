#!/bin/sh

URL=$1

if [ "$URL" =  "" ]; then
  echo "Please specify URL"
  exit
fi

echo "Trying $URL "

curl -i "https://api.wheresitup.com/v4/jobs" \
    -H "Auth: Bearer `cat wheresitup.id` `cat wheresitup.token`" \
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
echo ""
