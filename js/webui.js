var twist;
var speedLinear;
var speedAngular;
var manager;
var ros;
var firmwareVerClient;
var batteryClient;
var cmdVelPub;
var servoPub;
var servoAngles;
var stream;
var twistIntervalID;
var servoIntervalID;

function initROS() {

    var robot_hostname = window.location.hostname;

    ros = new ROSLIB.Ros({
        url: "ws://" + robot_hostname + ":9090"
    });

    firmwareVerClient = new ROSLIB.Service({
        ros: ros,
        name: '/tr_hat_bridge/get_firmware_ver',
        serviceType: 'tr_hat_msgs/GetFirmwareVer'
    });

    batteryClient = new ROSLIB.Service({
        ros: ros,
        name: '/tr_hat_bridge/get_battery',
        serviceType: 'tr_hat_msgs/GetBattery'
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

    servoPub = new ROSLIB.Topic({
        ros: ros,
        name: '/tr_hat_bridge/servo',
        messageType: 'tr_hat_msgs/ServoAngle'
    });

    servoPub.advertise();
}

function initTeleopKeyboard() {
    var body = document.getElementsByTagName('body')[0];
    body.addEventListener('keydown', function(e) {
        switch(e.keyCode) {
            case 65: //left
                twist.angular.z = speedAngular;
                break;
            case 68: //right
                twist.angular.z = -speedAngular;
                break;
            case 87: ///up
                twist.linear.x = speedLinear;
                break;
            case 83: //down
                twist.linear.x = -speedLinear;
        }
    });
    body.addEventListener('keyup', function(e) {
        switch(e.keyCode) {
            case 65: //left
            case 68: //right
                twist.angular.z = 0;
                break;
            case 87: ///up
            case 83: //down
                twist.linear.x = 0;
        }
    });
}

function createJoystick() {

    if (manager == null) {
        joystickContainer = document.getElementById('joystick');

        manager = nipplejs.create({
            zone: joystickContainer,
            position: { left: 50 + '%', top: 105 + 'px' },
            mode: 'static',
            size: 200,
            color: '#0066ff',
            restJoystick: true
        });

        manager.on('move', function (evt, nipple) {

            var lin = Math.sin(nipple.angle.radian) * nipple.distance * 0.01;
            var ang = -Math.cos(nipple.angle.radian) * nipple.distance * 0.01;

            twist.linear.x = lin * speedLinear;
            twist.angular.z = ang * speedAngular;
        });

        manager.on('end', function () {
            twist.linear.x = 0
            twist.angular.z = 0
        });
    }
}

function initSliders() {
    $('#lin-slider').slider({
        tooltip: 'show',
        min: 0,
        max: 0.36,
        step: 0.01,
        value: 0.2
    });
    $('#lin-slider').on("slide", function(slideEvt) {
        speedLinear = slideEvt.value;
        console.log(speedLinear);
    });
    speedLinear = 0.2

    $('#ang-slider').slider({
        tooltip: 'show',
        min: 0,
        max: 2.2,
        step: 0.1,
        value: 1.5
    });
    $('#ang-slider').on("slide", function(slideEvt) {
        speedAngular = slideEvt.value;
    });
    speedAngular = 1.5

    servoAngles = [90,90,90];

    $('#s1-slider').slider({
        tooltip: 'show',
        min: 0,
        max: 180,
        step: 1,
        value: 90
    });
    $('#s1-slider').on("slide", function(slideEvt) {
        servoAngles[0] = slideEvt.value;
    });

    $('#s2-slider').slider({
        tooltip: 'show',
        min: 0,
        max: 180,
        step: 1,
        value: 90
    });
    $('#s2-slider').on("slide", function(slideEvt) {
        servoAngles[1] = slideEvt.value;
    });

    $('#s3-slider').slider({
        tooltip: 'show',
        min: 0,
        max: 180,
        step: 1,
        value: 90
    });
    $('#s3-slider').on("slide", function(slideEvt) {
        servoAngles[2] = slideEvt.value;
    });
}


function publishTwist() {
    cmdVelPub.publish(twist)
}

function publishServos() {
    servoMsg = new ROSLIB.Message({
        channel: 1,
        angle: servoAngles[0]
    });

    servoPub.publish(servoMsg);

    servoMsg.channel = 2
    servoMsg.angle = servoAngles[1]

    servoPub.publish(servoMsg);

    servoMsg.channel = 3
    servoMsg.angle = servoAngles[2]

    servoPub.publish(servoMsg);
}

function shutdown() {
    clearInterval(twistIntervalID);
    clearInterval(servoIntervalID);
    cmdVelPub.unadvertise();
    servoPub.unadvertise();
    ros.close();
    stream.stop();
}

window.onload = function () {

    initROS();
    initSliders();
    initTeleopKeyboard();
    createJoystick();

    firmwareVerClient.callService(new ROSLIB.ServiceRequest(), function(result) {
        $('#firmware-ver').text(result.firmware_ver);
    });

    twistIntervalID = setInterval(() => publishTwist(), 50);

    servoIntervalID = setInterval(() => publishServos(), 50);

    setInterval(function() {
        batteryClient.callService(new ROSLIB.ServiceRequest(), function(result) {
            $('#battery-voltage').text(result.battery.toFixed(2).toString() + "V");
        });
    }, 1000);

    stream = new Stream();
    stream.start();

    window.addEventListener("beforeunload", () => shutdown());
}