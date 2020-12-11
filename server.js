var cors = require('cors')
var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var port = process.env.PORT || 5000

// var authRoutes = require('./routes/auth')

app.use(bodyParser.json())
app.use(cors())
app.use(
  bodyParser.urlencoded({
    extended: false
  })
)

// app.use('/api', authRoutes)

app.listen(port, function() {
  console.log('Server is running on port: ' + port)
});