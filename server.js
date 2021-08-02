// ref: https://github.com/iruwl/rtail/blob/develop/cli/rtail-server.js

const dgram = require('dgram')
const app = require('express')()
const serve = require('express').static
const http = require('http').Server(app)
const io = require('socket.io')()
// const yargs = require('yargs')
const debug = require('debug')('rtail:server')
// const webapp = require('./lib/webapp')
// const updateNotifier = require('update-notifier')
// const pkg = require('../package')

const UDP_HOST = '127.0.0.1'
const UDP_PORT = 9090
const WEB_HOST = '127.0.0.1'
const WEB_PORT = 8080

/*!
 * inform the user of updates
 */
// ?

/*!
 * parsing argv
 */
// ?

/*!
 * UDP sockets setup
 */
let streams = {}
let socket = dgram.createSocket('udp4')
socket.on('message', function (data, remote) {
    console.log('# On Message')

    // try to decode JSON
    try {
        data = JSON.parse(data)
    } catch (err) {
        console.log('invalid data sent')
        return debug('invalid data sent')
    }
    console.log('> On Message|Receive data')
    // console.log(data)

    if (!streams[data.id]) {
        streams[data.id] = []
        io.sockets.emit('streams', Object.keys(streams))
        console.log('> On Message|Emit streams')
        // console.log(Object.keys(streams))
        console.log()
    }

    let msg = {
        timestamp: data.timestamp,
        streamid: data.id,
        host: remote.address,
        port: remote.port,
        content: data.content,
        type: typeof data.content
    }

    // limit backlog to 100 lines
    streams[data.id].length >= 100 && streams[data.id].shift()
    streams[data.id].push(msg)

    debug(JSON.stringify(msg))
    io.sockets.to(data.id).emit('line', msg)

    console.log('> On Message|Emit line')
    // console.log(msg)

    console.log()
})

/*!
 * socket.io
 */
io.on('connection', function (socket) {
    console.log('# On Connection')
    socket.emit('streams', Object.keys(streams))
    console.log('> On Connection|Emit streams')
    // console.log(Object.keys(streams))

    socket.on('select stream', function (stream) {
        console.log('> On Connection|On Select Stream')
        if (!stream) {
            console.log('No stream, return back')
            return
        }
        // console.log(stream)
        socket.leave(socket.rooms[0])
        socket.join(stream)

        socket.emit('backlog', streams[stream])
        console.log('> On Connection|On Select Stream|Emit backlog')
        // console.log(streams[stream])

        console.log()
    })
})

/*!
 * serve static webapp from S3
 */
// ?
// app.use('/', serve(__dirname + '/../public'))
// app.use('/node_modules', serve(__dirname + '/../node_modules'))
// io.path('/app/socket.io')
// app.use('/', serve(__dirname + '/../public'))
app.use(serve('public'))
app.use('/node_modules', serve(__dirname + '/node_modules'))

/*!
 * listen!
 */
io.attach(http, { serveClient: false })
socket.bind(UDP_PORT, UDP_HOST)
http.listen(WEB_PORT, WEB_HOST)

debug('UDP  server listening: %s:%s', UDP_HOST, UDP_PORT)
debug('HTTP server listening: http://%s:%s', WEB_HOST, WEB_PORT)
