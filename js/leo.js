var twist;
var manager;
var ros;
var batterySub;
var batterySub1;
var cmdVelPub;
var twistIntervalID;
var robot_hostname;

var max_linear_speed = 0.5;
var max_angular_speed = 1.2;

var namespaceSub;
var robot_namespace;

function initROS() {

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
        name: 'cmd_vel',
        messageType: 'geometry_msgs/Twist',
        queue_size: 10
    });

    cmdVelPub.advertise();

    systemRebootPub = new ROSLIB.Topic({
        ros: ros,
        name: 'system/reboot',
        messageType: 'std_msgs/Empty'
    });
    systemRebootPub.advertise();

    systemShutdownPub = new ROSLIB.Topic({
        ros: ros,
        name: 'system/shutdown',
        messageType: 'std_msgs/Empty'
    });
    systemShutdownPub.advertise();

    batterySub = new ROSLIB.Topic({
        ros: ros,
        name: 'battery',
        messageType: 'std_msgs/Float32',
        queue_length: 1
    });
    batterySub.subscribe(batteryCallback);

    batterySub1 = new ROSLIB.Topic({
        ros: ros,
        name: 'firmware/battery',
        messageType: 'std_msgs/Float32',
        queue_length: 1
    });
    batterySub1.subscribe(batteryCallback);

    namespaceSub = new ROSLIB.Topic({
        ros: ros,
        name: 'robot_namespace',
        messageType: 'std_msgs/String',
        queue_length: 1
    });
    namespaceSub.subscribe(namespaceCallback);
}

function createJoystick() {

    joystickContainer = document.getElementById('joystick');

    manager = nipplejs.create({
        zone: joystickContainer,
        position: { left: 80 + '%', top: 40 + '%' },
        mode: 'static',
        size: 200,
        color: '#ffffff',
        restJoystick: true
    });

    manager.on('move', function (evt, nipple) {

        var lin = Math.sin(nipple.angle.radian) * nipple.distance * 0.01;
        var ang = -Math.cos(nipple.angle.radian) * nipple.distance * 0.01;

        twist.linear.x = lin * max_linear_speed;
        twist.angular.z = ang * max_angular_speed;
    });

    manager.on('end', function () {
        twist.linear.x = 0
        twist.angular.z = 0
    });
}

function initTeleopKeyboard() {
    const left_keys = ["ArrowLeft", "a", "A"];
    const right_keys = ["ArrowRight", "d", "D"];
    const up_keys = ["ArrowUp", "w", "W"];
    const down_keys = ["ArrowDown", "s", "S"];

    var body = document.getElementsByTagName('body')[0];
    body.addEventListener('keydown', function (e) {
        if (left_keys.includes(e.key))
            twist.angular.z = max_angular_speed;
        else if (right_keys.includes(e.key))
            twist.angular.z = -max_angular_speed;
        else if (up_keys.includes(e.key))
            twist.linear.x = max_linear_speed;
        else if (down_keys.includes(e.key))
            twist.linear.x = -max_linear_speed;
    });
    body.addEventListener('keyup', function (e) {
        if (left_keys.includes(e.key) || right_keys.includes(e.key))
            twist.angular.z = 0;
        else if (up_keys.includes(e.key) || down_keys.includes(e.key))
            twist.linear.x = 0;
    });
}

function batteryCallback(message) {
    document.getElementById('batteryID').innerHTML = 'Voltage: ' + message.data.toPrecision(4) + 'V';
}

function namespaceCallback(message) {
    robot_namespace = message.data;
    video.src = "http://" + robot_hostname + ":8080/stream?topic=" + robot_namespace + "camera/image_raw&type=ros_compressed";
}


function publishTwist() {
    cmdVelPub.publish(twist);
}

function systemReboot() {
    systemRebootPub.publish()
}

function turnOff() {
    systemShutdownPub.publish()
}

window.onblur = function () {
    twist.linear.x = 0;
    twist.angular.z = 0;
    publishTwist();
}

function shutdown() {
    clearInterval(twistIntervalID);
    cmdVelPub.unadvertise();
    systemRebootPub.unadvertise();
    systemShutdownPub.unadvertise();
    batterySub.unsubscribe();
    ros.close();
}

function defaultVideoSrc() {
    namespaceSub.unsubscribe();
    
    if(typeof robot_namespace == 'undefined') {
        console.log("Unable to get the robot namespace. Assuming it's '/'.");
        video.src = "http://" + robot_hostname + ":8080/stream?topic=/camera/image_raw&type=ros_compressed";
    }
}


window.onload = function () {

    robot_hostname = location.hostname;

    initROS();
    initTeleopKeyboard();
    createJoystick();

    video = document.getElementById('video');
    const timeout = setTimeout(defaultVideoSrc, 3000);

    twistIntervalID = setInterval(() => publishTwist(), 100); // 10 hz

    window.addEventListener("beforeunload", () => shutdown());
}


