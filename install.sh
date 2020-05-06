#!/bin/sh
#
# Installer for "wheresitup.js"
# Add script to crontab if it doesn't already exist
#
# H. Dahle

PWD=`pwd`

# must use eval for tilde-expansion to work...dirty
TMPDIR=$(mktemp -d)
LOGDIR=`eval echo ~${USER}/log`
SCRIPT="wheresitup.js"
LOGFILE="${LOGDIR}/cron.log"
NEWCRONTAB="${TMPDIR}/crontab"
NODE=`which node`
echo "Using Node at ${NODE}"
echo "Logs are in ${LOGDIR}"

IDFILE=wheresitup.id
TOKENFILE=wheresitup.token

# check if log directory exists
if [ ! -d "${LOGDIR}" ]; then
    echo "Creating ${LOGDIR}"
    mkdir ${LOGDIR} 
    if [ ! -d "${LOGDIR}" ]; then
      echo "Could not create ${LOGDIR} - aborting"
      exit
    else
      echo "Logdir created"
    fi
else
  echo "Using logfile: ${LOGFILE}"
fi

# check if *id and *token files exist
if [ ! -f "${IDFILE}" ]; then
  echo "File not found: ${IDFILE}"
  exit
fi

if [ ! -f "${TOKENFILE}" ]; then
  echo "File not found: ${TOKENFILE}"
  exit
fi

# make sure script exists
if [ -f "${PWD}/${SCRIPT}" ]; then
  echo "Shell script found: ${PWD}/${SCRIPT}"
else
  echo "Not found: ${PWD}/${SCRIPT} - aborting"
  exit
fi

# make new crontab entry: hourly at 7 minutes past the hour
NEWENTRY="28 * * * * cd ${PWD} && ${NODE} ${SCRIPT} --id `cat ${IDFILE}` --token `cat ${TOKENFILE}` --url https://futureplanet.eco --key futureplanet.eco.z >> ${LOGFILE} 2>&1"
echo "Crontab entry will be: ${NEWENTRY}"

# test if new entry already exists
crontab -l > ${NEWCRONTAB}
EXISTENTRY=`grep -F "${NEWENTRY}" < ${NEWCRONTAB}`

# add to crontab
if [ "${EXISTENTRY}" = "${NEWENTRY}"  ]; then
  echo "Already in crontab"
  exit
fi

echo -n "Add to Crontab (y/n)? "
read ANSWER

if [ "${ANSWER}" != "${ANSWER#[Yy]}" ] ;then
    echo Yes
else
    echo No
    exit
fi

echo "Adding new entries to crontab"
echo "${NEWENTRY}" >> ${NEWCRONTAB}
crontab ${NEWCRONTAB}



