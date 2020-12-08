# leo_ui

The repository contains User Interface as the default available on LeoOS.

The main functionalities include:
- steering the robot
- streaming the camera image
- reading battery voltage
- rebooting and shutting down
- setting position on the servos connected to [hServo] ports

### User Interface Communication

Comunnication betwen UI and ROS layer is provided by WebSockets. The UI uses JavaScript library called [roslibjs] to establish connection with [rosbridge] and provides publishing, subscribing, service calls and other essential ROS functionality.

Camera real-time view build-in UI is available through the web_video_server running as the default on LeoOS. The [web video server] package transform ROS image topic that can be accessed via HTTP.

![alt text][architecture]

### LeoOS default setup

As a default UI is hosted by the 'nginx' server installed on LeoRovers. To open UI use any Web browser and type your Rover IP address. In the case of connecting directly to the access point, the IP address is '10.0.0.1'

### UI development

The User Interface folder in LeoOS file system is placed in '/opt/leo_ui' folder. If you would like to make some changes to the default UI you can edit files directly in that folder.

#### Before editing the UI code, read about ;-)
- [Bootstrap]
- [roslibjs]

[architecture]: docs/architecture.png 

[hServo]: https://app.gitbook.com/@leorover/s/leorover/integrations/digital-servos-up-to-3

[roslibjs]: http://wiki.ros.org/roslibjs

[rosbridge]: http://wiki.ros.org/rosbridge_suite

[web video server]: http://wiki.ros.org/web_video_server

[Bootstrap]: https://getbootstrap.com/docs/5.0/getting-started/introduction/