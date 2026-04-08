function updateIcon(isEnabled) {
    const path = isEnabled ? "assets/logo/16.png" : "assets/logo/16_off.png"
    chrome.action.setIcon({path: path})
}

// check state when browser opens
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get("extensionState", (data) => {
        const state = data.extensionState != undefined ? data.extensionState : true
        updateIcon(state)
    })
})

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get("extensionState", (data) => {
        const state = data.extensionState != undefined ? data.extensionState : true
        updateIcon(state)
    })
})

// listen for changes in storage
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace == "local" && changes.extensionState) {
        updateIcon(changes.extensionState.newValue)
    }
})