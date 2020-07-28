const BrowserWindow = require('electron').remote.BrowserWindow
const { dialog } = require('electron').remote

function settingClick(e) {
    if (BrowserWindow.getFocusedWindow().getSize()[1] === 500) {
        BrowserWindow.getFocusedWindow().setSize(400, 400, false)
    } else {
        BrowserWindow.getFocusedWindow().setSize(400, 500, false)
    }
}

function outputChange(event) {
    debugger
}

function selectfile() {
    dialog.showOpenDialog({
        filters: [
            { name: 'jpg', extensions: ['jpg'] },
            { name: 'png', extensions: ['png'] },
            { name: 'jpg', extensions: ['jpeg'] }
        ],
        properties: ['openDirectory'],
        title: 'select picture',
    }).then(res => {
        debugger
    })
}



