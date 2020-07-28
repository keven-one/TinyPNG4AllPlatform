const BrowserWindow = require('electron').remote.BrowserWindow
const settingBtn = document.querySelector('#setting')
window.onload = function () {
    settingBtn.onclick = function (e) {
        if (BrowserWindow.getFocusedWindow().getSize()[1] === 500) {
            BrowserWindow.getFocusedWindow().setSize(400, 400, false)
        } else {
            BrowserWindow.getFocusedWindow().setSize(400, 500, false)
        }
    }

}




