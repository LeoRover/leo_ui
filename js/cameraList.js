var select;

function createOptions() {
    if(select.childElementCount == 0) {
        for(var i = 0; i < cameraTopics.length; i++) {
            var opt = document.createElement('option');
            opt.innerHTML = cameraTopics[i];
            select.appendChild(opt);
        }
    }
}

function test() {
    select = document.getElementById('camera-select');
    console.log(select);
    console.log(select.childElementCount);
    const timeout = setTimeout(createOptions, 3000);
}