const hideSelectors = [
    "#film-page-wrapper > div.col-17 > aside > section.section.ratings-histogram-chart",
    "#js-poster-col > section.poster-list.-p230.-single.no-hover.el.col > div.production-statistic-list > div.production-statistic.-top250",
    "#js-poster-col > section.poster-list.-p230.-single.no-hover.el.col > div.production-statistic-list > div.production-statistic.-likes",
    "#film-page-wrapper > div.col-17 > section.film-recent-reviews.-clear > section.film-reviews.section.js-popular-reviews",
    "#film-page-wrapper > div.col-17 > section.film-recent-reviews.-clear > section.film-reviews.section.js-recent-reviews",
    "#film-page-wrapper > div.col-17 > section.section.activity-from-friends.-clear.-friends-watched.-no-friends-want-to-watch",
    "#film-page-wrapper > div.col-17 > section.film-recent-reviews.-clear > section.film-reviews.section.js-popular-friend-reviews",
    "#production-popular-lists",
    "#lists"
]

// hide while loading
let loading = true
const loadingSelectors = [
    "#film-page-wrapper > div.col-17 > aside > section.section.ratings-histogram-chart",
    "#js-poster-col > section.poster-list.-p230.-single.no-hover.el.col > div.production-statistic-list",
    "#film-page-wrapper > div.col-17 > section.film-recent-reviews.-clear > section.film-reviews.section.js-popular-reviews",
    "#film-page-wrapper > div.col-17 > section.film-recent-reviews.-clear > section.film-reviews.section.js-recent-reviews",
    "#film-page-wrapper > div.col-17 > section.section.activity-from-friends.-clear"
]
const observer = new MutationObserver(() => {
    if (!loading) return
    loadingSelectors.forEach(sel => {
        const el = document.querySelector(sel)
        if (el) el.style.visibility = "hidden"
    })
})
observer.observe(document.body, {
    childList: true,
    subtree: true
})

// passive events (e.g. adblock)
function removeIfExists(sel) {
    const el = document.querySelector(sel)
    if (el) el.remove()
}
function passive() {
    const selectorsToRemove = [
        "#watch > div.other.-message.js-not-streaming",
        "#watch > div.other.-message",
        "#userpanel > ul > li.panel-sharing.sharing-toggle.js-actions-panel-sharing",
        "#film-page-wrapper > div.col-17 > section.section-margin.film-news",
        "#film-page-wrapper > div.col-17 > section.section.related-films.-clear > div.nanocrowd-attribution.-is-not-stacked",
        "#film-hq-mentions",
        "#content > div.content-wrap > div.banner.banner-950.js-hide-in-app",
        "#latest-news",
        "#content > div > div > aside > section.activity-settings.js-activity-filters.pro-message > form > small",
    ]
    selectorsToRemove.forEach(removeIfExists)

    // when where to watch empty then remove its header
    const watch = document.querySelector("#watch")
    const header = document.querySelector("#js-poster-col > section.watch-panel.js-watch-panel > div.header")
    const headerHr = document.querySelector("#js-poster-col > section.watch-panel.js-watch-panel")
    if (watch && watch.querySelectorAll("section").length == 0 && header && headerHr) {
        header.remove()
        headerHr.remove()
    }

    // film page patron ad
    const patronAd = document.querySelector("ul.js-actions-panel > li:last-of-type")
    if (patronAd && patronAd.children[0]?.children[0]?.tagName == 'SPAN' && patronAd.children[0].children[0].textContent.toLowerCase() == 'patron') patronAd.remove()

    // remove weird margin div after "Popular on Letterboxd"
    function removeDynamicDivAfterPopular() {
        const popular = document.querySelector("#popular-with-everyone")
        if (!popular) return
        const parent = popular.parentNode
        if (!parent) return

        function checkNext() {
            let next = popular.nextElementSibling
            while (next && next.tagName.toLowerCase() == "div") {
                next.remove()
                next = popular.nextElementSibling
            }
        }
        checkNext()

        const observer = new MutationObserver(() => {
            checkNext()
        })
        observer.observe(parent, { childList: true })
    }
    removeDynamicDivAfterPopular()

    // activity settings
    const activitySettingsForm = document.querySelector("#content > div > div > aside > section.activity-settings.js-activity-filters.pro-message > form")
    if (activitySettingsForm) activitySettingsForm.style.paddingBottom = 0
    const activitySettingsBtn1 = document.querySelector("#content > div > div > aside > section.activity-settings.js-activity-filters.pro-message > form > label:nth-child(1)")
    if (activitySettingsBtn1) activitySettingsBtn1.style.paddingTop = "12px"
    const activitySettingsBtn2 = document.querySelector("#content > div > div > aside > section.activity-settings.js-activity-filters.pro-message > form > label.option-label.-toggle.-small.switch-control.-block.-highcontrast.divider")
    if (activitySettingsBtn2) activitySettingsBtn2.style.borderBottom = "none"

    // move rental slightly
    const observer = new MutationObserver((mutations, obs) => {
        const el = document.querySelector("#user-homepage-container > div.videostore-feature.section")
        if (el) {
            const next = el?.nextElementSibling?.nextElementSibling
            if (next) next.after(el)
            obs.disconnect()
        }
    })
    observer.observe(document.body, {childList: true, subtree: true})

    // remove ads
    const ad2 = document.querySelector("#content > div > div > aside > div > a > img")
    if (ad2) ad2.parentElement.parentElement.remove()
    const ad3 = document.querySelectorAll(".upgrade-kicker")
    ad3.forEach(ad => ad.remove())

    // JustWatch – remove the parent if "not streaming"
    const justwatchServices = document.querySelector("#watch > div:last-of-type")
    const justwatchNotStreaming = document.querySelector("#watch > div.other.-message.js-not-streaming")
    if (justwatchNotStreaming && justwatchServices?.parentElement?.parentElement) {
        justwatchServices.parentElement.parentElement.remove()
    } else if (justwatchServices) {
        justwatchServices.remove()
    }

    if (!window.location.href.startsWith("https://letterboxd.com/film/")) {
        let listProAd = document.querySelector("#userpanel > ul > li:nth-child(2)")
        if (listProAd) listProAd.remove()
    }
}

// hide/show rating
function hideRatings() {
    let li = document.createElement("li")
    document.querySelector("#userpanel > ul").appendChild(li)
    let toggleBtn = document.createElement("button")
    li.appendChild(toggleBtn)

    function changeState(hidden) {
        let displayState
        if (hidden == true) {
            displayState = "none"
            toggleBtn.textContent = "Show rating"
        } else if (hidden == false) {
            displayState = ""
            toggleBtn.textContent = "Hide rating"
        }
        hideSelectors.forEach(sel => { 
            const el = document.querySelector(sel)
            if (sel == "#film-page-wrapper > div.col-17 > section.section.activity-from-friends.-clear.-friends-watched.-no-friends-want-to-watch") {
                let friends = document.querySelectorAll("#film-page-wrapper > div.col-17 > section.section.activity-from-friends.-clear > ul > li > a > span.rating")
                friends.forEach(friend => {
                    if (displayState) {
                        friend.style.display = "none"
                        let hiddenRating = document.createElement("span")
                        hiddenRating.textContent = "???"
                        hiddenRating.className = "hiddenRating"
                        hiddenRating.style.top = "4px"
                        hiddenRating.style.fontWeight = "600"
                        hiddenRating.style.position = "relative"
                        friend.parentElement.style.textAlign = "center"
                        friend.parentElement.appendChild(hiddenRating)
                    } else if (!displayState) {
                        friend.style.display = ""
                        let deleteSpan = document.querySelector(".hiddenRating")
                        if (deleteSpan) {
                            deleteSpan.remove()
                        }
                    }
                })
            } else {
                if (el) {
                    el.style.display = displayState
                }
            }
        })
    }

    function checkWatched() {
        function isWatched(selector) {
            const el = document.querySelector(selector)
            return el ? el.classList.contains('-on') : false
        }
        const checkSelectors = [
            "#userpanel > ul > li.actions-row1 > span.action-large.-watch > span > span > span",
            "#userpanel > ul > li.actions-row1 > span.action-large.-watch > a"
        ]
        let watched = checkSelectors.some(isWatched)
        const ratingEl = document.querySelector("#rateit-range-2")
        if (ratingEl && ratingEl.getAttribute("aria-valuenow") !== "0") {
            watched = true
        }

        if (watched) {
            hiddenState = false
            changeState(false)
        } else {
            hiddenState = true
            changeState(true)
        }
    }

    let hiddenState = true
    toggleBtn.addEventListener('click', () => {
        if (hiddenState) {
            hiddenState = false
            changeState(hiddenState)
        } else if (!hiddenState) {
            hiddenState = true
            changeState(hiddenState)
        }
    })

    checkWatched()
}

// initial run
setTimeout(() => {
    passive()

    if (window.location.href.startsWith("https://letterboxd.com/film/")) {
        loading = false
        loadingSelectors.forEach(sel => { 
            const el = document.querySelector(sel)
            if (el) {
                el.style.visibility = "visible"
            }
        })

        hideRatings()
    }
}, 1000)