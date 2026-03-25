(function () {
    var gamepadPollingIntervalID = null;
    var connectedGamepadIndex = null;
    var gamepadDeadzone = 0.12;
    var gamepadWasDriving = false;
    var listenersRegistered = false;

    function applyDeadzone(value, deadzone) {
        if (Math.abs(value) < deadzone) {
            return 0;
        }

        var sign = value < 0 ? -1 : 1;
        var scaled = (Math.abs(value) - deadzone) / (1 - deadzone);
        return sign * Math.min(Math.max(scaled, 0), 1);
    }

    function showGamepadNotification(message) {
        var notification = document.createElement('div');
        notification.className = 'gamepad-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(function () {
            notification.classList.add('show');
        }, 10);

        setTimeout(function () {
            notification.classList.remove('show');
            setTimeout(function () {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 250);
        }, 2500);
    }

    function getActiveGamepad() {
        if (connectedGamepadIndex == null) {
            return null;
        }

        var gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        return gamepads[connectedGamepadIndex] || null;
    }

    function updateTwistFromGamepad() {
        if (typeof twist === 'undefined' || !twist) {
            return;
        }

        var gamepad = getActiveGamepad();
        if (!gamepad) {
            return;
        }

        var rbPressed = gamepad.buttons && gamepad.buttons[5] && gamepad.buttons[5].pressed;
        var axisX = gamepad.axes && gamepad.axes.length > 0 ? applyDeadzone(gamepad.axes[0], gamepadDeadzone) : 0;
        var axisY = gamepad.axes && gamepad.axes.length > 1 ? applyDeadzone(gamepad.axes[1], gamepadDeadzone) : 0;

        if (rbPressed) {
            twist.linear.x = -axisY * maxLinearSpeed;
            twist.angular.z = -axisX * maxAngularSpeed;
            gamepadWasDriving = true;
        } else if (gamepadWasDriving) {
            twist.linear.x = 0;
            twist.angular.z = 0;
            gamepadWasDriving = false;
        }
    }

    function startGamepadPolling() {
        if (gamepadPollingIntervalID) {
            return;
        }

        gamepadPollingIntervalID = setInterval(updateTwistFromGamepad, 50);
    }

    function stopGamepadPolling() {
        if (!gamepadPollingIntervalID) {
            return;
        }

        clearInterval(gamepadPollingIntervalID);
        gamepadPollingIntervalID = null;
    }

    function onGamepadConnected(event) {
        connectedGamepadIndex = event.gamepad.index;
        gamepadWasDriving = false;
        startGamepadPolling();
        showGamepadNotification('Gamepad connected - hold RB and use left stick to drive');
    }

    function onGamepadDisconnected(event) {
        if (connectedGamepadIndex !== event.gamepad.index) {
            return;
        }

        connectedGamepadIndex = null;
        gamepadWasDriving = false;

        if (typeof twist !== 'undefined' && twist) {
            twist.linear.x = 0;
            twist.angular.z = 0;
        }

        stopGamepadPolling();
        showGamepadNotification('Gamepad disconnected');
    }

    function initGamepadControl() {
        if (!listenersRegistered) {
            window.addEventListener('gamepadconnected', onGamepadConnected);
            window.addEventListener('gamepaddisconnected', onGamepadDisconnected);
            listenersRegistered = true;
        }

        // Some browsers expose connected gamepads before firing events.
        var gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (var i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                connectedGamepadIndex = gamepads[i].index;
                startGamepadPolling();
                showGamepadNotification('Gamepad ready - hold RB and use left stick to drive');
                break;
            }
        }
    }

    function stopGamepadControl() {
        stopGamepadPolling();
        connectedGamepadIndex = null;
        gamepadWasDriving = false;

        if (listenersRegistered) {
            window.removeEventListener('gamepadconnected', onGamepadConnected);
            window.removeEventListener('gamepaddisconnected', onGamepadDisconnected);
            listenersRegistered = false;
        }
    }

    window.initGamepadControl = initGamepadControl;
    window.stopGamepadControl = stopGamepadControl;
})();
