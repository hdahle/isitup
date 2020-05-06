# isitup

Just some tools that use api.whereisitup.com

### Authentication

You need an account (free or paid) with https://wheresitup.com to use this.

The scripts assume that the auth ID is stored in ```wheresitup.id``` and that the auth token is stored in ```wheresitup.token```

### The tests

Invoking a test:
````
node wheresitup.js --id `cat wheresitup.id` --token `cat wheresitup.token` --url https://futureplanet.eco --key futureplanet.eco.z
````

The --url is the target to be tested. The sources (where the tests are performed from) are hard-coded (for now)

### The time-series

A Redis Sorted Set is used to save the data. Which sorted set is specified by the --key option.
Reading back the sorted set can be done using ZRANGE like this:
````
redis-cli zrange futureplanet.eco.z 0 1000
````
This can be done programmatically in Node.js of course. In Node, we use ZADD to add to the sorted set:
````
let redisKey = 'futureplanet.eco.z';
let redisValue = JSON.stringify(object)
let redisScore = moment().format('x'); // we use unix time as the score
redisClient.zadd(redisKey, redisScore, redisValue, function (err, res) { ... } );
````
Using Unix-time as the score ensures that it is easy to retrieve e.g. the 1000 last samples using ZRANGE.

### Random notes

Running a test involves:

- Schedule a specific test ````jobID = startJob()````
- Retrieve the jobID from that test
- Keep polling the job until complete ````json = getJobResult(jobID)````
- Parse the resulting JSON
- Store the JSON to Redis

### Useful reading

https://wheresitup.com/docs/#introduction
https://redis.io/commands/zadd
https://redis.io/commands/zrange

### Using Cron to run these tests regularly

The shell script ````install.sh```` installs an entry into ````crontab````. The installer tries to figure out the proper paths and directories since cron may run with different ````PATH```` values. Seems to work on both Ubuntu 16.04 and WSL2/Ubuntu 18.04. This is a typical crontab-entry

````
cd /home/bitnami/isitup && /opt/bitnami/nodejs/bin/node wheresitup.js --id xxx --token xxx --url https://futureplanet.eco --key futureplanet.eco.z >> /home/bitnami/log/cron.log 2>&1
````
