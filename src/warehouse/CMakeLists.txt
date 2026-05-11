cmake_minimum_required(VERSION 3.8)
project(warehouse)

find_package(ament_cmake REQUIRED)

install(
  DIRECTORY urdf meshes launch config
  DESTINATION share/${PROJECT_NAME}
)

install(
  FILES
    RaspRover.sdf
    myCobot_280_PI_230708.urdf
  DESTINATION share/${PROJECT_NAME}
)

ament_package()
