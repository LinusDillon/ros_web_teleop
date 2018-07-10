# ros_web_teleop

ROS node which provides a web page hosting video feed and controls for a simple rover.

Uses Node.js and mjpeg_streamer, the goal is for this to be able to be started with a single "rosrun" call, which kicks off the stream, hosts the web page, and handles the commands from the web page for driving.

Future plans include adding telemetry and log output, configuration for the available controls/commands issues (so it will be suitable for a wider variety of robots/tasks), and configuration for video stream.
