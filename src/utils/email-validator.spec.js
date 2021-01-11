const validator = require('validator')

class EmailValidator {
  isValid (email) {
    return validator.isEmail(email)
  }
}

describe('Email Validator', () => {
  test('Should return true if validator returns true', () => {
    const sut = new EmailValidator()
    const isValidEmail = sut.isValid('valid_email@email.com')

    expect(isValidEmail).toBe(true)
  })
  test('Should return false if validator returns false', () => {
    validator.isValidEmail = false
    const sut = new EmailValidator()
    const isValidEmail = sut.isValid('invalid_email@email.com')

    expect(isValidEmail).toBe(false)
  })
})
