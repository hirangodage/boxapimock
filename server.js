//Install express server
const express = require('express');
const fs = require('fs');
const _ = require('lodash');
const bodyParser = require('body-parser')
const app = express();
const path = require('path');
const jwt = require('jsonwebtoken')
var cors = require('cors')
const jsonServer = require('json-server')
const server = jsonServer.create()
const port = 8080

const obj = {}
const files = fs.readdirSync(path.resolve(__dirname, './data/'))

files.forEach((file) => {
	if (file.indexOf('.json') > -1) {
		_.extend(obj, require(path.resolve(__dirname, './data/', file)))
	}
})
app.use(cors())
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
  });
const router = jsonServer.router(obj)

const userdb = JSON.parse(fs.readFileSync('./data/users.json', 'UTF-8'))

const middlewares = jsonServer.defaults()

server.use(middlewares)

server.use(jsonServer.bodyParser);
server.use(bodyParser.urlencoded({extended: true}))

const SECRET_KEY = '123456789'
const expiresIn = '1h'

// Create a token from a payload 
function createToken(payload) {
	return jwt.sign(payload, SECRET_KEY, { expiresIn })
}

// Verify the token 
function verifyToken(token) {
	return jwt.verify(token, SECRET_KEY, (err, decode) => decode !== undefined ? decode : err)
}

// Check if the user exists in database
function isAuthenticated({ username, password }) {
	return userdb.users.findIndex(user => user.username === username) !== -1
}


server.post('/auth/login', (req, res) => {
	console.log(req.body);
	const { username, password } = req.body
	if (isAuthenticated({ username, password }) === false) {
		const status = 401
		const message = 'Incorrect username or password'
		res.status(status).json({ status, message })
		return
	}
	const token = createToken({ username, password })
	const user= userdb.users.find(user => user.username === username);
	res.status(200).json({ ...user ,token })
})


server.use(/^(?!\/auth).*$/, (req, res, next) => {
	if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
		const status = 401
		const message = 'Bad authorization header'
		res.status(status).json({ status, message })
		return
	}
	try {
		verifyToken(req.headers.authorization.split(' ')[1])
		next()
	} catch (err) {
		const status = 401
		const message = 'Error: access_token is not valid'
		res.status(status).json({ status, message })
	}
})


server.use(router)
server.listen(port, () => {
	console.log('http://localhost:9000 Running...');
})
