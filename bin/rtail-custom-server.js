#!/usr/bin/env node

// ref: https://github.com/iruwl/rtail/blob/develop/cli/rtail-server.js

'use strict'

const dgram = require('dgram')
const app = require('express')()
const serve = require('express').static
const http = require('http').Server(app)
const io = require('socket.io')()
const yargs = require('yargs')
const debug = require('debug')('rtail:custom-server')

/*!
 * parsing argv
 */
let argv = yargs
    .usage('Usage: rtail-custom [OPTIONS]')
    .example('rtail-custom --web-port 8080', 'Use custom HTTP port')
    .example('rtail-custom --udp-port 8080', 'Use custom UDP port')
    .example('rtail-custom --web-version stable', 'Always uses latest stable webapp')
    .example('rtail-custom --web-version unstable', 'Always uses latest develop webapp')
    .example('rtail-custom --web-version 0.1.3', 'Use webapp v0.1.3')
    .option('udp-host', {
        alias: 'uh',
        default: '127.0.0.1',
        describe: 'The listening UDP hostname'
    })
    .option('udp-port', {
        alias: 'up',
        default: 9090,
        describe: 'The listening UDP port'
    })
    .option('web-host', {
        alias: 'wh',
        default: '127.0.0.1',
        describe: 'The listening HTTP hostname'
    })
    .option('web-port', {
        alias: 'wp',
        default: 8080,
        describe: 'The listening HTTP port'
    })
    .option('web-version', {
        type: 'string',
        describe: 'Define web app version to serve'
    })
    .help('help')
    .alias('help', 'h')
    .strict()
    .argv

/*!
 * UDP sockets setup
 */
let streams = {}
let socket = dgram.createSocket('udp4')
socket.on('message', function (data, remote) {
    debug('# On Message')
    console.log(`socket got message from ${remote.address}:${remote.port}`);

    // try to decode JSON
    try {
        data = JSON.parse(data)
    } catch (err) {
        debug('invalid data sent')
        return debug('invalid data sent')
    }
    debug('> On Message|Receive data')
    // console.log(data)

    if (!streams[data.id]) {
        streams[data.id] = []
        io.sockets.emit('streams', Object.keys(streams))
        debug('> On Message|Emit streams')
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

    debug('> On Message|Emit line')
    // console.log(msg)

    console.log()
})
socket.on('error', (err) => {
    console.log(`socket error:\n${err.stack}`);
    socket.close();
});
socket.on('listening', () => {
    const address = socket.address();
    console.log(`socket listening ${address.address}:${address.port}`);
});

/*!
 * socket.io
 */
io.on('connection', function (socket) {
    debug('# On Connection')
    socket.emit('streams', Object.keys(streams))
    debug('> On Connection|Emit streams')
    // console.log(Object.keys(streams))

    socket.on('select stream', function (stream) {
        debug('> On Connection|On Select Stream')
        if (!stream) {
            debug('No stream, return back')
            return
        }
        // console.log(stream)
        socket.leave(socket.rooms[0])
        socket.join(stream)

        socket.emit('backlog', streams[stream])
        debug('> On Connection|On Select Stream|Emit backlog')
        // console.log(streams[stream])

        console.log()
    })
})

/*!
 * serve static webapp from S3
 */
if (!argv.webVersion) {
    app.use(serve(__dirname + '/../dist'))
} else if ('development' === argv.webVersion) {
    app.use('/', serve(__dirname + '/../app'))
    app.use('/node_modules', serve(__dirname + '/../node_modules'))
    io.path('/socket.io')
}

/*!
 * listen!
 */
io.attach(http, { serveClient: false })
socket.bind(argv.udpPort, argv.udpHost)
http.listen(argv.webPort, argv.webHost)

debug('UDP  server listening: %s:%s', argv.udpHost, argv.udpPort)
debug('HTTP server listening: http://%s:%s', argv.webHost, argv.webPort)
