var twist;
var manager;
var ros;
var batteryClient;
var cmdVelPub;
var servoPub1;
var servoPub2;
var servoPub3;
var servoVal1;
var servoVal2;
var servoVal3;
var twistIntervalID;
var servoIntervalID;
var robot_hostname;
var batterySub;

function initROS() {

    robot_hostname = location.hostname;
    //robot_hostname="host_IP";

    ros = new ROSLIB.Ros({
        url: "ws://" + robot_hostname + ":9090"
    });


    // Init message with zero values.
    twist = new ROSLIB.Message({
        linear: {
            x: 0,
            y: 0,
            z: 0
        },
        angular: {
            x: 0,
            y: 0,
            z: 0
        }
    });

    cmdVelPub = new ROSLIB.Topic({
        ros: ros,
        name: '/cmd_vel',
        messageType: 'geometry_msgs/Twist'
    });

    cmdVelPub.advertise();

    servoPub1 = new ROSLIB.Topic({
        ros: ros,
        name: '/servo1/angle',
        messageType: 'std_msgs/Int16'
    });

    servoPub2 = new ROSLIB.Topic({
        ros: ros,
        name: '/servo2/angle',
        messageType: 'std_msgs/Int16'
    });

    servoPub3 = new ROSLIB.Topic({
        ros: ros,
        name: '/servo3/angle',
        messageType: 'std_msgs/Int16'
    });

    servoPub1.advertise();
    servoPub2.advertise();
    servoPub3.advertise();

    systemRebootPub = new ROSLIB.Topic({
        ros: ros,
        name: '/system/reboot',
        messageType: 'std_msgs/Empty'
    });
    systemRebootPub.advertise();

    systemShutdownPub = new ROSLIB.Topic({
        ros: ros,
        name: '/system/shutdown',
        messageType: 'std_msgs/Empty'
    });
    systemShutdownPub.advertise();

    batterySub = new ROSLIB.Topic({
        ros : ros,
        name : '/battery',
        messageType : 'std_msgs/Float32'
    });

}

  
function initSliders() {

    $('#s1-slider').slider({
        tooltip: 'show',
         min: -90,
        max: 90,
        step: 1,
        value: 0
    });
    $('#s1-slider').on("slide", function(slideEvt) {
        servoVal1 = slideEvt.value;
    });

    $('#s2-slider').slider({
        tooltip: 'show',
        min: -90,
        max: 90,
        step: 1,
        value: 0
    });
    $('#s2-slider').on("slide", function(slideEvt) {
        servoVal2 = slideEvt.value;
    });

    $('#s3-slider').slider({
        tooltip: 'show',
        min: -90,
        max: 90,
        step: 1,
        value: 0
    });
    $('#s3-slider').on("slide", function(slideEvt) {
        servoVal3 = slideEvt.value;
    });
}



function createJoystick() {

    if (1 == 1) {
        joystickContainer = document.getElementById('joystick');

        manager = nipplejs.create({
            zone: joystickContainer,
            position: { left: 65 + '%', top: 50 + '%' },
            mode: 'static',
            size: 200,
            color: '#ffffff',
            restJoystick: true
        });

        manager.on('move', function (evt, nipple) {

            var lin = Math.sin(nipple.angle.radian) * nipple.distance * 0.01;
            var ang = -Math.cos(nipple.angle.radian) * nipple.distance * 0.01;

            twist.linear.x = lin * 0.5;
            twist.angular.z = ang * 1;
        });

        manager.on('end', function () {
            twist.linear.x = 0
            twist.angular.z = 0
        });
    }
}

function initTeleopKeyboard() {
    var body = document.getElementsByTagName('body')[0];
    body.addEventListener('keydown', function(e) {
        switch(e.keyCode) {
            case 37: //left
                twist.angular.z = 0.5;
                break;
            case 39: //right
                twist.angular.z = -0.5;
                break;
            case 38: ///up
                twist.linear.x = 0.4;
                break;
            case 40: //down
                twist.linear.x = -0.4;
        }
    });
    body.addEventListener('keyup', function(e) {
        switch(e.keyCode) {
            case 37: //left
            case 39: //right
                twist.angular.z = 0;
                break;
            case 38: ///up
            case 40: //down
                twist.linear.x = 0;
        }
    });
}


function subscribeBattery() {
    batterySub.subscribe(function(message) {
    console.log('Voltage: ' + message.data);
    document.getElementById('batteryID').innerHTML = 'Voltage: ' + message.data;
    });
}


function publishTwist() {
    cmdVelPub.publish(twist)
}

function publishServos() {
    servoMsg1 = new ROSLIB.Message({
        data: servoVal1
      
    });

    servoPub1.publish(servoMsg1);

    servoMsg2 = new ROSLIB.Message({
        data: servoVal2
      
    });

    servoPub2.publish(servoMsg2);

    servoMsg3 = new ROSLIB.Message({
        data: servoVal3
      
    });

    servoPub3.publish(servoMsg3);

  
}

function systemReboot(){
   
    systemRebootPub.publish()
    
}

function turnOff(){
    
    systemShutdownPub.publish()
    
}

function shutdown() {
    clearInterval(twistIntervalID);
    clearInterval(servoIntervalID);
    cmdVelPub.unadvertise();
    servoPub1.unadvertise();
    servoPub2.unadvertise();
    servoPub3.unadvertise();
    systemRebootPub.unadvertise();
    systemShutdownPub.unadvertise();
    batterySub.unsubscribe();
    ros.close();
}

window.onload = function () {

    initROS();
    initSliders();
    initTeleopKeyboard();
    createJoystick();

    video = document.getElementById('video');
    //USB_cam node
    //video.src = "http://" + robot_hostname + ":8080/stream?topic=/usb_cam/image_raw&type=ros_compressed&quality=80";
    video.src = "http://" + robot_hostname + ":8080/stream?topic=/raspicam_node/image&type=ros_compressed";
    console.log(robot_hostname);
    
    twistIntervalID = setInterval(() => publishTwist(), 50);

    servoIntervalID = setInterval(() => publishServos(), 50);

    batteryIntervalID = setInterval(() => subscribeBattery(), 100);

    window.addEventListener("beforeunload", () => shutdown());
}


