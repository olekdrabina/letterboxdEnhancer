if (window.location.href.startsWith("https://letterboxd.com/film/")) {
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
        loading = false
        loadingSelectors.forEach(sel => { 
            const el = document.querySelector(sel)
            if (el) {
                el.style.visibility = "visible"
            }
        })

        hideRatings()
    }, 1000)
}