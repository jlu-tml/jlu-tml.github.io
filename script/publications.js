(function () {
    "use strict";

    function textContent(node) {
        return node ? node.textContent.replace(/\s+/g, " ").trim() : "";
    }

    function normalizeText(value) {
        return (value || "")
            .toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function classify(item) {
        var badges = Array.prototype.map.call(item.querySelectorAll("img"), function (image) {
            return image.getAttribute("src") || "";
        }).join(" ");
        var categories = [];

        if (/CCF-A/i.test(badges)) categories.push("ccf-a");
        if (/CCF-B/i.test(badges)) categories.push("ccf-b");
        if (/SCI-I/i.test(badges)) categories.push("sci-i");
        return categories.length ? categories : ["other"];
    }

    function initPublicationPage() {
        var list = document.querySelector(".publication-list");
        if (!list) return;

        var papers = [];
        var currentYear = "";
        var children = Array.prototype.slice.call(list.children);

        children.forEach(function (node) {
            if (node.tagName.toLowerCase() === "h3") {
                currentYear = textContent(node);
                node.classList.add("publication-year");
                node.dataset.year = currentYear;
                return;
            }

            if (node.tagName.toLowerCase() !== "li") return;

            var titleLink = node.querySelector("p > a");
            var title = textContent(node.querySelector("p > a b"));
            var categories = classify(node);
            var generatedLink = false;

            node.classList.add("publication-item");
            node.dataset.year = currentYear;
            node.dataset.category = categories.join(" ");

            if (titleLink) {
                if (!titleLink.getAttribute("href")) {
                    titleLink.href = "https://scholar.google.com/scholar?q=" + encodeURIComponent(title + " " + currentYear);
                    generatedLink = true;
                }

                titleLink.target = "_blank";
                titleLink.rel = "noopener noreferrer";
                titleLink.classList.add("publication-title-link");
                titleLink.setAttribute("aria-label", "Open paper: " + title);

                if (generatedLink) {
                    var hint = document.createElement("span");
                    hint.className = "publication-link-hint";
                    hint.textContent = "Scholar";
                    titleLink.appendChild(hint);
                }
            }

            papers.push({
                node: node,
                title: title,
                categories: categories,
                year: currentYear,
                searchText: normalizeText(textContent(node))
            });
        });

        var yearCounts = {};
        var ccfAByYear = {};
        var categoryCounts = {};

        papers.forEach(function (paper) {
            yearCounts[paper.year] = (yearCounts[paper.year] || 0) + 1;
            paper.categories.forEach(function (category) {
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            });
            if (paper.categories.indexOf("ccf-a") !== -1) {
                ccfAByYear[paper.year] = (ccfAByYear[paper.year] || 0) + 1;
            }
        });

        var years = Object.keys(yearCounts).sort(function (left, right) {
            return Number(left) - Number(right);
        });
        var trendYears = [];

        if (years.length) {
            for (var year = Number(years[0]); year <= Number(years[years.length - 1]); year += 1) {
                trendYears.push(String(year));
            }
        }

        function setText(id, value) {
            var target = document.getElementById(id);
            if (target) target.textContent = value;
        }

        var ccfACount = categoryCounts["ccf-a"] || 0;
        var ccfAShare = papers.length ? (ccfACount / papers.length * 100).toFixed(1).replace(/\.0$/, "") + "%" : "0%";

        setText("stat-total", papers.length);
        setText("stat-ccfa", ccfACount);
        setText("stat-ccfa-share", ccfAShare);
        setText("stat-ccfa-share-foot", ccfACount + " of " + papers.length + " publications");
        setText("stat-latest-year", years[years.length - 1] || "—");
        setText("publication-range", years.length ? years[0] + "—" + years[years.length - 1] : "—");
        setText("publication-result-count", papers.length + " papers");

        var trend = document.getElementById("publication-trend");
        var trendLabels = document.getElementById("publication-trend-labels");
        var trendLine = document.getElementById("publication-ccfa-line");
        var maxCount = Math.max.apply(null, trendYears.map(function (year) { return yearCounts[year] || 0; }));

        if (trendLabels) trendLabels.style.setProperty("--trend-count", trendYears.length);

        if (trend && trendLabels) {
            trendYears.forEach(function (year) {
                var column = document.createElement("div");
                column.className = "trend-column";
                var totalCount = yearCounts[year] || 0;
                var ccfACount = ccfAByYear[year] || 0;
                column.title = year + ": " + totalCount + " publications, " + ccfACount + " CCF-A";

                var bars = document.createElement("div");
                bars.className = "trend-bars";

                var barWrap = document.createElement("span");
                barWrap.className = "trend-bar-wrap";
                barWrap.style.height = Math.max(4, Math.round(totalCount / maxCount * 100)) + "%";

                var barLabel = document.createElement("span");
                barLabel.className = "trend-bar-label";
                barLabel.textContent = totalCount;

                var totalBar = document.createElement("span");
                totalBar.className = "trend-bar total";
                totalBar.setAttribute("role", "img");
                totalBar.setAttribute("aria-label", year + ": " + totalCount + " total publications");

                barWrap.appendChild(barLabel);
                barWrap.appendChild(totalBar);
                bars.appendChild(barWrap);
                column.appendChild(bars);
                trend.appendChild(column);

                var label = document.createElement("span");
                label.className = "trend-label";
                label.textContent = year;
                trendLabels.appendChild(label);
            });
        }

        function renderCcfALine() {
            if (!trendLine || !trendYears.length) return;

            var width = trendLine.clientWidth;
            var height = trendLine.clientHeight;
            if (!width || !height) return;

            trendLine.innerHTML = "";
            var previous = null;
            var safeMax = maxCount || 1;

            trendYears.forEach(function (year, index) {
                var count = ccfAByYear[year] || 0;
                var x = ((index + 0.5) / trendYears.length) * width;
                var y = height - (count / safeMax) * height;

                if (previous) {
                    var deltaX = x - previous.x;
                    var deltaY = y - previous.y;
                    var segment = document.createElement("span");
                    segment.className = "trend-line-segment";
                    segment.style.left = previous.x + "px";
                    segment.style.top = previous.y + "px";
                    segment.style.width = Math.sqrt(deltaX * deltaX + deltaY * deltaY) + "px";
                    segment.style.transform = "rotate(" + Math.atan2(deltaY, deltaX) * 180 / Math.PI + "deg)";
                    trendLine.appendChild(segment);
                }

                var point = document.createElement("span");
                point.className = "trend-line-point";
                point.style.left = x + "px";
                point.style.top = y + "px";
                point.dataset.value = count;
                point.title = year + ": " + count + " CCF-A publications";
                point.setAttribute("aria-label", year + ": " + count + " CCF-A publications");
                point.setAttribute("tabindex", "0");
                trendLine.appendChild(point);
                previous = { x: x, y: y };
            });
        }

        renderCcfALine();
        window.addEventListener("resize", renderCcfALine);

        var breakdown = document.getElementById("publication-breakdown-list");
        if (breakdown) {
            var categoryLabels = [
                ["ccf-a", "CCF-A"],
                ["ccf-b", "CCF-B"],
                ["sci-i", "SCI-I"],
                ["other", "Other / untagged"]
            ];

            categoryLabels.forEach(function (entry) {
                var row = document.createElement("div");
                row.className = "breakdown-row";
                row.innerHTML = "<span class=\"breakdown-dot " + entry[0] + "\"></span><span>" + entry[1] + "</span><strong>" + (categoryCounts[entry[0]] || 0) + "</strong>";
                breakdown.appendChild(row);
            });
        }

        var filters = Array.prototype.slice.call(document.querySelectorAll(".publication-filter"));
        var search = document.getElementById("publication-search");
        var resultCount = document.getElementById("publication-result-count");
        var clearButton = document.getElementById("publication-clear");
        var emptyState = document.getElementById("publication-empty-state");
        var selectedFilter = "all";

        function updateVisibility() {
            var queryTerms = normalizeText(search ? search.value : "").split(" ").filter(Boolean);
            var visibleByYear = {};
            var visibleCount = 0;

            papers.forEach(function (paper) {
                var matchesFilter = selectedFilter === "all" || paper.categories.indexOf(selectedFilter) !== -1;
                var matchesSearch = !queryTerms.length || queryTerms.every(function (term) {
                    return paper.searchText.indexOf(term) !== -1;
                });
                var visible = matchesFilter && matchesSearch;
                paper.node.hidden = !visible;
                paper.node.classList.toggle("is-filtered-out", !visible);
                if (visible) {
                    visibleCount += 1;
                    visibleByYear[paper.year] = true;
                }
            });

            children.forEach(function (node) {
                if (node.tagName.toLowerCase() === "h3") {
                    var hideYear = !visibleByYear[node.dataset.year];
                    node.hidden = hideYear;
                    node.classList.toggle("is-filtered-out", hideYear);
                }
            });

            if (resultCount) {
                resultCount.textContent = visibleCount === papers.length
                    ? papers.length + " papers"
                    : visibleCount + " of " + papers.length + " papers";
            }

            if (emptyState) {
                emptyState.hidden = visibleCount !== 0;
                emptyState.textContent = queryTerms.length || selectedFilter !== "all"
                    ? "No publications match the current search and filter."
                    : "No publications available.";
            }
        }

        filters.forEach(function (button) {
            button.setAttribute("aria-pressed", button.classList.contains("is-active") ? "true" : "false");
            button.addEventListener("click", function () {
                selectedFilter = button.dataset.filter || "all";
                filters.forEach(function (item) {
                    item.classList.remove("is-active");
                    item.setAttribute("aria-pressed", "false");
                });
                button.classList.add("is-active");
                button.setAttribute("aria-pressed", "true");
                updateVisibility();
            });
        });

        if (search) search.addEventListener("input", updateVisibility);
        if (clearButton) {
            clearButton.addEventListener("click", function () {
                if (search) {
                    search.value = "";
                    search.focus();
                }
                selectedFilter = "all";
                filters.forEach(function (item) {
                    item.classList.toggle("is-active", item.dataset.filter === "all");
                    item.setAttribute("aria-pressed", item.dataset.filter === "all" ? "true" : "false");
                });
                updateVisibility();
            });
        }
        updateVisibility();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initPublicationPage);
    } else {
        initPublicationPage();
    }
}());
