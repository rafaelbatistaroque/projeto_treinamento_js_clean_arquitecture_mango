const { MissingParamError, InvalidParamError, ServerError, UnauthorizedError } = require('../errors')
const LoginRouter = require('./login-router')

class AuthUseCaseAbstract {
  auth () { }
}

class EmailValidatorAbstract {
  isValid () { }
}

class AuthUseCaseSpy extends AuthUseCaseAbstract {
  async auth (email, password) {
    this.email = email
    this.password = password

    return this.accessToken
  }
}

class AuthUseCaseSpyError extends AuthUseCaseAbstract {
  async auth () {
    throw new Error()
  }
}

class EmailValidatorSpy extends EmailValidatorAbstract {
  isValid (email) {
    this.email = email
    return this.isEmailValid
  }
}

class EmailValidatorSpyError extends EmailValidatorAbstract {
  isValid () {
    throw new Error()
  }
}

const makeEmailValidator = () => {
  const emailValidatorSpy = new EmailValidatorSpy()
  emailValidatorSpy.isEmailValid = true
  return emailValidatorSpy
}

const makeEmailValidatorWithError = () => {
  const emailValidatorSpyError = new EmailValidatorSpyError()
  const authUseCaseSpy = makeAuthUseCase()
  const sutError = new LoginRouter(authUseCaseSpy, emailValidatorSpyError)
  return {
    emailValidatorSpyError,
    sutError
  }
}

const makeSut = () => {
  const authUseCaseSpy = makeAuthUseCase()
  const emailValidatorSpy = makeEmailValidator()
  authUseCaseSpy.accessToken = 'valid_token'
  const sut = new LoginRouter(authUseCaseSpy, emailValidatorSpy)
  return {
    emailValidatorSpy,
    authUseCaseSpy,
    sut
  }
}

const makeAuthUseCase = () => {
  const authUseCaseSpy = new AuthUseCaseSpy()
  return authUseCaseSpy
}

const makeAuthUseCaseWithError = () => {
  const authUseCaseSpyError = new AuthUseCaseSpyError()
  const sutError = new LoginRouter(authUseCaseSpyError)
  return {
    authUseCaseSpyError,
    sutError
  }
}

describe('Login Router', () => {
  test('Should return 400 if no email is provided', async () => {
    const { sut } = makeSut()
    const httpRequest = {
      body: {
        password: 'any_password'
      }
    }
    const httpResponse = await sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new MissingParamError('email'))
  })

  test('Should return 400 if an invalid email is provided', async () => {
    const { sut, emailValidatorSpy } = makeSut()
    emailValidatorSpy.isEmailValid = false
    const httpRequest = {
      body: {
        email: 'invalid_email',
        password: 'any_password'
      }
    }

    const httpResponse = await sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new InvalidParamError('email'))
  })

  test('Should return 400 if no password is provided', async () => {
    const { sut } = makeSut()
    const httpRequest = {
      body: {
        email: 'any_email'
      }
    }
    const httpResponse = await sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new MissingParamError('password'))
  })

  test('Should return 500 if no EmailValidator is provided', async () => {
    const authUseCase = makeAuthUseCase()
    const sut = new LoginRouter(authUseCase)
    const httpRequest = {
      body: {
        email: 'any_email',
        password: 'any_password'
      }
    }

    const httpResponse = await sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError())
  })

  test('Should return 500 if no EmailValidator has no isValid method', async () => {
    const authUseCase = makeAuthUseCase()
    const sut = new LoginRouter(authUseCase, {})
    const httpRequest = {
      body: {
        email: 'any_email',
        password: 'any_password'
      }
    }

    const httpResponse = await sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError())
  })

  test('Should return 500 if EmailValidator throw exception', async () => {
    const { sutError } = makeEmailValidatorWithError()
    const httpRequest = {
      body: {
        email: 'any_email',
        password: 'any_password'
      }
    }

    const httpResponse = await sutError.route(httpRequest)
    expect(httpResponse.statusCode).toBe(500)
  })

  test('Should call EmailValidator with correct email', async () => {
    const { sut, emailValidatorSpy } = makeSut()
    const httpRequest = {
      body: {
        email: 'any_email',
        password: 'any_password'
      }
    }

    await sut.route(httpRequest)
    expect(emailValidatorSpy.email).toBe(httpRequest.body.email)
  })

  test('Should return 500 if no httpRequest is provided', async () => {
    const { sut } = makeSut()

    const httpResponse = await sut.route()
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError())
  })

  test('Should return 500 if no httpRequest has no body', async () => {
    const { sut } = makeSut()
    const httpRequest = {}

    const httpResponse = await sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError())
  })

  test('Should call AuthUseCase with correct params', async () => {
    const { sut, authUseCaseSpy } = makeSut()
    const httpRequest = {
      body: {
        email: 'any_email',
        password: 'any_password'
      }
    }

    await sut.route(httpRequest)
    expect(authUseCaseSpy.email).toBe(httpRequest.body.email)
    expect(authUseCaseSpy.password).toBe(httpRequest.body.password)
  })

  test('Should return 200 and accessToken when valid credentials are provided', async () => {
    const { sut, authUseCaseSpy } = makeSut()
    const httpRequest = {
      body: {
        email: 'valid_email',
        password: 'valid_password'
      }
    }
    const httpResponse = await sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(200)
    expect(httpResponse.body.accessToken).toEqual(authUseCaseSpy.accessToken)
  })

  test('Should return 401 when invalid credentials are provided', async () => {
    const { sut, authUseCaseSpy } = makeSut()
    authUseCaseSpy.accessToken = null
    const httpRequest = {
      body: {
        email: 'invalid_email',
        password: 'invalid_password'
      }
    }

    const httpResponse = await sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(401)
    expect(httpResponse.body).toEqual(new UnauthorizedError())
  })

  test('Should return 500 if no AuthUseCase is provided', async () => {
    const sut = new LoginRouter()
    const httpRequest = {
      body: {
        email: 'any_email',
        password: 'any_password'
      }
    }

    const httpResponse = await sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError())
  })

  test('Should return 500 if AuthUseCase has no auth method', async () => {
    const sut = new LoginRouter({})
    const httpRequest = {
      body: {
        email: 'any_email',
        password: 'any_password'
      }
    }

    const httpResponse = await sut.route(httpRequest)
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError())
  })

  test('Should return 500 if AuthUseCase throw exception', async () => {
    const { sutError } = makeAuthUseCaseWithError()
    const httpRequest = {
      body: {
        email: 'any_email',
        password: 'any_password'
      }
    }

    const httpResponse = await sutError.route(httpRequest)
    expect(httpResponse.statusCode).toBe(500)
  })
})
