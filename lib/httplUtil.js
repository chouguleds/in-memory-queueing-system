const axios = require('axios')

const makeRequest = function (options) {

  return axios(options)
    .then(function (result) {

      return result
    })
    .catch(function (err) {
      console.log("callback error ", err)
      return err
    })
}

module.exports = {
  makeRequest
}