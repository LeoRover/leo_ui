var select;
var video;
var robot_hostname;


function createOptions() {
    if(select.childElementCount == 0) {
        for(var i = 0; i < cameraTopics.length; i++) {
            var opt = document.createElement('option');
            opt.innerHTML = cameraTopics[i];
            select.appendChild(opt);
        }
    }
}

function changeVideoSrc() {
    var selected = select.selectedIndex;
    video.src = "http://" + robot_hostname + ":8080/stream?topic=" + cameraTopics[selected] + "camera/image_raw&type=ros_compressed";
}

function test() {
    robot_hostname = location.hostname;
    select = document.getElementById('camera-select');
    video = document.getElementById('video');
    console.log(select);
    console.log(select.childElementCount);
    const timeout = setTimeout(createOptions, 3000);
}