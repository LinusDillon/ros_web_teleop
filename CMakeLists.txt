cmake_minimum_required(VERSION 2.8.3)
project(ros_web_teleop)

find_package(catkin REQUIRED)

###################################
## catkin specific configuration ##
###################################
catkin_package()

#############
## Install ##
#############

install(PROGRAMS
   scripts/ros_web_teleop.js
   DESTINATION ${CATKIN_PACKAGE_BIN_DESTINATION}
)


install(PROGRAMS
   scripts/www/index.html
   DESTINATION ${CATKIN_PACKAGE_BIN_DESTINATION}/www
)

#add_executable(${PROJECT_NAME} scripts/ros_web_teleop.js)

