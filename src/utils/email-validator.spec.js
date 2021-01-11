const validator = require('validator')

class EmailValidator {
  isValid (email) {
    return validator.isEmail(email)
  }
}

const makeSut = () => {
  return new EmailValidator()
}

describe('Email Validator', () => {
  test('Should return true if validator returns true', () => {
    const sut = makeSut()
    const isValidEmail = sut.isValid('valid_email@email.com')

    expect(isValidEmail).toBe(true)
  })
  test('Should return false if validator returns false', () => {
    validator.isValidEmail = false
    const sut = makeSut()
    const isValidEmail = sut.isValid('invalid_email@email.com')

    expect(isValidEmail).toBe(false)
  })
})
