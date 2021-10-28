
//Entry point index.js
//Exposes main REST endpoints
//Handles socket.io eventing

//#region imports and requires
const environment = (process.env.NODE_ENV === 'development') ? 'development' : 'production'
require('dotenv').config({ path: `.env.${environment}` }) ////require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

const express = require('express')
const bodyParser = require('body-parser')
const { promisify } = require('util') //The util.promisify() method defines in utilities module of Node.js standard library. It is basically used to convert a method that returns responses using a callback function to return responses in a promise object

const cors = require('cors');

//const helperES = require('./helperES')

//may use later..
//const helperAMMiddleWare = require('./helperAMMiddleWare')

//#endregion imports and requires

//#region Vars
const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTION"
}

var pjson = require('./package.json');
//console.log(pjson.version);

////#endregion Vars

const app = express()
console.log('RUNNING IN MODE: ' + environment)

const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

//#region MiddleWares

//add other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Attach the custom Authorization Management middleware before starting the express app
//app.use(helperAMMiddleWare)

//#endregion MiddleWares

//#region API endpoints

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

//Just to test API is up and running..
app.get('/ping', async (req, res) => {
  try{

    res.set(headers)
    res.status(200).send(
      {
        body: { status: "success", result:  "Reply from '" + pjson.description + "' @ver: " + pjson.version }
      }
    );
    //res.send("Reply from GeoBrowser API ver: " + (process.env.API_VESION === null ? 'none' : process.env.API_VESION))
  }
  catch (err) {
    console.log('Ping error:' + err)
    res.status(500).send(err);
  }
});

//for future use if we get to enable authentication & authorization
app.get('/getcurrentuserinfo', async (req, res) => {
  try{

    res.set(headers)
    res.status(200).send(
      {
        body: { status: "success", result:  helperAMMiddleWare.userInfo }
      }
    );
    //res.send(helperAMMiddleWare.userInfo)
  }
  catch (err) {
    console.log('getcurrentuserinfo error:' + err)
    res.status(500).send(err);
}
});

//if we decide to store gps locations in Elasticsearch..
app.post('/:indexId/_search', async (req, res) => {
  try{
    if (!req.params){
      res.set(headers)
      res.status(400).send(
        {
        body: { status: "failure", result:  'A index name or pattern needs to be specified in the URI <baseuri>/indexname/_search' }
      });
    }
    else {

      let indexName = req.params["indexId"]
      //TODO: check request body !!!
      abc = await helperES.searchIndexAsync(indexName, req.body, helperAMMiddleWare.userCountriesArray)
      .then( ret => {
        console.log('Retrieved ES Entries')
        console.log(ret)
        res.set(headers)
        res.status(200).send(
          {
            body: { status: "success", result:  ret }
          }
        )
        //res.send(JSON.stringify(ret))
      })
      .catch(err => {
        console.log('Get ES Entries failed: ' + err)
      });

    }

  }
  catch (err) {
    console.log('_Search error:' + err)
    res.status(500).send(err);
  }
});

//#endregion API endpoints

//#region Socket eventing
io.on('connection', (socket) => {

  //here is where we will be receiving gps points from connected clients and need to decide whether we keep an in-mem list
  //or store in elasticsearch or both
  socket.on('chat message', msg => {
    //broadcast the change to connected clients..
    io.emit('chat message', msg);
  });
});

//#endregion Socket eventing

http.listen(port, () => {
  console.log(`Socket.IO server running at port:${port}/`);
});
