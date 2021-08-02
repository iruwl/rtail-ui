// ref: https://github.com/iruwl/rtail/blob/develop/app/app.ejs

// (function () {
//     console.log("I am here")
//     param = 'irul @20210801'
//     console.log(param)
// })();

var lines = []
var streams = []
var activeStream = ''
var pauseScroll = false
var lastScrollTop = 0
var BUFFER_SIZE = 100

console.log('origin: ' + document.location.origin)
console.log('pathname: ' + document.location.pathname)
// const socket = io();
const socket = io(document.location.origin, { path: document.location.pathname + 'socket.io' })

socket.on('connect', function () {
    console.info('connected')
    activeStream = getActiveStream()
    console.log('on connect|emit select stream: ' + activeStream)
    activeStream && socket.emit('select stream', activeStream)
})

socket.on('disconnect', function (err) {
    console.warn('disconnected: %s', err)
})

socket.on('streams', function (msg) {
    console.info('on streams')
    console.log(msg)
    streams = msg
    if (streams.length === 0) {
        activeStream = setActiveStream('')
        clearStreams(docStreamList)
        clearLines(docStreamLines)
    }
    activeStream = getActiveStream()
    if (!activeStream && streams.length === 1) {
        activeStream = streams[0]
        setActiveStream(activeStream)
        console.log('on stream|emit select stream: ' + activeStream)
        socket.emit('select stream', activeStream)
    }
    console.log('activeStream: ' + activeStream)
    renderStreams()
})

socket.on('line', function (msg) {
    console.info('on line')
    if (!msg) {
        console.warn('> no line, return back')
        return
    }
    // console.log(msg)
    // ctrl.lines.push(formatLine(line))
    // if (ctrl.lines.length > BUFFER_SIZE) {
    //     ctrl.lines.length >= 100 && ctrl.lines.shift()
    // }
    // document.write(formatLine(line))
    if (!activeStream || msg.streamid === activeStream) {
        addLine(formatLine(msg))
    }
})

socket.on('backlog', function (msg) {
    console.info('on backlog')
    if (!msg) {
        console.warn('> no msg, return back')
        return
    }
    console.log(msg)
    lines = msg.map(formatLine)
    renderLines()
})

function getActiveStream() {
    console.log('get active stream')
    // if (localStorage.getItem('activeStream') === null) {
    //     localStorage.setItem('activeStream', '')
    // }
    return localStorage.getItem('activeStream')
}

function setActiveStream(msg) {
    console.log('set active stream to:' + msg)
    localStorage.setItem('activeStream', msg)
    return getActiveStream()
}

function formatLine(line) {
    if (!line.content) return ''
    // console.log(line.content)

    try {
        JSON.parse(line.content)
        line.type = 'object'
    } catch (err) {
        // console.warn('not an object')
    }

    var lineContent = ''
    if ('object' === line.type) {
        lineContent = JSON.stringify(line.content, null, '  ')
    } else {
        lineContent = escapeHtml(line.content)
    }
    return lineContent
}

// https://github.com/component/escape-html/blob/master/index.js#L22
function escapeHtml(html) {
    return String(html)
    // return String(html)
    //     .replace(/&/g, '&amp;')
    //     .replace(/"/g, '&quot;')
    //     .replace(/'/g, '&#39;')
    //     .replace(/</g, '&lt;')
    //     .replace(/>/g, '&gt;');
}

// == UI =======================================================================

const docStreamLines = document.querySelector('[data-stream-lines]')
const docScrollable = document.querySelector('[data-scrollable]')
const docStreamList = document.querySelector('[data-stream-list]')
const docStreamTabs = document.querySelector('[data-stream-tabs]')

docStreamList.addEventListener("click", function (e) {
    let targetStream = e.target.dataset.id
    // console.log('target stream ' + targetStream)
    activeStream = setActiveStream(targetStream)
    socket.emit('select stream', activeStream)
})

docScrollable.addEventListener("scroll", function () {
    // Credits: "https://github.com/qeremy/so/blob/master/so.dom.js#L426"
    var st = docScrollable.pageYOffset || docScrollable.scrollTop;
    if (st > lastScrollTop) {
        // console.log('scroll down')
    } else {
        // console.log('scroll up')
        pauseAutoScrolling(true)
    }
    lastScrollTop = st <= 0 ? 0 : st; // For Mobile or negative scrolling

    if (docScrollable.scrollTop ===
        (docScrollable.scrollHeight - docScrollable.offsetHeight)) {
        // console.log('At the bottom');
        pauseAutoScrolling(false)
    }
}, false);

function pauseAutoScrolling(val) {
    pauseScroll = val
    // console.info('pause auto scrolling ' + val)
}

function renderStreams() {
    console.log('rendering streams...')
    clearStreams(docStreamList)
    streams.forEach(stream => {
        // <a class="list-group-item list-group-item-action active" data-bs-toggle="list" href="#home" role="tab" data-id="home">Home</a>
        const streamElement = document.createElement('a')
        streamElement.classList.add('list-group-item')
        streamElement.classList.add('list-group-item-action')
        if (activeStream && stream === activeStream) {
            streamElement.classList.add('active')
        }
        // streamElement.setAttribute('role', "tab")
        // streamElement.setAttribute('href', "#" + stream)
        streamElement.setAttribute('data-bs-toggle', "list")
        streamElement.setAttribute('data-id', stream)
        streamElement.innerText = stream
        docStreamList.appendChild(streamElement)
    })
}

function clearStreams(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild)
    }
}

function renderLines() {
    console.log('rendering lines...')
    clearLines(docStreamLines)
    lines.forEach(line => {
        addLine(line)
    })
}

function clearLines(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild)
    }
}

function addLine(msg) {
    const lineElement = document.createElement('p')
    lineElement.classList.add('font-monospace')
    lineElement.classList.add('text-break')
    lineElement.style.fontSize = "0.8rem"
    lineElement.style.whiteSpace = "pre-wrap"
    lineElement.innerText = msg
    docStreamLines.appendChild(lineElement)
    // scroll
    !pauseScroll && docScrollable.scrollTo(0, docScrollable.scrollHeight);
}

renderStreams()
renderLines()
