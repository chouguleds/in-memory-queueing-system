'use strict'

// During the test the env variable is set to test


const User = require('../../../app/users/users.model')

// Require the dev-dependencies
const chai = require('chai')
const sinon = require('sinon')
const chaiHttp = require('chai-http')
const server = require('../../../app')
chai.should()

const patient = {
  '_id': '5a112402f028fd2fc9cc4deb',
  'updated_at': '2017-11-19T06:26:10.985Z',
  'created_at': '2017-11-19T06:26:10.985Z',
  'name': 'deepak',
  'email': 'chougule.ds@gmail.com',
  'role': 'patient',
  'gender': 'male'
}

chai.use(chaiHttp)
// Our parent block
describe('Users', function () {

  let getFindUserStub
  let getUserSaveStub
  before((done) => {

    getUserSaveStub = sinon.stub(User, 'findOne', (obj) => {
      return new Promise((resolve) => {

        if (obj.email === patient.email) {
          return resolve({
            _doc: {
              patient
            }
          })
        } else {
          return resolve(null)
        }
      })
    })
    getFindUserStub = sinon.stub(User.prototype, 'save', () => {
      return new Promise((resolve) => {

        return resolve()
      })
    })
    done()
  })
  after((done) => {
    getFindUserStub.restore()
    getUserSaveStub.restore()
    done()
  })
  /*
   * Test the /CREATE route
   */
  describe('/CREATE user', function () {

    it('it should create new user to db', function (done) {

      const patient1 = {
        name: 'deepak',
        email: 'deepak@gmail.com',
        password: 'deepak',
        role: 'patient'
      }

      chai.request(server)
        .post('/api/users/create')
        .send(patient1)
        .then(function (res) {

          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.should.have.property('success').eql(true)
          res.body.should.have.property('message').eql('user registered')
          done()
        })
    })

    it('it should show error message if email already exists', function (done) {

      const patient2 = {
        name: 'deepak',
        email: 'chougule.ds@gmail.com',
        password: 'deepak',
        role: 'patient'
      }

      chai.request(server)
        .post('/api/users/create')
        .send(patient2)
        .then(function (res) {


        })
        .catch(function (err) {
          err.response.should.have.status(409)
          err.response.body.should.be.a('object')
          err.response.body.should.have.property('success').eql(false)
          err.response.body.should.have.property('message').eql('email already exists')
          done()
        })
    })
  })

})
