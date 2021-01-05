const MissingParamError = require('./missing-param-error')

module.exports = class HttpResponse {
  static badRequest (paramName) {
    return {
      statusCode: 400,
      body: new MissingParamError(paramName)
    }
  }

  static get serverErro () {
    return { statusCode: 500 }
  }
}
