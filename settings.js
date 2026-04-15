import {defaults} from "./defaults.js"

// chrome storage
async function saveSetting(key, value) {
    await chrome.storage.local.set({[key]: value})
}
async function loadSetting(key) {
    const result = await chrome.storage.local.get([key])
    return result[key] ?? defaults[key]
}

const settings = [
    {name: "<b>Extension Toggle</b>", key: "extensionState", special: "masterSwitch"},
    {content: "SHOW/HIDE STATISTICS"},
    {name: "Show/hide button", key: "showHideButton"},
    {name: "Show/hide button for unreleased", key: "showHideButtonUnreleased"},
    {name: "All below for unreleased", key: "hideUnreleased"},
    {name: "Hide rating", key: "hideRating"},
    {name: "Hide watches", key: "hideWatches"},
    {name: "Hide list", key: "hideListAppears"},
    {name: "Hide likes", key: "hideLikes"},
    {name: "Hide top500", key: "hideTop500"},
    {name: "Hide friends ratings", key: "hideFriendsRatings"},
    {name: "Hide friends reviews", key: "hideFriendsReviews"},
    {name: "Hide popular reviews", key: "hidePopularReviews"},
    {name: "Hide recent reviews", key: "hideRecentReviews"},
    {name: "Hide related films", key: "hideRelatedFilms"},
    {name: "Hide similar films", key: "hideSimilarFilms"},
    {name: "Hide popular lists", key: "hidePopularLists"},
    {name: "Hide your lists", key: "hideYourLists"},
    {name: "Hide lists you liked", key: "hideListsYouLiked"},
    {content: "FILM PAGE"},
    {name: "Line break after film title", key: "filmTitleBr"},
    {name: "Release date on year hover", key: "yearHoverReleaseDate"},
    {name: "Mpa rating", key: "mpaRating"},
    {name: "Wide release date in releases", key: "wideReleaseDate"},
    {name: "Box office in details", key: "boxOffice"},
    {name: "Budget in details", key: "budget"},
    {name: "Friendly runtime", key: "friendlyRuntime"},
    {name: "Wiki button at more at", key: "wikiButton"},
    {name: "Mojo button at more at", key: "mojoButton"},
    {name: "Hide \"where to watch\" when not streaming", key: "hideJustWatch"},
    {name: "Hide news", key: "hideNews"},
    {name: "Hide \"Mentioned By\"", key: "hideMentionedBy"},
    {content: "HOME PAGE"},
    {name: "Hide ratings from popular reviews", key: "hidePopularReviewsHome"},
    {content: "FILMS PAGE"},
    {name: "Hide watches from popular films", key: "hidePopularFilmsWatchesFilms"},
    {name: "Hide list appears from popular films", key: "hidePopularFilmsListsFilms"},
    {name: "Hide likes from popular films", key: "hidePopularFilmsLikesFilms"},
    {name: "Hide top500 from popular films", key: "hidePopularFilmsTop500Films"},
    {name: "Hide ratings from popular reviews", key: "hidePopularReviewsFilms"},
    {content: "OTHER"},
    {name: "Ad block", key: "adblock"},
    {name: "Review formatting buttons", key: "reviewFormattingButtons"},
    {name: "Review formatting shortcuts", key: "reviewFormattingShortcuts"},
    {name: "Wider reviews page", key: "reviewsPageWider"},
    {name: "Wider network page", key: "networkPageWider"},
    {name: "Darkmode search bars", key: "darkmodeSearchBars"},
    {content: " "}
]

function isExtensionOn(extensionState) {
    document.querySelectorAll(".switch").forEach((switchDiv, index) => {
        if (index == 0) return
        const switchDot = switchDiv.querySelector(".switchDot")
        if (!extensionState) {
            switchDot.style.backgroundColor = "#667788"
            switchDot.style.marginLeft = "2px"
        } else {
            switchDot.style.backgroundColor = ""
            switchDot.style.marginLeft = ""
        }
    })
}

// main function
async function init() {
    let extensionState = await loadSetting("extensionState", true)
    const iconPath = extensionState ? "assets/logo/16.png" : "assets/logo/16_off.png"
    chrome.action.setIcon({ path: iconPath })

    const settingsContainer = document.querySelector(".settings")
    for (const setting of settings) {
        if (!setting.content) {
            let settingDiv = document.createElement("div")
            settingDiv.className = "setting"

            let switchDiv = document.createElement("div")
            switchDiv.className = "switch"
            switchDiv.dataset.key = setting.key
            let switchBackground = document.createElement("div")
            switchBackground.className = "switchBackground"
            switchDiv.appendChild(switchBackground)
            let switchDot = document.createElement("div")
            switchDot.className = "switchDot"
            switchBackground.appendChild(switchDot)

            let nameDiv = document.createElement("p")
            nameDiv.className = "name"
            nameDiv.innerHTML = setting.name
            
            settingDiv.appendChild(switchDiv)
            settingDiv.appendChild(nameDiv)
            settingsContainer.appendChild(settingDiv)

            let switchState = await loadSetting(setting.key, setting.state)

            if (setting.special != "masterSwitch") {
                function checkSwitchState() {
                    if (switchState) {
                        switchDot.classList.add("on")
                        switchDot.classList.remove("off")
                    } else {
                        switchDot.classList.add("off")
                        switchDot.classList.remove("on")
                    }
                }
                checkSwitchState()

                switchBackground.addEventListener("click", async () => {
                    const currentExtensionState = await loadSetting("extensionState", true)
                    if (!currentExtensionState) return

                    switchState = !switchState
                    await saveSetting(setting.key, switchState)
                    checkSwitchState()
                })
            } else {
                settingDiv.style.justifyContent = "center"
                switchBackground.style.cursor = "pointer"
                function checkMasterSwitchState() {
                    if (extensionState) {
                        switchDot.classList.add("on")
                        switchDot.classList.remove("off")
                        switchDot.style.backgroundColor = "#40bcf4"
                        if(document.querySelector(".logo")) document.querySelector(".logo").src = "assets/logo/128.png"
                        chrome.action.setIcon({path: "assets/logo/16.png"})
                    } else {
                        switchDot.classList.add("off")
                        switchDot.classList.remove("on")
                        switchDot.style.backgroundColor = "#ff8000"
                        if(document.querySelector(".logo")) document.querySelector(".logo").src = "assets/logo/128_off.png"
                        chrome.action.setIcon({path: "assets/logo/16_off.png"})
                    }
                }
                checkMasterSwitchState()

                switchBackground.addEventListener("click", async () => {
                    extensionState = !extensionState
                    await saveSetting("extensionState", extensionState)
                    checkMasterSwitchState()
                    isExtensionOn(extensionState)
                })
            }
        } else if (setting.content) {
            const hrLabel = document.createElement("p")
            hrLabel.className = "hrLabel"
            hrLabel.innerHTML = setting.content
            const hrStructure = document.createElement("hr")

            settingsContainer.appendChild(hrLabel)
            settingsContainer.appendChild(hrStructure)
        }
    }
    isExtensionOn(extensionState)
}
init()

// buttons
document.querySelector(".restoreDefault").addEventListener("click", () => {
    if (confirm("Reset all settings to defaults?")) {
        chrome.storage.local.clear()
        window.location.reload()
    }
})

document.querySelector(".export.button").addEventListener("click", async () => {
    const allSettings = await chrome.storage.local.get(null)
    const json = JSON.stringify(allSettings, null, 2)
    const blob = new Blob([json], {type: "application/json"})
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "settings.json"
    a.click()
    URL.revokeObjectURL(url)
})

document.querySelector(".import.button").addEventListener("click", () => {
    if (confirm("Import settings and replace your current ones?")) {
        const input = document.createElement("input")
        input.type = "file"
        input.accept = "application/json"
        input.addEventListener("change", async () => {
            const file = input.files[0]
            if (!file) return
            try {
                const text = await file.text()
                const parsed = JSON.parse(text)
                await chrome.storage.local.clear()
                await chrome.storage.local.set(parsed)
                window.location.reload()
            } catch (e) {
                alert("Invalid file")
            }
        })
        input.click()
    }
})