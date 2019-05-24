function servoHide() {
    var x = document.getElementById('servoB');
    if (x.style.display === "none") {
      x.style.display = 'block';
      document.getElementById('servoBtn').innerHTML = 'Hide servos';
    } else {
      x.style.display = 'none';
      document.getElementById('servoBtn').innerHTML = 'Show servos';
    }
  } 
