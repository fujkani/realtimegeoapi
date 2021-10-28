//Authorization MiddleWare module.
// 1. Ensures user exists in the HTTP Header and if so, 2. 

const helperES = require('./helperES')

module.exports = async (req, res, next) => {
  try {

    if (!req.headers.user){
      throw new Error('Username is missing from the request header. Cannot proceed')
    }

    console.log(req.path + ' end point invoked by user: ' + req.headers.user)
    console.log('Authorization Management module invoked..')

    const userAccess = await helperES.client.get({
        index: process.env.ES_ACCESS,
        id: req.headers.user
      }, 
      {
          ignore: [404],
          maxRetries: 3
      }
    )
    
    var countriesArray = []
    if (userAccess && userAccess.body.found) {
        countriesArray = userAccess.body._source.dataaccess
        if (countriesArray.lenght == 0) throw new Error('No countries have been granted for User: ' + req.headers.user)
    }
    else throw new Error('User: ' + req.headers.user + ' is not granted access to any data!')
    
    console.log('User: ' + req.headers.user + ' has access to following countries: ' + countriesArray.join())

    module.exports.userCountriesArray = countriesArray
    module.exports.user = req.headers.user
    module.exports.userInfo = userAccess.body._source

    
    next()

  } catch (error) {
    next(error.message)
  }
}

