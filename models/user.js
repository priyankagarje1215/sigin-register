const Sequelize = require('sequelize')
const db = require('../db/connectDB.js')

module.exports = db.sequelize.define(
  'prospects',
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: Sequelize.STRING
    },
    name: {
        type: Sequelize.STRING
      },
    email: {
      type: Sequelize.STRING
    },
    password: {
      type: Sequelize.STRING
    },
    temporarytoken: {
      type: Sequelize.STRING
    },
    active: {
        type: Sequelize.STRING
        // required: true,
        // default: false
      },
    resettoken: {
        type: Sequelize.STRING
      },
  },
  {
    timestamps: true
  }
)