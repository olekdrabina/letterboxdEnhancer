import {defaults} from "./defaults.js"

function updateIcon(isEnabled) {
    const path = isEnabled ? "assets/logo/16.png" : "assets/logo/16_off.png"
    chrome.action.setIcon({ path: path })
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(null, (existing) => {
        const toSet = {}
        for (const [key, value] of Object.entries(defaults)) {
            if (existing[key] == undefined) {
                toSet[key] = value
            }
        }
        if (Object.keys(toSet).length > 0) {
            chrome.storage.local.set(toSet)
        }
        const state = existing.extensionState ?? defaults.extensionState
        updateIcon(state)
    })
})

chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get("extensionState", (data) => {
        const state = data.extensionState ?? defaults.extensionState
        updateIcon(state)
    })
})

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace == "local" && changes.extensionState) {
        updateIcon(changes.extensionState.newValue)
    }
})