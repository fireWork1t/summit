var express = require('express')
var app = express()
var cors = require('cors') // Import the cors package

app.use(cors())

var redis = require('redis')
var redisClient
var bodyParser = require('body-parser')
const NODECACHE = require('node-cache')

const QUEUECACHE = new NODECACHE({ stdTTL: 10800 })
const LIFTDATA = require('./data/lift-data.json')
const LIFTS = LIFTDATA.liftData

const AVERAGE_WAIT_TIME_EXPIRATION = 10800
const USER_DATA_EXPIRATION = 600

// const waitTimeMapping = {
//   '0 minutes': 0,
//   '1 minute': 1,
//   '3 minutes': 3,
//   '5 minutes': 5,
//   '7 minutes': 7,
//   '9 minutes': 9,
//   '11 minutes': 11,
//   '13 minutes': 13,
//   '15 minutes': 15,
//   'over 15 minutes': 20
// }

app.use(bodyParser.json())

var calculationInterval = setInterval(function () {
  calculate()
}, 5000)

async function connectRedis () {
  redisClient = redis.createClient()
  redisClient.on('error', err => console.log('Redis Client Error', err))
  await redisClient.connect()
}

const asyncHandler = fun => (req, res, next) => {
  Promise.resolve(fun(req, res, next)).catch(next)
}

app.post(
  '/update',
  asyncHandler(async function (req, res) {
    if (!redisClient) {
      await connectRedis()
    }

    if (!Number.isInteger(req.body.waitTime)) {
      return res.send({ error: 'Invalid input' })
    }

    await redisClient.set(
      `${req.body.lift}:${req.body.uniqueID}`,
      req.body.waitTime,
      { EX: USER_DATA_EXPIRATION }
    )

    return res.send({ message: 'ok' })
  })
)

app.get(
  '/status/:skiArea',
  asyncHandler(async function (req, res) {
    res.end(JSON.stringify(await getQueueSize(req.params.skiArea)))
  })
)

async function calculate () {
  for (const lift of LIFTS) {
    let liftQueueSize = await redisClient.keys(`${lift.name}:*`)

    let total = 0
    let average = 0
    let userDataFound = false

    for (const key of liftQueueSize ?? []) {
      total += Number(await redisClient.get(key))

      if (!userDataFound && key != `${lift.name}:average1`) {
        userDataFound = true
      }
    }

    //total += QUEUECACHE.get(lift.name)

    //console.log({ added: QUEUECACHE.get(lift.name), lift: lift.name })

    //console.log(lift.name + ' ' + total)
    average = Math.round(total / liftQueueSize.length)

    if (average >= 0 && userDataFound) {
      await redisClient.set(`${lift.name}:${'average1'}`, average, {
        EX: USER_DATA_EXPIRATION
      })

      QUEUECACHE.set(lift.name, average)

      await redisClient.set(lift.skiArea + ':' + lift.name, average, {
        EX: AVERAGE_WAIT_TIME_EXPIRATION
      })
    }
  }
}

async function getQueueSize (skiArea) {
  let liftQueues = {}
  let filteredQueues = LIFTS.filter(x => x.skiArea == skiArea) // filters lift cache to only include lifts from the selected ski area

  //console.log({ filteredQueues, skiArea })
  for (const lift of filteredQueues) {
    let tempWaitTime = QUEUECACHE.get(lift.name)
    if (!tempWaitTime) {
      tempWaitTime = await redisClient.get(lift.skiArea + ':' + lift.name)
      QUEUECACHE.set(lift.name, tempWaitTime)
    }
    liftQueues[lift.name] = tempWaitTime
  }
  //console.log(liftQueues)
  return liftQueues
}

var server = app.listen(8080, async function () {
  await connectRedis()
  var host = server.address().address
  var port = server.address().port
  console.log('Listening at http://%s:%s', host, port)
})
