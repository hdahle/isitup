// wheresitup.js
//
//
// H. Dahle, 2020

var fetch = require('node-fetch');
var redis = require('redis');
var moment = require('moment');
var argv = require('minimist')(process.argv.slice(2));
const momFmt = 'YY-MM-DD hh:mm:ss';

const sources = ['seattle', 'newyork', 'bogota', 'london', 'oslo', 'frankfurt', 'stockholm', 'sydney', 'bangalore', 'bangkok', 'singapore', 'tokyo'];

// process commandline
const redisKey = argv.key;
const jobURL = argv.url;
const id = argv.id;
const token = argv.token;

if (redisKey === undefined || jobURL === undefined || id === undefined || token === undefined) {
  console.log('Usage:\n\tnode wheresitup.js --key <rediskey> --id <id> --token <token> --url <http(s)://url>');
  console.log('\tnode wheresitup.js --key <rediskey> --id <id> --token <token> --job <jobID>');
  console.log('\n\tUse either --jobURL (to schedule a job) or --jobID (to retrieve results of a job), not both')
  return;
}

if (jobURL !== null) {
  main();
} else {
  return;
}

async function main() {
  const wheresitupURL = 'https://api.wheresitup.com/v4/jobs';
  const wheresitupStartOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Auth': 'Bearer ' + id + ' ' + token
    },
    body: JSON.stringify({
      uri: jobURL,
      tests: ['http'],
      sources: sources,
      options: {
        http: {
          'method': 'GET', 'max-redirects': 4
        }
      }
    })
  };
  const wheresitupResultOptions = {
    headers: {
      'Auth': 'Bearer ' + id + ' ' + token
    }
  };

  // Schedule the job and get the jobID
  let jobID = await startJob(wheresitupURL, wheresitupStartOptions);
  console.log('jobID:', jobID);
  if (jobID === undefined || jobID === null) {
    return;
  }

  // Set a timeout
  let myTimeout = setTimeout(async function () {
    clearInterval(myInterval);
    console.log('Timed out after 30 sec')
  }, 30000);

  // Poll for results at 1 sec intervals
  let json = '';
  let myInterval = setInterval(async function () {
    json = await getJobResult(wheresitupURL, wheresitupResultOptions, jobID);
    let complete = Object.keys(json.response.complete).toString();
    let error = Object.keys(json.response.error).toString();
    let inprogr = Object.keys(json.response.in_progress).toString();
    console.log('Complete:', complete, '/ In progress:', inprogr, '/ Error:', error);
    if (inprogr.length === 0) {
      clearInterval(myInterval);
      clearTimeout(myTimeout);
      let res = buildResult(json);
      console.log(res)
      saveResult(res, redisKey);
    }
  }, 1000);
}

//
// Convert the JSON of completed tests to something a bit more compact
//
function buildResult(json) {
  // list of completed cities
  let cities = Object.keys(json.response.complete);

  // build the result JSON
  let result = {
    url: json.request.url,
    time: json.request.easy_time,
    unixtime: moment(json.request.easy_time).format('x'),
    cities: []
  };

  // step through all completed cities, build summary for each city
  while (cities.length) {
    let city = cities.shift();
    let summary = json.response.complete[city].http.summary
    let citySummary = {
      location: city,
      contentLength: 0,
      redirects: summary.length - 1,
      timingConnected: Math.trunc(1000 * summary[0].timingConnected),
      timingResponse: 0,
      timingRequest: 0,
      timingTransfer: 0
    }
    while (summary.length) {
      let s = summary.pop();
      citySummary.contentLength = s.responseCode == 200 ? s.contentLength : citySummary.contentLength;
      citySummary.timingResponse += Number(s.timingResponse);
      citySummary.timingRequest += Number(s.timingRequest);
      citySummary.timingTransfer += Number(s.timingTransfer);
    }
    citySummary.timingResponse = Math.trunc(1000 * citySummary.timingResponse);
    citySummary.timingRequest = Math.trunc(1000 * citySummary.timingRequest);
    citySummary.timingTransfer = Math.trunc(1000 * citySummary.timingTransfer);
    result.cities.push(citySummary);
  }
  return result;
}

//
// Fetch the results of a completed job
//
async function getJobResult(url, options, jobID) {
  const response = await fetch(url + '/' + jobID, options);
  const json = await response.json();
  console.log('Request: ', json.request.url, moment(json.request.easy_time).format(momFmt));
  return json;
}

//
// Schedule a new job, return jobID
//
async function startJob(url, options) {
  const response = await fetch(url, options);
  const json = await response.json();
  return json.jobID;
}

//
// Store results to Redis Sorted Set
//
function saveResult(result, redisKey) {
  var redClient = redis.createClient();
  redClient.on('connect', function () {
    console.log(moment().format(momFmt) + ' Redis client connected');
  });
  redClient.on('ready', function () {
    console.log(moment().format(momFmt) + ' Redis client ready');
  });
  redClient.on('warning', function () {
    console.log(moment().format(momFmt) + ' Redis warning');
  });
  redClient.on('error', function (err) {
    console.log(moment().format(momFmt) + ' Redis error:' + err);
  });

  // Store key/value pair to Redis
  let redisValue = JSON.stringify(result);
  console.log(moment().format(momFmt) +
    ' Key:' + redisKey +
    ' Len:' + redisValue.length +
    ' Timestamp:' + result.unixtime +
    ' Val:' + redisValue.substring(0, 60));

  redClient.zadd(redisKey, moment().format('x'), redisValue, function (err, res) {
    if (res) {
      console.log(moment().format(momFmt) + ' Result:' + res);
    } else {
      console.log(moment().format(momFmt) + ' Error: ' + err);
    }
    setInterval((() => {
      process.exit();
    }), 1000);
  });

}

// EOF //
