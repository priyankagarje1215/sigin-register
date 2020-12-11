var User = require('../models/user'); // Import User Model
var jwt = require('jsonwebtoken'); // Import JWT Package
var secret = 'harrypotter'; // Create custom secret for use in JWT
var nodemailer = require('nodemailer'); // Import Nodemailer Package
var sgTransport = require('nodemailer-sendgrid-transport'); // Import Nodemailer Sengrid Transport Package
const dbConnection = require('./db/connectDb');

module.exports = function(router) {

	// Start Sendgrid Configuration Settings	
	var options = {
		auth: {
			api_user: 'test@gmail.com', // Sendgrid username
			api_key: 'test@2020' // Sendgrid password
		}
	}
	var client = nodemailer.createTransport(sgTransport(options));
	// End Sendgrid Configuration Settings	
    console.log("hoooooooooooo2222222")
	// Route to register new users	
	router.post('/users', function(req, res) {
        console.log("hoooooooooooo")
		var user = new User(); // Create new User object
		user.username = req.body.username; // Save username from request to User object
		user.password = req.body.password; // Save password from request to User object
		user.email = req.body.email; // Save email from request to User object
		user.name = req.body.name; // Save name from request to User object
		user.temporarytoken = jwt.sign({ username: user.username, email: user.email }, secret, { expiresIn: '24h' }); // Create a token for activating account through e-mail

		// Check if request is valid and not empty or null
		if (req.body.username == null || req.body.username == '' || req.body.password == null || req.body.password == '' || req.body.email == null || req.body.email == '' || req.body.name == null || req.body.name == '') {
			res.json({ success: false, message: 'Ensure username, email, and password were provided' });
		} else {
			// Save new user to database
			user.save(function(err) {
				if (err) {
					// Check if any validation errors exists (from user model)
					if (err.errors != null) {
						if (err.errors.name) {
							res.json({ success: false, message: err.errors.name.message }); // Display error in validation (name)
						} else if (err.errors.email) {
							res.json({ success: false, message: err.errors.email.message }); // Display error in validation (email)
						} else if (err.errors.username) {
							res.json({ success: false, message: err.errors.username.message }); // Display error in validation (username)
						} else if (err.errors.password) {
							res.json({ success: false, message: err.errors.password.message }); // Display error in validation (password)
						} else {
							res.json({ success: false, message: err }); // Display any other errors with validation
						}
					} else if (err) {
						// Check if duplication error exists
						if (err.code == 11000) {
							if (err.errmsg[61] == "u") {
								res.json({ success: false, message: 'That username is already taken' }); // Display error if username already taken
							} else if (err.errmsg[61] == "e") {
								res.json({ success: false, message: 'That e-mail is already taken' }); // Display error if e-mail already taken
							}
						} else {
							res.json({ success: false, message: err }); // Display any other error
						}
					}
				} else {
					// Create e-mail object to send to user
					var email = {
						from: 'mbs.nilesh@gmail.com',
						to: user.email,
						subject: 'Activation Link',
						text: 'Hello ' + user.name + ', thank you for registering at localhost.com. Please click on the following link to complete your activation: http://localhost:8080/activate/' + user.temporarytoken,
						html: 'Hello<strong> ' + user.name + '</strong>,<br><br>Thank you for registering at localhost.com. Please click on the link below to complete your activation:<br><br><a href="http://localhost:8080/activate/' + user.temporarytoken + '">http://localhost:8080/activate/</a>'
					};
					// Function to send e-mail to the user
					client.sendMail(email, function(err, info) {
						if (err) console.log(err); // If error with sending e-mail, log to console/terminal
					});
					res.json({ success: true, message: 'Account registered! Please check your e-mail for activation link.' }); // Send success message back to controller/request
				}
			});
		}
	});

	// Route to check if username chosen on registration page is taken
	router.post('/checkusername', function(req, res) {
		User.findOne({ username: req.body.username }).select('username').exec(function(err, user) {
			if (err) throw err; // Throw err if cannot connect

			if (user) {
				res.json({ success: false, message: 'That username is already taken' }); // If user is returned, then username is taken
			} else {
				res.json({ success: true, message: 'Valid username' }); // If user is not returned, then username is not taken
			}
		});
	});

	// Route to check if e-mail chosen on registration page is taken	
	router.post('/checkemail', function(req, res) {
		User.findOne({ email: req.body.email }).select('email').exec(function(err, user) {
			if (err) throw err; // Throw err if cannot connect

			if (user) {
				res.json({ success: false, message: 'That e-mail is already taken' }); // If user is returned, then e-mail is taken
			} else {
				res.json({ success: true, message: 'Valid e-mail' }); // If user is not returned, then e-mail is not taken
			}
		});
	});

	// Route for user logins
	router.post('/authenticate', function(req, res) {
		User.findOne({ username: req.body.username }).select('email username password active').exec(function(err, user) {
			if (err) throw err; // Throw err if cannot connect

			// Check if user is found in the database (based on username)			
			if (!user) {
				res.json({ success: false, message: 'Username not found' }); // Username not found in database
			} else if (user) {
				// Check if user does exist, then compare password provided by user
				if (!req.body.password) {
					res.json({ success: false, message: 'No password provided' }); // Password was not provided
				} else {
					var validPassword = user.comparePassword(req.body.password); // Check if password matches password provided by user 
					if (!validPassword) {
						res.json({ success: false, message: 'Could not authenticate password' }); // Password does not match password in database
					} else if (!user.active) {
						res.json({ success: false, message: 'Account is not yet activated. Please check your e-mail for activation link.', expired: true }); // Account is not activated 
					} else {
						var token = jwt.sign({ username: user.username, email: user.email }, secret, { expiresIn: '24h' }); // Logged in: Give user token
						res.json({ success: true, message: 'User authenticated!', token: token }); // Return token in JSON object to controller
					}
				}
			}
		});
	});

	// Route to activate the user's account	
	router.put('/activate/:token', function(req, res) {
		User.findOne({ temporarytoken: req.params.token }, function(err, user) {
			if (err) throw err; // Throw error if cannot login
			var token = req.params.token; // Save the token from URL for verification 

			// Function to verify the user's token
			jwt.verify(token, secret, function(err, decoded) {
				if (err) {
					res.json({ success: false, message: 'Activation link has expired.' }); // Token is expired
				} else if (!user) {
					res.json({ success: false, message: 'Activation link has expired.' }); // Token may be valid but does not match any user in the database
				} else {
					user.temporarytoken = false; // Remove temporary token
					user.active = true; // Change account status to Activated
					// Mongoose Method to save user into the database
					user.save(function(err) {
						if (err) {
							console.log(err); // If unable to save user, log error info to console/terminal
						} else {
							// If save succeeds, create e-mail object
							var email = {
								from: 'Localhost Staff, staff@localhost.com',
								to: user.email,
								subject: 'Localhost Account Activated',
								text: 'Hello ' + user.name + ', Your account has been successfully activated!',
								html: 'Hello<strong> ' + user.name + '</strong>,<br><br>Your account has been successfully activated!'
							};

							// Send e-mail object to user
							client.sendMail(email, function(err, info) {
								if (err) console.log(err); // If unable to send e-mail, log error info to console/terminal
							});
							res.json({ success: true, message: 'Account activated!' }); // Return success message to controller
						}
					});
				}
			});
		});
	});

	// Route to verify user credentials before re-sending a new activation link	
	router.post('/resend', function(req, res) {
		User.findOne({ username: req.body.username }).select('username password active').exec(function(err, user) {
			if (err) throw err; // Throw error if cannot connect

			// Check if username is found in database
			if (!user) {
				res.json({ success: false, message: 'Could not authenticate user' }); // Username does not match username found in database
			} else if (user) {
				// Check if password is sent in request
				if (req.body.password) {
					var validPassword = user.comparePassword(req.body.password); // Password was provided. Now check if matches password in database
					if (!validPassword) {
						res.json({ success: false, message: 'Could not authenticate password' }); // Password does not match password found in database
					} else if (user.active) {
						res.json({ success: false, message: 'Account is already activated.' }); // Account is already activated
					} else {
						res.json({ success: true, user: user });
					}
				} else {
					res.json({ success: false, message: 'No password provided' }); // No password was provided
				}
			}
		});
	});

	// Route to send user a new activation link once credentials have been verified
	router.put('/resend', function(req, res) {
		User.findOne({ username: req.body.username }).select('username name email temporarytoken').exec(function(err, user) {
			if (err) throw err; // Throw error if cannot connect
			user.temporarytoken = jwt.sign({ username: user.username, email: user.email }, secret, { expiresIn: '24h' }); // Give the user a new token to reset password
			// Save user's new token to the database
			user.save(function(err) {
				if (err) {
					console.log(err); // If error saving user, log it to console/terminal
				} else {
					// If user successfully saved to database, create e-mail object
					var email = {
						from: 'Localhost Staff, staff@localhost.com',
						to: user.email,
						subject: 'Localhost Activation Link Request',
						text: 'Hello ' + user.name + ', You recently requested a new account activation link. Please click on the following link to complete your activation: http://localhost:8080/activate/' + user.temporarytoken,
						html: 'Hello<strong> ' + user.name + '</strong>,<br><br>You recently requested a new account activation link. Please click on the link below to complete your activation:<br><br><a href="http://localhost:8080/activate/' + user.temporarytoken + '">http://localhost:8080/activate/</a>'
					};

					// Function to send e-mail to user
					client.sendMail(email, function(err, info) {
						if (err) console.log(err); // If error in sending e-mail, log to console/terminal
					});
					res.json({ success: true, message: 'Activation link has been sent to ' + user.email + '!' }); // Return success message to controller
				}
			});
		});
	});

	// Route to send user's username to e-mail
	router.get('/resetusername/:email', function(req, res) {
		User.findOne({ email: req.params.email }).select('email name username').exec(function(err, user) {
			if (err) {
				res.json({ success: false, message: err }); // Error if cannot connect
			} else {
				if (!user) {
					res.json({ success: false, message: 'E-mail was not found' }); // Return error if e-mail cannot be found in database
				} else {
					// If e-mail found in database, create e-mail object
					var email = {
						from: 'Localhost Staff, staff@localhost.com',
						to: user.email,
						subject: 'Localhost Username Request',
						text: 'Hello ' + user.name + ', You recently requested your username. Please save it in your files: ' + user.username,
						html: 'Hello<strong> ' + user.name + '</strong>,<br><br>You recently requested your username. Please save it in your files: ' + user.username
					};

					// Function to send e-mail to user
					client.sendMail(email, function(err, info) {
						if (err) console.log(err); // If error in sending e-mail, log to console/terminal
					});
					res.json({ success: true, message: 'Username has been sent to e-mail! ' }); // Return success message once e-mail has been sent
				}
			}
		});
	});

	// Route to send reset link to the user
	router.put('/resetpassword', function(req, res) {
		User.findOne({ username: req.body.username }).select('username active email resettoken name').exec(function(err, user) {
			if (err) throw err; // Throw error if cannot connect
			if (!user) {
				res.json({ success: false, message: 'Username was not found' }); // Return error if username is not found in database
			} else if (!user.active) {
				res.json({ success: false, message: 'Account has not yet been activated' }); // Return error if account is not yet activated
			} else {
				user.resettoken = jwt.sign({ username: user.username, email: user.email }, secret, { expiresIn: '24h' }); // Create a token for activating account through e-mail
				// Save token to user in database
				user.save(function(err) {
					if (err) {
						res.json({ success: false, message: err }); // Return error if cannot connect
					} else {
						// Create e-mail object to send to user
						var email = {
							from: 'Localhost Staff, staff@localhost.com',
							to: user.email,
							subject: 'Localhost Reset Password Request',
							text: 'Hello ' + user.name + ', You recently request a password reset link. Please click on the link below to reset your password:<br><br><a href="http://localhost:8080/reset/' + user.resettoken,
							html: 'Hello<strong> ' + user.name + '</strong>,<br><br>You recently request a password reset link. Please click on the link below to reset your password:<br><br><a href="http://localhost:8080/reset/' + user.resettoken + '">http://localhost:8080/reset/</a>'
						};
						// Function to send e-mail to the user
						client.sendMail(email, function(err, info) {
							if (err) console.log(err); // If error with sending e-mail, log to console/terminal
						});
						res.json({ success: true, message: 'Please check your e-mail for password reset link' }); // Return success message
					}
				});
			}
		});
	});

	// Route to verify user's e-mail activation link
	router.get('/resetpassword/:token', function(req, res) {
		User.findOne({ resettoken: req.params.token }).select().exec(function(err, user) {
			if (err) throw err; // Throw err if cannot connect
			var token = req.params.token; // Save user's token from parameters to variable
			// Function to verify token
			jwt.verify(token, secret, function(err, decoded) {
				if (err) {
					res.json({ success: false, message: 'Password link has expired' }); // Token has expired or is invalid
				} else {
					if (!user) {
						res.json({ success: false, message: 'Password link has expired' }); // Token is valid but not no user has that token anymore
					} else {
						res.json({ success: true, user: user }); // Return user object to controller
					}
				}
			});
		});
	});

	// Save user's new password to database
	router.put('/savepassword', function(req, res) {
		User.findOne({ username: req.body.username }).select('username email name password resettoken').exec(function(err, user) {
			if (err) throw err; // Throw error if cannot connect
			if (req.body.password == null || req.body.password == '') {
				res.json({ success: false, message: 'Password not provided' });
			} else {
				user.password = req.body.password; // Save user's new password to the user object
				user.resettoken = false; // Clear user's resettoken 
				// Save user's new data
				user.save(function(err) {
					if (err) {
						res.json({ success: false, message: err });
					} else {
						// Create e-mail object to send to user
						var email = {
							from: 'Localhost Staff, staff@localhost.com',
							to: user.email,
							subject: 'Localhost Reset Password',
							text: 'Hello ' + user.name + ', This e-mail is to notify you that your password was recently reset at localhost.com',
							html: 'Hello<strong> ' + user.name + '</strong>,<br><br>This e-mail is to notify you that your password was recently reset at localhost.com'
						};
						// Function to send e-mail to the user
						client.sendMail(email, function(err, info) {
							if (err) console.log(err); // If error with sending e-mail, log to console/terminal
						});
						res.json({ success: true, message: 'Password has been reset!' }); // Return success message
					}
				});
			}
		});
	});

	// Middleware for Routes that checks for token - Place all routes after this route that require the user to already be logged in
	router.use(function(req, res, next) {
		var token = req.body.token || req.body.query || req.headers['x-access-token']; // Check for token in body, URL, or headers

		// Check if token is valid and not expired	
		if (token) {
			// Function to verify token
			jwt.verify(token, secret, function(err, decoded) {
				if (err) {
					res.json({ success: false, message: 'Token invalid' }); // Token has expired or is invalid
				} else {
					req.decoded = decoded; // Assign to req. variable to be able to use it in next() route ('/me' route)
					next(); // Required to leave middleware
				}
			});
		} else {
			res.json({ success: false, message: 'No token provided' }); // Return error if no token was provided in the request
		}
	});



	return router; // Return the router object to server
}