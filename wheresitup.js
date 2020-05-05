// wheresitup.js
//
//
// H. Dahle, 2020

var fetch = require('node-fetch');
var redis = require('redis');
var moment = require('moment');
var argv = require('minimist')(process.argv.slice(2));
const momFmt = 'YY-MM-DD hh:mm:ss';

// process commandline
const redisKey = argv.key;
const jobURL = argv.url;
const id = argv.id;
const token = argv.token;
const jobID = argv.job;
if (redisKey === undefined || (jobURL === undefined && jobID === undefined) || id === undefined || token === undefined) {
  console.log('Usage:\n\tnode wheresitup.js --key <rediskey> --id <id> --token <token> --url <http(s)://url>');
  console.log('\tnode wheresitup.js --key <rediskey> --id <id> --token <token> --job <jobID>');
  console.log('\n\tUse either --jobURL (to schedule a job) or --jobID (to retrieve results of a job), not both')
  return;
}


// Schedule a job
if (jobURL !== undefined && jobURL !== null) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Auth': 'Bearer ' + id + ' ' + token
    },
    body: JSON.stringify({
      uri: jobURL,
      tests: ['http'],
      sources: ['newyork', 'singapore', 'amsterdam', 'seattle', 'sydney', 'bangkok', 'tokyo', 'manila'],
      options: {
        http: {
          'method': 'HEAD', 'max-redirects': 4
        }
      }
    })
  };
  scheduleJob('https://api.wheresitup.com/v4/jobs', options);
}

// Fetch results of a job
if (jobID !== undefined && jobID !== null) {
  const options = {
    headers: {
      'Auth': 'Bearer ' + id + ' ' + token
    }
  };
  fetchResults('https://api.wheresitup.com/v4/jobs', options, jobID, redisKey);
}

// If we are here it is an error


function status(response) {
  if (response.status >= 200 && response.status < 300) {
    return Promise.resolve(response)
  } else {
    return Promise.reject(new Error(response.statusText))
  }
}

function json(response) {
  return response.json()
}


function fetchResults(url, options, jobID, redisKey) {
  console.log('url:', url)

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

  fetch(url + '/' + jobID, options)
    .then(status)
    .then(json)
    .then(res => {
      console.log('Request: ', res.request.url, res.request.ip, moment(res.request.easy_time).format(momFmt));
      let cities = Object.keys(res.response.complete);

      let result = {
        url: res.request.url,
        ip: res.request.ip,
        time: res.request.easy_time,
        cities: []
      };

      while (cities.length) {
        let origin = cities.shift();
        let summary = res.response.complete[origin].http.summary
        console.log(summary)

        let citySummary = {
          origin: origin,
          redirects: summary.length - 1,
          timingConnected: Math.trunc(1000 * summary[0].timingResponse),
          timingResponse: 0,
          timingRequest: 0,
          timingTransfer: 0
        }

        while (summary.length) {
          let s = summary.pop();
          citySummary.timingResponse += Number(s.timingResponse);
          citySummary.timingRequest += Number(s.timingRequest);
          citySummary.timingTransfer += Number(s.timingTransfer);
        }
        citySummary.timingResponse = Math.trunc(1000 * citySummary.timingResponse);
        citySummary.timingRequest = Math.trunc(1000 * citySummary.timingRequest);
        citySummary.timingTransfer = Math.trunc(1000 * citySummary.timingTransfer);
        result.cities.push(citySummary);
      }

      console.log(result)

      process.exit(0);

      // Store key/value pair to Redis
      let redisValue = JSON.stringify(results);
      console.log(moment().format(momFmt) +
        ' Storing ' + redisValue.length +
        ' bytes, key=' + redisKey +
        ' value=' + redisValue.substring(0, 60));

      redClient.set(redisKey, redisValue, function (error, result) {
        if (result) {
          console.log(moment().format(momFmt) + ' Result:' + result);
        } else {
          console.log(moment().format(momFmt) + ' Error: ' + error);
        }
      });

      // exit
      setInterval((() => {
        process.exit();
      }), 1000)
    })
    .catch(err => {
      console.log('Error fetching results:', err);
      process.exit(1);
    })
}

function scheduleJob(url, options) {
  console.log('url', url);
  console.log('options:', options);
  fetch(url, options)
    .then(status)
    .then(json)
    .then(res => {
      console.log('Job ID: ', res.jobID)
      process.exit(0);
    })
    .catch(err => {
      console.log(err);
      process.exit(1);
    })
}
