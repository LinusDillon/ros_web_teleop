#!/usr/bin/env node

/************************************************************************
 ROS Node for Web based Teleoperation
 * Uses Node.js
 * Runs as a ROS node
 * Hosts a simple Web UI page
************************************************************************/

/**
 * This example demonstrates simple sending of messages over the ROS system.
 */

// ROS requires
const rosnodejs = require('rosnodejs');
const std_msgs = rosnodejs.require('std_msgs').msg;

// Web server requires
var url = require('url');
var path = require('path');
var fs = require('fs');
var http = require('http');
var io = require('socket.io')(http);

// MJPEG Streamer requires
const {spawn} = require('child_process');

const videoStreamerCommand = 'mjpg_streamer';
const videoStreamerArguments = ['-o', 'output_http.so -p 8081', '-i', 'input_raspicam.so'];
const baseDirectory = __dirname + '/www';

var videoStreamerChild;

const cmdMsg = new std_msgs.Int16MultiArray();
var pub;

const range = 150;

/// Simple web server to host files under the wwww sub-folder
function httpHandler(request, response) {
    'use strict';
    console.log("Handler called");
    try {
        var requestUrl = url.parse(request.url);

        // need to use path.normalize so people can't access directories underneath baseDirectory
        var fsPath = baseDirectory + path.normalize(requestUrl.pathname);
        console.log("Path: " + fsPath);
        var fileStream = fs.createReadStream(fsPath);
        fileStream.pipe(response);
        fileStream.on('open', function () {
            response.writeHead(200);
        });
        fileStream.on('error', function () {
            response.writeHead(404);     // assume the file doesn't exist
            response.end();
        });
    } catch (e) {
        response.writeHead(500);
        response.end();     // end the response so browsers don't hang
        console.log(e.stack);
    }
}

function startRosNode() {
    'use strict';
    // Register node with ROS master
    rosnodejs.initNode('/ros_web_teleop')
        .then((rosNode) => {
          // Create ROS publisher on the 'chatter' topic with String message
            pub = rosNode.advertise('/cmd', std_msgs.Int16MultiArray, {latching: true, queueSize: 1});

            // const msg = new std_msgs.String();
            // // Define a function to execute every 100ms
            // setInterval(() => {
            //   // Construct the message
            //   msg.data = 'hello world ' + count;
            //   // Publish over ROS
            //   pub.publish(msg);
            //   // Log through stdout and /rosout
            //   rosnodejs.log.info('I said: [' + msg.data + ']');
            // }, 100);
        });
}

function sendRosCmdMessage(ml, mr) {
    'use strict';
    cmdMsg.data = [ml * range, mr * range, ml * range, mr * range];
    pub.publish(cmdMsg);
    rosnodejs.log.info('I said: [' + cmdMsg.data + ']');
}

function startMjpegStreamer() {
    'use strict';
    videoStreamerChild = spawn(videoStreamerCommand, videoStreamerArguments);
}

function moveHandler(movedirection) {
    'use strict';
    console.log(movedirection);

    switch (movedirection) {
    case "forward":
        sendRosCmdMessage(1, 1);
        break;
    case "backward":
        sendRosCmdMessage(-1, -1);
        break;
    case "left":
        sendRosCmdMessage(-1, 1);
        break;
    case "right":
        sendRosCmdMessage(1, -1);
        break;
    case "stop":
        sendRosCmdMessage(0, 0);
        break;
    case "capture":
        console.log("Capture");
        break;
    default:
        console.log("Unrecognised move data: '" + movedirection + "'");
    }
}

function socketIoHandler(socket) {
    'use strict';
    socket.on('move', moveHandler);
}

function startSocketIoListener() {
    'use strict';
    io.sockets.on('connection', socketIoHandler);
}

if (require.main === module) {
    http.createServer(httpHandler).listen(8080);
    startMjpegStreamer();
    startSocketIoListener();
    startRosNode();
}
