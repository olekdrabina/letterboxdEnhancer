// global functions
function createTooltip(content, parent) {
    const tooltip = document.createElement("div")
    tooltip.className = "twipsy above"

    const tooltipArrow = document.createElement("div")
    tooltipArrow.className = "twipsy-arrow"
    tooltipArrow.style.left = "50%"
    tooltip.appendChild(tooltipArrow)
    
    const tooltipDescription = document.createElement("div")
    tooltipDescription.className = "twipsy-inner"
    tooltipDescription.textContent = content
    tooltip.appendChild(tooltipDescription)

    tooltip.style.position = "absolute"
    tooltip.style.bottom = "calc(100% + 5px)"
    tooltip.style.left = "50%"
    tooltip.style.transform = "translateX(-50%)"
    tooltip.style.visibility = "hidden"

    parent.appendChild(tooltip)
    parent.style.position = "relative"
    parent.style.cursor = "pointer"
    parent.style.color = "var(--theme-body-content-color)"
    parent.addEventListener("mouseenter", () => {
        tooltip.style.visibility = "visible"
        parent.style.color = "white"
    })
    parent.addEventListener("mouseleave", () => {
        tooltip.style.visibility = "hidden"
        parent.style.color = ""
    })
}

// main logic
chrome.storage.local.get(null, (settings) => {
    let isReleased = true
    if (document.querySelector("#film-page-wrapper > div.col-17 > section.film-reviews.reviews-hidden.section.-clear")) isReleased = false
    if (settings.extensionState) {
        const selectorsToRemove = []
        // === FILM PAGE ===
        if (window.location.href.startsWith("https://letterboxd.com/film/")) {
            if (settings.hideJustWatch) {
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

            if (settings.hideNews) {
                selectorsToRemove.push("#film-page-wrapper > div.col-17 > section.section-margin.film-news")
            }

            if (settings.hideMentionedBy) {
                selectorsToRemove.push("#film-hq-mentions")
            }
            
            // runtime
            const footer = document.querySelector("#film-page-wrapper > div.col-17 > section.section.col-10.col-main > p")
            if (footer.textContent.includes("mins")) {
                const runtimeMinutesNum = parseInt(footer.innerText.match(/\d+/)[0], 10)
                const runtimeMins = `${runtimeMinutesNum} mins`
                const runtimeHours = runtimeMinutesNum >= 60 ? `${Math.floor(runtimeMinutesNum / 60)} hrs ${runtimeMinutesNum % 60} mins`: runtimeMins
                
                function createRuntimeTooltip() {
                    const [display, tooltip] = settings.friendlyRuntime ? [runtimeHours, runtimeMins] : [runtimeMins, runtimeHours]
                    for (const node of footer.childNodes) {
                        if (node.nodeType != Node.TEXT_NODE || !node.textContent.trim()) continue

                        const match = node.textContent.match(/\d+\s*mins?/)
                        if (!match) break

                        const span = document.createElement("span")
                        span.textContent = display + " \u00A0 "
                        if (runtimeMinutesNum > 60) createTooltip(tooltip, span)

                        node.textContent = node.textContent.replace(match[0], "").trim() + " "
                        footer.insertBefore(span, footer.firstChild)
                        break
                    }
                }
                if (footer.textContent.includes("mins")) createRuntimeTooltip()
            }

            // Wikidata
            function getWikidata(letterboxdId, imdbId, tmdbId) {
                const query = `
                    SELECT ?item ?rottenTomatoes ?metacritic ?budget ?boxOffice ?wiki ?mpa WHERE {

                    {
                        VALUES ?imdbID { "${imdbID}}" }
                        ?item wdt:P345 ?imdbID .
                    }
                    UNION
                    {
                        VALUES ?tmdbID { "${tmdbID}" }
                        ?item wdt:P4947 ?tmdbID .
                    }
                    UNION
                    {
                        VALUES ?lbID { "${letterboxdId}" }
                        ?item wdt:P6127 ?lbID .
                    }

                    OPTIONAL { ?item wdt:P1258 ?rottenTomatoes. }
                    OPTIONAL { ?item wdt:P1712 ?metacritic. }
                    OPTIONAL { ?item wdt:P2130 ?budget. }

                    OPTIONAL {
                        ?item p:P2142 ?entry.
                        ?entry ps:P2142 ?boxOffice;
                            pq:P3005 wd:Q13780930.
                    }

                    OPTIONAL { ?item wdt:P1657 ?mpa. }

                    OPTIONAL {
                        ?wiki schema:about ?item ;
                            schema:isPartOf <https://en.wikipedia.org/>.
                    }
                    }
                    LIMIT 1
                `
    
                return {
                    url: "https://query.wikidata.org/bigdata/namespace/wdq/sparql",
                    options: {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                            "Accept": "application/sparql-results+json"
                        },
                        body: "query=" + encodeURIComponent(query) + "&format=json"
                    }
                }
            }
            const movieSlug = document.querySelector("#poster-modal > div > div > div.modal-body > div").dataset.itemSlug
            const tmdbID = document.querySelector("#film-page-wrapper > div.col-17 > section.section.col-10.col-main > p > a:nth-of-type(2)").href.split("/")[4]
            const imdbID = document.querySelector("#film-page-wrapper > div.col-17 > section.section.col-10.col-main > p > a:nth-of-type(1)").href.split("/")[4]
            async function useWikidata() {
                const req = getWikidata(movieSlug, imdbID, tmdbID)
                const res = await fetch(req.url, req.options)
                const text = await res.text()
                const data = JSON.parse(text)

                console.log("letterboxd-enchancer wikidata:")
                console.log(data.results.bindings[0])
                if (data.results.bindings[0]) {
                    // budget & box office
                    function prependLabeledValue(container, label, value) {
                        const formattedValue = Number(value).toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                        })
                        
                        const wrapper = document.createElement("div")
                        wrapper.className = "text-indentedlist"
                        wrapper.innerHTML = `<p>${formattedValue}</p>`
                        const heading = document.createElement("h3")
                        heading.innerHTML = `<span>${label}</span>`
                        
                        container.prepend(wrapper)
                        container.prepend(heading)
                    }
                    
                    const tabDetails = document.querySelector("#tab-details")
                    const {budget, boxOffice} = data.results.bindings[0]
                    if (settings.boxOffice && boxOffice && boxOffice.value != null) prependLabeledValue(tabDetails, "BOX OFFICE", boxOffice.value)
                    if (settings.budget && budget) prependLabeledValue(tabDetails, "BUDGET", budget.value)
                            
                    // wiki & mojo button
                    const reportSpan = document.querySelector("#film-page-wrapper > div.col-17 > section.section.col-10.col-main > p > span.block-flag-wrapper")
                    function createButton(content, href, margin) {
                        const btn = document.createElement("a")
                        btn.textContent = content
                        btn.href = href
                        btn.style.margin = margin
                        btn.className = "micro-button"
                        btn.target = "_blank"
                        reportSpan.parentNode.insertBefore(btn, reportSpan)
                    }
                    if (settings.wikiButton) createButton("Wiki", data.results.bindings[0].wiki.value, "0")
                    if (settings.mojoButton) createButton("Mojo", `https://www.boxofficemojo.com/title/${imdbID}/`, "0 0 0 3px")
        
                    // mpa
                    function createMpaRating() {
                        let mpaRating = ""
                        let mpaDescription = ""
                        switch (data.results.bindings[0].mpa.value.split("/")[4]) {
                            case "Q18665330":
                                mpaRating = "G"
                                mpaDescription = "Suitable for all ages"
                                break
                            case "Q18665334":
                                mpaRating = "PG"
                                mpaDescription = "Some material may not be suitable for children"
                                break
                            case "Q18665339":
                                mpaRating = "PG-13"
                                mpaDescription = "Some material may be inappropriate for children under 13"
                                break
                            case "Q18665344":
                                mpaRating = "R"
                                mpaDescription = "Under 17 requires accompanying adult"
                                break
                            case "Q18665349":
                                mpaRating = "NC-17"
                                mpaDescription = "No one 17 and under admitted"
                                break
                            default:
                                mpaRating = ""
                                mpaDescription = ""
                        }
                        const mpaContainer = document.createElement("span")
                        mpaContainer.textContent = mpaRating
                        mpaContainer.style.margin = "0 .33em"
                        mpaContainer.style.position = "relative"
                        mpaContainer.addEventListener("click", () => {
                            window.open("https://www.filmratings.com", "_blank")
                        })
                        document.querySelector("#film-page-wrapper > div.col-17 > section.production-masthead.-shadowed.-productionscreen.-film > div > div > span").after(mpaContainer)
                    
                        createTooltip(mpaDescription, mpaContainer)
                    }
                    const {mpa} = data.results.bindings[0]
                    if (settings.mpaRating && mpa && mpa.value != null) createMpaRating()
                }
            }
            useWikidata()

            // br after title
            if (settings.filmTitleBr) document.querySelector("#film-page-wrapper > div.col-17 > section.production-masthead.-shadowed.-productionscreen.-film > div > h1").after(document.createElement("br"))
       
            // html formatting
            const reviewWindow = document.querySelector("#frm-review")
            const formatterContainer = document.createElement("div")
            formatterContainer.className = "formatterContainer"
            formatterContainer.style.display = "inline-flex"
            formatterContainer.style.marginTop = "-1rem"
            formatterContainer.style.gap = ".25rem"
            reviewWindow.parentElement.parentElement.after(formatterContainer)

            function createHtmlFormatterBtn(purpose, icon, shortcut) {
                let btn = document.createElement("a")
                if (settings.reviewFormattingButtons) {
                    btn.addEventListener("click", () => createHtmlFormatter(purpose))
                    btn.innerHTML = icon
                    btn.href = "#"
                    btn.className = "text-slug tooltip"
                    btn.style.display = "inline-flex"
                    btn.style.height = "1.75rem"
                    btn.style.width = "2.25rem"
                    btn.style.justifyContent = "center"
                    btn.style.alignItems = "center"
                    formatterContainer.appendChild(btn)

                    const svg = btn.querySelector("svg")
                    svg.style.height = "1rem"
                }

                if (settings.reviewFormattingShortcuts) {
                    document.addEventListener("keydown", (e) => {
                        if (e.ctrlKey && e.key.toUpperCase() == shortcut) {
                            e.preventDefault()
                            createHtmlFormatter(purpose)
                        }
                    })
                    if (settings.reviewFormattingButtons) {
                        createTooltip(`CTRL + ${shortcut}`, btn)
                        btn.querySelector("div > div.twipsy-arrow").style.borderTop = "6px solid #303840"
                        btn.querySelector("div > div.twipsy-inner").style.background = "#303840"
                    }
                }
            }
            const boldIcon = '<svg fill="#9ab" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 380 511.38"><path fill-rule="nonzero" d="M0 511.38V0h179.09C241.18 0 288.3 11.87 320.3 35.72c32.13 23.73 48.19 58.62 48.19 104.53 0 25.05-6.47 47.23-19.42 66.29-12.83 19.06-30.69 33.09-53.7 41.95 26.25 6.6 46.87 19.79 61.97 39.69 15.11 19.89 22.66 44.22 22.66 73 0 49.14-15.7 86.3-46.99 111.6-31.41 25.29-76.12 38.12-134.14 38.6H0zm105.37-222.25v137.38h90.26c24.82 0 44.24-5.88 58.14-17.63 13.91-11.74 20.86-28.05 20.86-48.78 0-46.63-24.22-70.25-72.64-70.97h-96.62zm0-74.8h78.04c53.1-.95 79.71-22.05 79.71-63.53 0-23.13-6.71-39.8-20.26-49.99-13.42-10.18-34.64-15.22-63.77-15.22h-73.72v128.74z"/></svg>'
            createHtmlFormatterBtn("<b>~</b>", boldIcon, "B")
            const italicIcon = '<svg fill="#9ab" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 388 511.77"><path fill-rule="nonzero" d="M139.82 25.97c-7.09 0-11.56-5.81-9.97-12.98C131.44 5.82 138.49 0 145.59 0H377.7c7.1 0 11.57 5.81 9.98 12.98-1.59 7.17-8.64 12.99-15.74 12.99H268.4L145.68 485.8h102.49c7.1 0 11.56 5.82 9.98 12.98-1.59 7.17-8.64 12.99-15.74 12.99H10.3c-7.1 0-11.57-5.81-9.98-12.98 1.59-7.16 8.64-12.99 15.74-12.99h103.66L242.45 25.97H139.82z"/></svg>'
            createHtmlFormatterBtn("<i>~</i>", italicIcon, "I")
            const quoteIcon = '<svg fill="#9ab" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 122.88 92.81" style="enable-background:new 0 0 122.88 92.81" xml:space="preserve"><style type="text/css">.st0{fill-rule:evenodd;clip-rule:evenodd;}</style><g><path class="st0" d="M15.91,0h22.08c8.5,0,15.45,6.95,15.45,15.45c0,31.79,8.13,66.71-30.84,76.68 C4.94,96.64,0.34,77.2,19.12,75.86c11.45-0.82,13.69-8.22,14.04-19.4H15.45C6.95,56.45,0,49.5,0,41.01V15.91C0,7.16,7.16,0,15.91,0 L15.91,0z M84.65,0h22.08c8.5,0,15.45,6.95,15.45,15.45c0,31.79,8.13,66.71-30.84,76.68c-17.65,4.51-22.25-14.93-3.48-16.27 c11.45-0.82,13.69-8.22,14.04-19.4H84.18c-8.5,0-15.45-6.95-15.45-15.45V15.91C68.74,7.16,75.9,0,84.65,0L84.65,0z"/></g></svg>'
            createHtmlFormatterBtn("<blockquote>~</blockquote>", quoteIcon, "Q")
            const linkIcon = '<svg fill="#9ab" id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 122.88"><title>hyperlink</title><path d="M60.54,34.07A7.65,7.65,0,0,1,49.72,23.25l13-12.95a35.38,35.38,0,0,1,49.91,0l.07.08a35.37,35.37,0,0,1-.07,49.83l-13,12.95A7.65,7.65,0,0,1,88.81,62.34l13-13a20.08,20.08,0,0,0,0-28.23l-.11-.11a20.08,20.08,0,0,0-28.2.07l-12.95,13Zm14,3.16A7.65,7.65,0,0,1,85.31,48.05L48.05,85.31A7.65,7.65,0,0,1,37.23,74.5L74.5,37.23ZM62.1,89.05A7.65,7.65,0,0,1,72.91,99.87l-12.7,12.71a35.37,35.37,0,0,1-49.76.14l-.28-.27a35.38,35.38,0,0,1,.13-49.78L23,50A7.65,7.65,0,1,1,33.83,60.78L21.12,73.49a20.09,20.09,0,0,0,0,28.25l0,0a20.07,20.07,0,0,0,28.27,0L62.1,89.05Z"/></svg>'
            createHtmlFormatterBtn("<a href=\"\">~</a>", linkIcon, "L")

            function createHtmlFormatter(html) {
                const start = reviewWindow.selectionStart
                const end = reviewWindow.selectionEnd
                const text = reviewWindow.value
                const selectedText = text.substring(start, end)

                const before = html.split("~")[0]
                const after = html.split("~")[1]
                if (selectedText.startsWith(before) && selectedText.endsWith(after)) {
                    const unformattedText = selectedText.slice(before.length, selectedText.length - after.length)
                    reviewWindow.value = text.substring(0, start) + unformattedText + text.substring(end)
                    
                    reviewWindow.selectionStart = start
                    reviewWindow.selectionEnd = start + unformattedText.length
                    return
                }

                if (selectedText.length > 0) {
                    const [before, after] = html.split("~")
                    const formattedText = `${before}${selectedText}${after}`
                    reviewWindow.value = text.substring(0, start) + formattedText + text.substring(end)

                    reviewWindow.selectionStart = start
                    reviewWindow.selectionEnd = start + formattedText.length
                } else {
                    reviewWindow.value = text.slice(0, start) + before + after + text.slice(end)
                    reviewWindow.selectionStart = reviewWindow.selectionEnd = start + before.length
                }
            }
        }

        // === HOME PAGE ===

        // === REVIEW HIDING FOR HOME/FILMS PAGE ===
        if ((window.location.origin == "https://letterboxd.com" && window.location.pathname == "/") || window.location.pathname.startsWith("/films/")) {            
            const reviewsObserver = new MutationObserver(() => {
                if (!settings.hidePopularReviewsHome && !settings.hidePopularReviewsFilms) return
                let query
                if (window.location.origin == "https://letterboxd.com" && window.location.pathname == "/") query = "#popular-reviews > div > div > div.header > div.details > div.content-reactions-strip.-viewing"
                if (window.location.href.startsWith("https://letterboxd.com/films/")) query = "#popular-reviews > div > div > article > div.body > div.attribution-block.-large > div > span.content-reactions-strip.-viewing"

                document.querySelectorAll(query).forEach(container => {
                    const rating = container.querySelector("span.inline-rating")
                    const like = container.querySelector("span.inline-symbol:not(.inline-rating)")

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
                            rating.textContent = hidden ? rating.dataset.originalText : "???"
                            rating.className = hidden ? rating.dataset.originalClass : ""
                            if (like) {
                                like.style.display = hidden ? "" : "none"
                            }
                            return
                        }
                        if (like && likeLabel) {
                            const hidden = likeLabel.dataset.hidden == "1"
                            likeLabel.dataset.hidden = hidden ? "0" : "1"
                            likeLabel.textContent = hidden ? "♥" : "???"
                            like.style.display = hidden ? "" : "none"
                        }
                    }

                    if (rating) {
                        rating.dataset.originalText = rating.textContent
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
            document.querySelector("#popular-films > div > div > div > ul").querySelectorAll("li.posteritem").forEach(poster => {
                poster.querySelector("div.production-statistic-list")
            })

            const postersObserver = new MutationObserver((_, observer) => {
                const posters = document.querySelector("#popular-films > div > div > div > ul")
                if (posters) {
                    if (settings.hidePopularFilmsWatchesFilms) {
                        document.querySelectorAll("#popular-films > div > div > div > ul > li > div.production-statistic-list > div.production-statistic.-watches").forEach(watches => {
                            watches.remove()
                        })
                    }
                    if (settings.hidePopularFilmsListsFilms) {
                        document.querySelectorAll("#popular-films > div > div > div > ul > li > div.production-statistic-list > div.production-statistic.-lists").forEach(lists => {
                            lists.remove()
                        })
                    }
                    if (settings.hidePopularFilmsLikesFilms) {
                        document.querySelectorAll("#popular-films > div > div > div > ul > li > div.production-statistic-list > div.production-statistic.-likes").forEach(likes => {
                            likes.remove()
                        })
                    }
                    if (settings.hidePopularFilmsTop500Films) {
                        document.querySelectorAll("#popular-films > div > div > div > ul > li > div.production-statistic-list > div.production-statistic.-topFilms").forEach(top500 => {
                            top500.remove()
                        })
                    }
                }
            })
            postersObserver.observe(document.body, {childList: true, subtree: true})
        }

        // === OTHER ===
        function other() {
            if (settings.adblock) {
                const ads = Array.from(document.querySelectorAll('div.banner.banner-950.js-hide-in-app, div.banner.banner-250.js-hide-in-app, div.banner.banner-230.js-hide-in-app')).filter(ad =>
                    ad.querySelector('a[href="/pro/?utm_medium=banner&utm_campaign=get-pro"]')
                )
                ads.forEach(ad => ad.remove())
                document.querySelectorAll(".upgrade-kicker").forEach(kicker => kicker.remove())
                
                const justWatchProObserver = new MutationObserver((_, observer) => {
                    const justWatchPro = document.querySelector("#watch > div.other.-message")
                    if (justWatchPro) justWatchPro.remove()
                })
                justWatchProObserver.observe(document.body, {childList: true, subtree: true})
                const filmPageAdObserver = new MutationObserver((_, observer) => {
                    const link = Array.from(document.querySelectorAll("#userpanel a")).find(a => a.href.includes("/pro/"))
                    if (link) {
                        link.closest("li").remove()
                        observer.disconnect()
                    }
                })
                filmPageAdObserver.observe(document.body, {childList: true, subtree: true})

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
                if (settings.reviewsPageWider) {
                    const reviews = document.querySelector("#content > div > section.section.col-main.overflow.col-17")
                    if (reviews) reviews.style.width = "100%"
                }
                if (settings.networkPageWider) {
                    const network = document.querySelector("#content > div > div > section")
                    if (network) network.style.width = "100%"
                }
            }

            // people pages consistent border-radius
            peopleShare = document.querySelector("#userpanel > ul > li")
            if (peopleShare) peopleShare.style.borderRadius = "3px"
        }
        other()

        // === remove selectors ===
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