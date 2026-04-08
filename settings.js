// chrome storage
async function saveSetting(key, value) {
    await chrome.storage.local.set({ [key]: value })
}
async function loadSetting(key, defaultValue) {
    const result = await chrome.storage.local.get([key])
    if (result[key] == undefined) {
        await saveSetting(key, defaultValue)
        return defaultValue
    }
    return result[key]
}

// settings list
const settings = [
    {name: "<b>Extension Toggle</b>", key: "extensionState", special: "masterSwitch"},
    {content: "SHOW/HIDE RATING"},
    {name: "Show/hide button", state: true, key: "showHideButton"},
    {name: "Show/hide button for unreleased", state: false, key: "showHideButtonUnreleased"},
    {name: "All below for unreleased", state: false, key: "hideUnreleased"},
    {name: "Hide rating", state: true, key: "hideRating"},
    {name: "Hide watches", state: false, key: "hideWatches"},
    {name: "Hide list appears", state: false, key: "hideListAppears"},
    {name: "Hide likes", state: true, key: "hideLikes"},
    {name: "Hide top500", state: true, key: "hideTop500"},
    {name: "Hide friends ratings", state: true, key: "hideFriendsRatings"},
    {name: "Hide friends reviews", state: true, key: "hideFriendsReviews"},
    {name: "Hide popular reviews", state: true, key: "hidePopularReviews"},
    {name: "Hide recent reviews", state: true, key: "hideRecentReviews"},
    {name: "Hide similar films", state: false, key: "hideSimilarFilms"},
    {name: "Hide popular lists", state: true, key: "hidePopularLists"},
    {name: "Hide your lists", state: false, key: "hideYourLists"},
    {name: "Hide lists you liked", state: true, key: "hideListsYouLiked"},
    {content: "FILM PAGE"},
    {name: "Line break after film title", state: true, key: "filmTitleBr"},
    {name: "Mpa rating", state: true, key: "mpaRating"},
    {name: "Box office in details", state: true, key: "boxOffice"},
    {name: "Budget in details", state: true, key: "budget"},
    {name: "Friendly runtime", state: true, key: "friendlyRuntime"},
    {name: "Wiki button at more at", state: true, key: "wikiButton"},
    {name: "Mojo button at more at" , state: true, key: "mojoButton"},
    {name: "Hide \"where to watch\" when not streaming", state: false, key: "hideJustWatch"},
    {name: "Hide news", state: true, key: "hideNews"},
    {name: "Hide \"Mentioned By\"", state: true, key: "hideMentionedBy"},
    {content: "HOME PAGE"},
    {name: "Hide ratings from popular reviews", state: true, key: "hidePopularReviewsHome"},
    {content: "FILMS PAGE"},
    {name: "Hide watches from popular films", state: false, key: "hidePopularFilmsWatchesFilms"},
    {name: "Hide list appears from popular films", state: false, key: "hidePopularFilmsListsFilms"},
    {name: "Hide likes from popular films", state: true, key: "hidePopularFilmsLikesFilms"},
    {name: "Hide top500 from popular films", state: true, key: "hidePopularFilmsTop500Films"},
    {name: "Hide ratings from popular reviews", state: true, key: "hidePopularReviewsFilms"},
    {content: "OTHER"},
    {name: "Review formatting buttons", state: true, key: "reviewFormattingButtons"},
    {name: "Review formatting shortcuts", state: true, key: "reviewFormattingShortcuts"},
    {name: "Ad block", state: true, key: "adblock"},
    {name: "Wider reviews page", state: true, key: "reviewsPageWider"},
    {name: "Wider network page", state: true, key: "networkPageWider"},
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

document.querySelector(".restoreDefault").addEventListener("click", () => {
    if (confirm("Reset all settings to defaults?")) {
        chrome.storage.local.clear()
        window.location.reload()
    }
})