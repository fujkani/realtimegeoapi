//Module handles all communications with Elasticsearch backend
//require('dotenv').config()

const environment = (process.env.NODE_ENV === 'development') ? 'development' : 'production'
require('dotenv').config({ path: `.env.${environment}` }) ////require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

require('array.prototype.flatmap').shim()

const { Client } = require('@elastic/elasticsearch')

const client = new Client({
  node: process.env.ES_SERVER_URL, //'https://localhost:9200'
  auth: {
    username: 'elastic',
    password: 'changeme' //process.env.ESPWD ||| 
  }
})


module.exports =  {
    
    client,

    esPingAsync: async function() {return await module.exports.esPing();},

    esPing: function(){
        return new Promise(async (resolve, reject) => {
            try{

                 client.ping({
                    // ping usually has a 3000ms timeout
                    requestTimeout: 3000
                  }, function (err) {
                    if (err) {
                        console.log(err)
                        reject(err)
                    } else {
                        console.log('Elasticsearch Ping worked')
                        resolve()
                    }
                });
            }
            catch (err) {
                console.log(err)
                reject(err)
            }
        });

    },


    // Async Function
    searchIndexAsync: async function(indexname, reqBody, userCountriesArray) {
        try{

            var modifiedreqBody = reqBody

            const post_filter = {terms: { "properties.location.countries.keyword": userCountriesArray, "boost": 1.0 }} // *** AM enforcment

            if (!modifiedreqBody.query ) modifiedreqBody.query = {"match_all": {}}

            delete modifiedreqBody["post_filter"] //strip the query from any existingpost_filter

            if (userCountriesArray[0] != 'All'){ //***************  GOD MODE DOES NOT GET APPLIED A POST FILTER
                modifiedreqBody["post_filter"] = post_filter
            }

            console.log(modifiedreqBody)

            const { body } = await client.search({ 
                index: indexname, 
                body: modifiedreqBody
            }, 
            {
                ignore: [404],
                maxRetries: 3
              }
            )

            const res = body.hits.hits.map(e => ({ _id: e._id, ...e._source }))
        
            console.log(res)

            return body //return res eventually
        }

        catch (err) {
            console.log(err)
        }

    },



};
