if (window.location.href.startsWith("https://letterboxd.com/film/")) {
    let isReleased = true
    if (document.querySelector("#film-page-wrapper > div.col-17 > section.film-reviews.reviews-hidden.section.-clear")) isReleased = false
    chrome.storage.local.get(null, (settings) => {
        if (settings.extensionState) {
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
            // main hiding logic
            const hideSelectors = []
            const hideElements = []

            if (settings.hideUnreleased || isReleased) {
                if (settings.hideRating) {
                    hideSelectors.push("#film-page-wrapper > div.col-17 > aside > section.section.ratings-histogram-chart")
                }
                if (settings.hideWatches) {
                    hideSelectors.push("#js-poster-col > section.poster-list.-p230.-single.no-hover.el.col > div.production-statistic-list > div.production-statistic.-watches")
                }
                if (settings.hideListAppears) {
                    hideSelectors.push("#js-poster-col > section.poster-list.-p230.-single.no-hover.el.col > div.production-statistic-list > div.production-statistic.-lists")
                }
                if (settings.hideLikes) {
                    hideSelectors.push("#js-poster-col > section.poster-list.-p230.-single.no-hover.el.col > div.production-statistic-list > div.production-statistic.-likes")
                }
                if (settings.hideTop500) {
                    hideSelectors.push("#js-poster-col > section.poster-list.-p230.-single.no-hover.el.col > div.production-statistic-list > div.production-statistic.-topFilms")
                }

                if (settings.hideFriendsRatings) {
                    hideSelectors.push("#film-page-wrapper > div.col-17 > section.section.activity-from-friends.-clear.-friends-watched.-no-friends-want-to-watch")
                }
                if (settings.hideFriendsReviews) {
                    hideSelectors.push("#film-page-wrapper > div.col-17 > section.film-recent-reviews.-clear > section.film-reviews.section.js-popular-friend-reviews")
                }
                if (settings.hidePopularReviews) {
                    hideSelectors.push("#film-page-wrapper > div.col-17 > section.film-recent-reviews.-clear > section.film-reviews.section.js-popular-reviews")
                }
                if (settings.hideRecentReviews) {
                    hideSelectors.push("#film-page-wrapper > div.col-17 > section.film-recent-reviews.-clear > section.film-reviews.section.js-recent-reviews")
                }

                if (settings.hideSimilarFilms) {
                    hideSelectors.push("#film-page-wrapper > div.col-17 > section.section.related-films.-clear")
                }

                if (settings.hidePopularLists) {
                    hideSelectors.push("#production-popular-lists")
                }
                if (settings.hideYourLists) {
                    document.querySelectorAll("#lists > h2 > a").forEach(el => {
                        if (el.innerHTML == "Your Lists") {
                            hideElements.push(el.parentElement.parentElement)
                        }
                    })
                }
                if (settings.hideListsYouLiked) {
                    document.querySelectorAll("#lists > h2 > a").forEach(el => {
                        if (el.innerHTML == "Lists you liked") {
                            hideElements.push(el.parentElement.parentElement)
                        }
                    })
                }
            }

            // hide/show statistics
            let buttonExist
            if (!isReleased) {
                buttonExist = settings.showHideButtonUnreleased
            } else if (isReleased) {
                buttonExist = settings.generateShowHideButton
            }
            function hideStatistics() {
                if (buttonExist) {
                    const li = document.createElement("li")
                    document.querySelector("#userpanel > ul").appendChild(li)
                    const toggleBtn = document.createElement("button")
                    toggleBtn.className = "toggleBtn"
                    li.appendChild(toggleBtn)
                }
                function changeState(hidden) {
                    let displayState
                    if (hidden) {
                        displayState = "none"
                        if (buttonExist) {
                            document.querySelector(".toggleBtn").textContent = "Show statistics"
                        }
                    } else if (!hidden) {
                        displayState = ""
                        if (buttonExist) {
                            document.querySelector(".toggleBtn").textContent = "Hide statistics"
                        }
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
                    hideElements.forEach(el => {
                        el.style.display = displayState
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
                    if (ratingEl && ratingEl.getAttribute("aria-valuenow") != "0") {
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
                if (buttonExist) {
                    document.querySelector(".toggleBtn").addEventListener('click', () => {
                        if (hiddenState) {
                            hiddenState = false
                            changeState(hiddenState)
                        } else if (!hiddenState) {
                            hiddenState = true
                            changeState(hiddenState)
                        }
                    })
                }

                checkWatched()
            }
            setTimeout(() => {
                hideStatistics()
            }, 500)

            // initial run
            setTimeout(() => {
                loading = false
                loadingSelectors.forEach(sel => { 
                    const el = document.querySelector(sel)
                    if (el) {
                        el.style.visibility = "visible"
                    }
                })
            }, 500)
        }
    })
}