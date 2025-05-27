var twist;
var manager;
var ros;
var batterySub;
var batterySub1;
var cmdVelPub;
var twistIntervalID;
var robotHostname;

var maxLinearSpeed = 0.5;
var maxAngularSpeed = 1.2;

var namespaceSub;
var robotNamespace = null;

var publishersClient;
var topicsForTypeClient;

var select;

var intervalFlag = false;
var initROSinterval;

var selectedOption = null;

function initROS() {

    ros = new ROSLIB.Ros({
        url: "ws://" + robotHostname + ":9090"
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

    batterySub = new ROSLIB.Topic({
        ros: ros,
        name: 'battery',
        messageType: 'std_msgs/Float32',
        queue_length: 1
    });
    batterySub.subscribe(batteryCallback);

    batterySub1 = new ROSLIB.Topic({
        ros: ros,
        name: 'firmware/battery_averaged',
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

    publishersClient = new ROSLIB.Service({
        ros: ros,
        name: '/rosapi/publishers',
        serviceType: '/rosapi/Publishers'
    });

    topicsForTypeClient = new ROSLIB.Service({
        ros: ros,
        name: '/rosapi/topics_for_type',
        serviceType: '/rosapi/TopicsForType'
    });

    systemRebootService = new ROSLIB.Service({
        ros: ros,
        name: 'system/reboot',
        serviceType: 'std_srvs/Trigger'
    });

    systemShutdownService = new ROSLIB.Service({
        ros: ros,
        name: 'system/shutdown',
        serviceType: 'std_srvs/Trigger'
    });

    ros.on('connection', function () {
        console.log('Connected to websocket server.');

        if (intervalFlag) {
            clearInterval(initROSinterval)
            intervalFlag = false;
            resetVideoSrc();
        }

        // Refresh video topics now and every 5 seconds
        refreshVideoSelect();
        videoTopicsIntervalID = setInterval(refreshVideoSelect, 5000);

        if (selectedOption == null) {
            setTimeout(defaultVideoSrc, 2000);
        }
    });

    ros.on('error', function (error) {
        console.error('Error connecting to websocket server: ', error);
    });

    ros.on('close', function () {
        console.log('Connection to websocket server closed.');
        clearInterval(videoTopicsIntervalID);
        if (intervalFlag == false) {
            initROSinterval = setInterval(initROS, 5000);
            intervalFlag = true;
            select.innerHTML = '';
        }
    });
}

function createJoystick() {

    joystickContainer = document.getElementById('joystick');

    manager = nipplejs.create({
        zone: joystickContainer,
        position: { right: 100 + 'px', bottom: 100 + 'px' },
        mode: 'static',
        size: 150,
        color: '#ffffff',
        restJoystick: true
    });

    manager.on('move', function (evt, nipple) {

        var lin = Math.sin(nipple.angle.radian) * nipple.distance * 0.01;
        var ang = -Math.cos(nipple.angle.radian) * nipple.distance * 0.01;

        twist.linear.x = lin * maxLinearSpeed;
        twist.angular.z = ang * maxAngularSpeed;
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
            twist.angular.z = maxAngularSpeed;
        else if (right_keys.includes(e.key))
            twist.angular.z = -maxAngularSpeed;
        else if (up_keys.includes(e.key))
            twist.linear.x = maxLinearSpeed;
        else if (down_keys.includes(e.key))
            twist.linear.x = -maxLinearSpeed;
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
    robotNamespace = message.data;

    if (selectedOption == null) {
        setSelectedVideoSrc(robotNamespace + "camera/image_color");
        selectCorrectOption();
    }
}

function defaultVideoSrc() {
    if (robotNamespace == null) {
        console.log("Unable to get the robot namespace. Assuming it's '/'.");
        setSelectedVideoSrc("/camera/image_color");
        selectCorrectOption();
    }
}

function setSelectedVideoSrc(option) {
    selectedOption = option;
    if (option == "None") {
        video.src = "";
    } else {
        video.src = "http://" + robotHostname + ":8080/stream?topic=" + option + "&type=ros_compressed";
    }
}

function publishTwist() {
    cmdVelPub.publish(twist);
}

function systemReboot() {
    systemRebootService.callService(new ROSLIB.ServiceRequest(),
        function (result) {
            if (result.success) {
                console.log(result.message);
            } else {
                console.error("Failed to request system reboot: " + result.message);
            }
        }
    );
}

function systemShutdown() {
    systemShutdownService.callService(new ROSLIB.ServiceRequest(),
        function (result) {
            if (result.success) {
                console.log(result.message);
            } else {
                console.error("Failed to request system shutdown: " + result.message);
            }
        }
    );
}

window.onblur = function () {
    twist.linear.x = 0;
    twist.angular.z = 0;
    publishTwist();
}

function shutdown() {
    clearInterval(twistIntervalID);
    clearInterval(videoTopicsIntervalID);
    cmdVelPub.unadvertise();
    batterySub.unsubscribe();
    ros.close();
}

function createEmptySelectElement() {
    var tempSelect = document.createElement('select');
    var empty_opt = document.createElement('option');
    empty_opt.innerHTML = "None";
    tempSelect.appendChild(empty_opt);
    return tempSelect;
}

function buildSortedSelect(finalOptions) {
    var tempSelect = document.createElement('select');
    for (var j = 0; j < finalOptions.length; j++) {
        var opt = document.createElement('option');
        opt.innerHTML = finalOptions[j];
        tempSelect.appendChild(opt);
    }
    return tempSelect;
}

function checkTopicPublishers(topicName, tempOptions, pendingRequests, callback) {
    var request = new ROSLIB.ServiceRequest({ topic: topicName });
    publishersClient.callService(request, function (result) {
        var publishers = result.publishers;

        if (publishers.length != 0 && topicName.endsWith("/compressed")) {
            var name = topicName.slice(0, -11);
            if (!tempOptions.includes(name)) {
                tempOptions.push(name);
            }
        }

        pendingRequests.count--;
        if (pendingRequests.count === 0) {
            callback(tempOptions);
        }
    });
}

function updateSelectOptions(tempOptions) {
    // Sort options (except "None" which stays first)
    var sortedOptions = tempOptions.slice(1).sort();
    var finalOptions = ["None"].concat(sortedOptions);

    // Rebuild select with sorted options
    var tempSelect = buildSortedSelect(finalOptions);

    // Replace current options atomically when all requests complete
    select.innerHTML = tempSelect.innerHTML;
    selectCorrectOption();
}

function refreshVideoSelect() {
    var tempOptions = ["None"];

    var request = new ROSLIB.ServiceRequest({ type: "sensor_msgs/msg/CompressedImage" });
    topicsForTypeClient.callService(request, function (result) {
        var topics = result.topics;
        var pendingRequests = { count: topics.length };

        if (pendingRequests.count === 0) {
            // Replace current options atomically
            var tempSelect = createEmptySelectElement();
            select.innerHTML = tempSelect.innerHTML;
            selectCorrectOption();
            return;
        }

        for (var i = 0; i < topics.length; i++) {
            (function (topicName) {
                checkTopicPublishers(topicName, tempOptions, pendingRequests, updateSelectOptions);
            })(topics[i]);
        }
    });
}

function selectOnChangeCallback() {
    setSelectedVideoSrc(select.options[select.selectedIndex].text);
}

function selectCorrectOption() {
    if (selectedOption == null) {
        return;
    }

    for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].text == selectedOption) {
            select.selectedIndex = i;
            break;
        }
    }
}

function imgWidth() {
    var element = document.getElementById("video");
    element.classList.toggle("center-fit-full")
}

function resetVideoSrc() {
    // Reset the video source to force reload
    video.src = ""
    if (selectedOption != "None") {
        video.src = "http://" + robotHostname + ":8080/stream?topic=" + selectedOption + "&type=ros_compressed";
    }
}

window.onload = function () {

    robotHostname = location.hostname;

    video = document.getElementById('video');
    select = document.getElementById('camera-select');

    initROS();
    initTeleopKeyboard();
    createJoystick();

    twistIntervalID = setInterval(() => publishTwist(), 100); // 10 hz

    window.addEventListener("beforeunload", () => shutdown());
}


