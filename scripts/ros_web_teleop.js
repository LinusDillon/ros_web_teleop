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
const { spawn } = require('child_process');

const videoStreamerCommand = 'mjpg_streamer';
const videoStreamerArguments = ['-o', 'output_http.so -w ./www', '-i', 'input_raspicam.so'];
const baseDirectory = __dirname + '/www';

var videoStreamerChild;

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
        fileStream.on('error', function (e) {
            response.writeHead(404);     // assume the file doesn't exist
            response.end();
        })
  } catch (e) {
        response.writeHead(500);
        response.end();     // end the response so browsers don't hang
        console.log(e.stack);
  }
}

function rostalker() {
  'use strict';
  // Register node with ROS master
  rosnodejs.initNode('/talker_node')
    .then((rosNode) => {
      // Create ROS publisher on the 'chatter' topic with String message
      let pub = rosNode.advertise('/chatter', std_msgs.String);
      let count = 0;
      const msg = new std_msgs.String();
      // Define a function to execute every 100ms
      setInterval(() => {
        // Construct the message
        msg.data = 'hello world ' + count;
        // Publish over ROS
        pub.publish(msg);
        // Log through stdout and /rosout
        rosnodejs.log.info('I said: [' + msg.data + ']');
        ++count;
      }, 100);
    });
}

function spawnMjpegStreamer() {
    'use strict';
    videoStreamerChild = spawn(videoStreamerCommand, videoStreamerArguments);
}

if (require.main === module) {
    http.createServer(httpHandler).listen(8080);
    spawnMjpegStreamer();
    rostalker();
}
