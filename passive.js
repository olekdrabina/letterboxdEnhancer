const selectorsToRemove = [
    "#watch > div.other.-message.js-not-streaming",
    "#watch > div.other.-message",
    "#userpanel > ul > li.panel-sharing.sharing-toggle.js-actions-panel-sharing",
    "#film-page-wrapper > div.col-17 > section.section-margin.film-news",
    "#film-page-wrapper > div.col-17 > section.section.related-films.-clear > div.nanocrowd-attribution.-is-not-stacked",
    "#film-hq-mentions",
    "#content > div > div > aside > section.activity-settings.js-activity-filters.pro-message > form > small",
]
 
// remove ads
const ads = Array.from(document.querySelectorAll('div.banner.banner-950.js-hide-in-app, div.banner.banner-250.js-hide-in-app, div.banner.banner-230.js-hide-in-app')).filter(ad =>
    ad.querySelector('a[href="/pro/?utm_medium=banner&utm_campaign=get-pro"]')
)
ads.forEach(ad => ad.remove())
document.querySelectorAll(".upgrade-kicker").forEach(kicker => kicker.remove())

function removeIfExists(sel) {
    const el = document.querySelector(sel)
    if (el) el.remove()
}
function passive() {
    // remove selectors
    selectorsToRemove.forEach(removeIfExists)

    // make reviews & network page wider
    if (window.location.href.endsWith("/reviews/") || window.location.href.endsWith("/following/")) {
        const reviews = document.querySelector("#content > div > section.section.col-main.overflow.col-17")
        if (reviews) reviews.style.width = "100%"
        const network = document.querySelector("#content > div > div > section")
        if (network) network.style.width = "100%"
    }

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
        
    // activity settings
    const activitySettingsForm = document.querySelector("#content > div > div > aside > section.activity-settings.js-activity-filters.pro-message > form")
    if (activitySettingsForm) activitySettingsForm.style.paddingBottom = 0
    const activitySettingsBtn1 = document.querySelector("#content > div > div > aside > section.activity-settings.js-activity-filters.pro-message > form > label:nth-child(1)")
    if (activitySettingsBtn1) activitySettingsBtn1.style.paddingTop = "12px"
    const activitySettingsBtn2 = document.querySelector("#content > div > div > aside > section.activity-settings.js-activity-filters.pro-message > form > label.option-label.-toggle.-small.switch-control.-block.-highcontrast.divider")
    if (activitySettingsBtn2) activitySettingsBtn2.style.borderBottom = "none"
    
    // move rental slightly lower
    const observer2 = new MutationObserver((mutations, obs) => {
        const el = document.querySelector("#user-homepage-container > div.videostore-feature.section")
        if (el) {
            const next = el.nextElementSibling
            if (next) next.after(el)
            document.querySelector(".pw-div -nomargin -bottommargin").remove()
            obs.disconnect()
        }
    })
    observer2.observe(document.body, {childList: true, subtree: true})

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

setTimeout(() => {
    passive()
}, 1000)