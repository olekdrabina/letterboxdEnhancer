chrome.storage.local.get(null, (data) => {
    console.table(data)
    if (data.extensionState) {
        const selectorsToRemove = []
        // === FILM PAGE ===
        if (window.location.href.startsWith("https://letterboxd.com/film/")) {
            if (data.hideJustWatch) {
                // where to watch – remove the parent if not streaming
                const justWatchObserver = new MutationObserver((_, observer) => {
                    const justWatchMessage = document.querySelector("#watch > div.other.-message")
                    if (justWatchMessage) {
                        if (justWatchMessage.innerHTML.trim() == "Not streaming.") {
                            document.querySelector("#js-poster-col > section.watch-panel.js-watch-panel > div.header").remove()
                            document.querySelector("#js-poster-col > section.watch-panel.js-watch-panel").remove()
                        } else document.querySelector("#watch > div.other.-message").remove()
                    }
                })
                justWatchObserver.observe(document.body, {childList: true, subtree: true})
            }

            if (data.hideNews) {
                selectorsToRemove.push("#film-page-wrapper > div.col-17 > section.section-margin.film-news")
            }

            if (data.hideMentionedBy) {
                selectorsToRemove.push("#film-hq-mentions")
            }
        }

        // === HOME PAGE ===

        // === REVIEW HIDING FOR HOME/FILMS PAGE ===
        if (window.location.href == "https://letterboxd.com/" || window.location.href.startsWith("https://letterboxd.com/films/")) {
            const reviewsObserver = new MutationObserver(() => {
                if (!data.hidePopularReviewsHome && !data.hidePopularReviewsFilms) return

                let query
                if (window.location.href == "https://letterboxd.com/") query = "#popular-reviews > div > div > div.header > div.details > div.content-reactions-strip.-viewing"
                if (window.location.href.startsWith("https://letterboxd.com/films/")) query = "#popular-reviews > div > div > article > div.body > div.attribution-block.-large > div > span.content-reactions-strip.-viewing"
                document.querySelectorAll(query).forEach(container => {
                    const rating = container.querySelector("span.rating")
                    const like = container.querySelector("span.icon-liked")
                    
                    if (container.dataset.initialized) return
                    if (window.location.href == "https://letterboxd.com/") container.style.display = "flex"
                    container.dataset.initialized = "1"
                    container.style.alignItems = "center"
                    container.style.height = container.offsetHeight + "px"

                    let likeLabel = container.querySelector(".likeLabel")
                    const toggle = e => {
                        e.stopPropagation()

                        if (rating) {
                            const hidden = rating.dataset.hidden == "1"
                            rating.dataset.hidden = hidden ? "0" : "1"
                            rating.textContent = hidden ? "" : "???"
                            rating.className = hidden ? rating.dataset.originalClass : ""
                            if (like) {
                                like.style.display = hidden ? "" : "none"
                            }
                            return
                        }
                        if (like && likeLabel) {
                            const hidden = likeLabel.dataset.hidden == "1"
                            likeLabel.dataset.hidden = hidden ? "0" : "1"
                            likeLabel.textContent = hidden ? "" : "???"
                            like.style.display = hidden ? "" : "none"
                        }
                    }
                    if (rating) {
                        rating.dataset.hidden = "1"
                        rating.dataset.originalClass = rating.className
                        rating.textContent = "???"
                        rating.className = ""
                        rating.style.userSelect = "none"
                        rating.style.cursor = "pointer"
                        rating.style.transition = "transform 0.2s"

                        if (like) {
                            like.style.display = "none"
                            like.style.cursor = "pointer"
                            like.style.transition = "transform 0.2s"
                        }
                    }
                    if (!rating && like) {
                        if (!likeLabel) {
                            likeLabel = document.createElement("div")
                            likeLabel.className = "likeLabel"
                            likeLabel.textContent = "???"
                            likeLabel.dataset.hidden = "1"
                            likeLabel.style.userSelect = "none"
                            like.style.margin = "0"
                            likeLabel.style.cursor = "pointer"
                            likeLabel.style.transition = "color 0.2s"

                            const commentLink = container.querySelector("a.icon-comment")
                            commentLink ? container.insertBefore(likeLabel, commentLink) : container.appendChild(likeLabel)
                        }

                        like.style.display = "none"
                        like.style.cursor = "pointer"
                        like.style.transition = "transform 0.2s"
                    }
                    const applyHover = () => {
                        if (rating) rating.style.transform = "scale(1.05)"
                        if (like && like.style.display != "none") {
                            like.style.transform = "scale(1.05)"
                        }
                        if (likeLabel) likeLabel.style.color = "#8899aa"
                    }
                    const removeHover = () => {
                        if (rating) rating.style.transform = "scale(1)"
                        if (like) like.style.transform = "scale(1)"
                        if (likeLabel) likeLabel.style.color = ""
                    }
                    if (rating) {
                        rating.addEventListener("mouseenter", applyHover)
                        rating.addEventListener("mouseleave", removeHover)
                    }
                    if (like) {
                        like.addEventListener("mouseenter", applyHover)
                        like.addEventListener("mouseleave", removeHover)
                    }
                    if (likeLabel) {
                        likeLabel.addEventListener("mouseenter", applyHover)
                        likeLabel.addEventListener("mouseleave", removeHover)
                    }

                    if (rating) rating.addEventListener("click", toggle)
                    if (like) like.addEventListener("click", toggle)
                    if (likeLabel) likeLabel.addEventListener("click", toggle)
                })
            })
            reviewsObserver.observe(document.body, {
                childList: true,
                subtree: true
            })
        }

        // === FILMS PAGE ===
        if (window.location.href.startsWith("https://letterboxd.com/films/")) {
            const postersObserver = new MutationObserver((_, observer) => {
                const posters = document.querySelector("#popular-films > div > div > div > ul")
                if (posters) {
                    if (data.hidePopularFilmsWatchesFilms) {
                        document.querySelectorAll("#popular-films > div > div > div > ul > li > div.production-statistic-list > div.production-statistic.-watches").forEach(watches => {
                            watches.remove()
                        })
                    }
                    if (data.hidePopularFilmsListsFilms) {
                        document.querySelectorAll("#popular-films > div > div > div > ul > li > div.production-statistic-list > div.production-statistic.-lists").forEach(lists => {
                            lists.remove()
                        })
                    }
                    if (data.hidePopularFilmsLikesFilms) {
                        document.querySelectorAll("#popular-films > div > div > div > ul > li > div.production-statistic-list > div.production-statistic.-likes").forEach(likes => {
                            likes.remove()
                        })
                    }
                }
            })
            postersObserver.observe(document.body, {childList: true, subtree: true})
        }

        // === OTHER ===
        function other() {
            if (data.adblock) {
                const ads = Array.from(document.querySelectorAll('div.banner.banner-950.js-hide-in-app, div.banner.banner-250.js-hide-in-app, div.banner.banner-230.js-hide-in-app')).filter(ad =>
                    ad.querySelector('a[href="/pro/?utm_medium=banner&utm_campaign=get-pro"]')
                )
                ads.forEach(ad => ad.remove())
                document.querySelectorAll(".upgrade-kicker").forEach(kicker => kicker.remove())

                const filmPagePatronAdObserver = new MutationObserver((_, observer) => {
                    const link = Array.from(document.querySelectorAll("#userpanel a")).find(a => a.href.includes("/pro/"))
                    if (link) {
                        link.closest("li").remove()
                        observer.disconnect()
                    }
                })
                filmPagePatronAdObserver.observe(document.body, {childList: true, subtree: true})

                selectorsToRemove.push("#content > div > div > aside > section.activity-settings.js-activity-filters.pro-message > form > small")
                const activitySettingsForm = document.querySelector("#content > div > div > aside > section.activity-settings.js-activity-filters.pro-message > form")
                if (activitySettingsForm) activitySettingsForm.style.paddingBottom = 0
                const activitySettingsBtn1 = document.querySelector("#content > div > div > aside > section.activity-settings.js-activity-filters.pro-message > form > label:nth-child(1)")
                if (activitySettingsBtn1) activitySettingsBtn1.style.paddingTop = "12px"
                const activitySettingsBtn2 = document.querySelector("#content > div > div > aside > section.activity-settings.js-activity-filters.pro-message > form > label.option-label.-toggle.-small.switch-control.-block.-highcontrast.divider")
                if (activitySettingsBtn2) activitySettingsBtn2.style.borderBottom = "none"
            }

            // make reviews & network page wider
            if ((window.location.href.endsWith("/reviews/") && !window.location.href.includes("film")) || window.location.href.endsWith("/following/")) {
                if (data.reviewsPageWider) {
                    const reviews = document.querySelector("#content > div > section.section.col-main.overflow.col-17")
                    if (reviews) reviews.style.width = "100%"
                }
                if (data.networkPageWider) {
                    const network = document.querySelector("#content > div > div > section")
                    if (network) network.style.width = "100%"
                }
            }

            // people pages consistent border-radius
            peopleShare = document.querySelector("#userpanel > ul > li")
            if (peopleShare) peopleShare.style.borderRadius = "3px"
        }
        other()

        // ===== remove selectors =====
        selectorsToRemove.forEach(selector => {
            const observer = new MutationObserver((_, observer) => {
                const selectorHTML = document.querySelector(selector)
                if (selectorHTML) {
                    selectorHTML.remove()
                    observer.disconnect()
                }
            })
            observer.observe(document.body, {childList: true, subtree: true})
        })
    }
})