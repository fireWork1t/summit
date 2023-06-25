var express = require('express');
var app = express();
var redis = require('redis');
var redisClient;
var bodyParser = require('body-parser')
const NODECACHE = require( "node-cache" );
const QUEUECACHE = new NODECACHE();
const LIFTDATA = require('./data/lift-data.json');
const LIFTS = LIFTDATA.liftData;

// parse application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

var calculationInterval = setInterval(
    function(){
    
    calculate();


  }, 5000);

async function connectRedis(){
    redisClient = redis.createClient();
    redisClient.on('error', err => console.log('Redis Client Error', err));
    await redisClient.connect();
}


const asyncHandler = (fun) => (req, res, next) => {
    Promise.resolve(fun(req, res, next))
      .catch(next)
  }

app.post('/collectData', asyncHandler(async function (req, res) {
    if (!redisClient) {
        await connectRedis();
    }

    await redisClient.set(`${req.body.lift}:${req.body.uniqueID}`, 1, {EX: 600});
    console.log({req})
    

    
    res.end(JSON.stringify(await getQueueSize())); 
    
    
 }))


 async function calculate(){
    
    for (const lift of LIFTS){
        let liftQueueSize = await redisClient.eval(`return #redis.pcall('keys', '${lift.name}:*')`);
        
        QUEUECACHE.set(lift.name, liftQueueSize);
        
    }
    
    
}

async function getQueueSize(){
    
    let liftQueues = {};
    for (const lift of LIFTS){
         
        liftQueues[lift.name] = Math.round(QUEUECACHE.get(lift.name)/lift.peoplePerMinute);
    }
    return liftQueues;
    
}

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
     var R = 6371; // Radius of the earth in km
     var dLat = deg2rad(lat2-lat1); // deg2rad below
     var dLon = deg2rad(lon2-lon1);
     var a =
         Math.sin(dLat/2) * Math.sin(dLat/2) +
         Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
         Math.sin(dLon/2) * Math.sin(dLon/2)
         ;
     var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
     var d = R * c * 1000; // Distance in m
     return d;
    }
// Convert degrees to radians
function deg2rad(deg) {  
    return deg * (Math.PI/180)
}

// Run calculation function and return results
function checkPositionFrom(latitude, longitude, radius){
    var result = document.getElementById("result");
    if (getDistanceFromLatLonInKm(x.innerHTML,y.innerHTML,latitude, longitude).toFixed(1) < radius) {
         
         result.innerHTML = "Your distance from " + latitude + ", " + longitude + " is " + (getDistanceFromLatLonInKm(x.innerHTML,y.innerHTML,latitude, longitude).toFixed(1)) + " meters, which is inside the set radius of " + (radius) + " meters" ;
         // Return results if inside radius
         }
    else {
         result.innerHTML = "Your distance from " + latitude + ", " + longitude + " is " + (getDistanceFromLatLonInKm(x.innerHTML,y.innerHTML,latitude, longitude).toFixed(1)) + " meters, which is outside the set radius of " + (radius) + " meters" ;
         // Return results if outside radius
         }
    
  
  }

 var server = app.listen(8081, async function () {
    await connectRedis();
    var host = server.address().address
    var port = server.address().port
    console.log("Listening at http://%s:%s", host, port)
 }) 

 