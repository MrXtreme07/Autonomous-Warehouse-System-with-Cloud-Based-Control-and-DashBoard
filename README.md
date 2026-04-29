# Autonomous-Warehouse-System-with-Cloud-Based-Control-and-DashBoard

---

### Go inside Directory
```
cd src/warehouse
```
---

### Run Simulation
```
ign gazebo RaspRover.sdf
```
---

### Bridge `/cmd_vel`
```
ros2 run ros_gz_bridge parameter_bridge \
/cmd_vel@geometry_msgs/msg/Twist@gz.msgs.Twist
```
---

### Keyboard Teleop
```
ros2 run teleop_twist_keyboard teleop_twist_keyboard

Controls:
W → forward
S → backward
A → left
D → right
```