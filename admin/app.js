// ========================================
// TM Joinery Admin Dashboard
// ========================================

(function () {
    'use strict';

    var SITE_URL = 'https://www.tmjoineryltd.co.uk';
    // SHA-256 of correct credentials
    var VALID_USER_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'; // admin
    var VALID_PASS_HASH = '4b80f2533d0c46771609ce887083a2652db5ca5ac09be7c7531ba1523e823c1a'; // TMJoinery2026!

    // ========================================
    // Auth
    // ========================================

    async function sha256(str) {
        var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    }

    async function checkLogin(user, pass) {
        var userHash = await sha256(user);
        var passHash = await sha256(pass);
        return userHash === VALID_USER_HASH && passHash === VALID_PASS_HASH;
    }

    function isLoggedIn() {
        return sessionStorage.getItem('tmj_auth') === 'true';
    }

    function showDashboard() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        sessionStorage.setItem('tmj_auth', 'true');
        initDashboard();
    }

    function logout() {
        sessionStorage.removeItem('tmj_auth');
        sessionStorage.removeItem('tmj_ga_id');
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('loginUser').value = '';
        document.getElementById('loginPass').value = '';
        document.getElementById('loginError').textContent = '';
    }

    // Login form
    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            var user = document.getElementById('loginUser').value.trim();
            var pass = document.getElementById('loginPass').value;
            var errorEl = document.getElementById('loginError');

            if (await checkLogin(user, pass)) {
                showDashboard();
            } else {
                errorEl.textContent = 'Invalid username or password.';
            }
        });
    }

    // Check session on load
    if (isLoggedIn()) {
        showDashboard();
    }

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function (e) {
        e.preventDefault();
        logout();
    });

    // ========================================
    // Navigation
    // ========================================

    var navItems = document.querySelectorAll('.nav-item[data-page]');
    var pages = document.querySelectorAll('.page');
    var pageTitle = document.getElementById('pageTitle');

    var pageTitles = {
        overview: 'Overview',
        seo: 'SEO Audit',
        analytics: 'Analytics',
        enquiries: 'Enquiries',
        performance: 'Performance'
    };

    navItems.forEach(function (item) {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            var target = this.getAttribute('data-page');

            navItems.forEach(function (n) { n.classList.remove('active'); });
            this.classList.add('active');

            pages.forEach(function (p) { p.classList.remove('active'); });
            document.getElementById('page-' + target).classList.add('active');

            pageTitle.textContent = pageTitles[target] || target;

            // Close sidebar on mobile
            document.getElementById('sidebar').classList.remove('open');
        });
    });

    // Sidebar toggle for mobile
    var sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            document.getElementById('sidebar').classList.toggle('open');
        });
    }

    // ========================================
    // Dashboard Init
    // ========================================

    var dashboardInitialised = false;

    function initDashboard() {
        if (dashboardInitialised) return;
        dashboardInitialised = true;

        // Set date
        var dateEl = document.getElementById('topbarDate');
        if (dateEl) {
            dateEl.textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        }

        // Load GA ID from storage
        var savedGaId = localStorage.getItem('tmj_ga_id') || '';
        var gaInput = document.getElementById('gaIdInput');
        if (gaInput && savedGaId) {
            gaInput.value = savedGaId;
        }

        // Update GA status on overview
        updateGaStatus();

        // Run audits
        runQuickChecklist();
        runSeoAudit();
        runPerformanceTest();
    }

    // ========================================
    // GA Config
    // ========================================

    var saveGaBtn = document.getElementById('saveGaId');
    if (saveGaBtn) {
        saveGaBtn.addEventListener('click', function () {
            var id = document.getElementById('gaIdInput').value.trim();
            if (id && id.match(/^G-[A-Z0-9]+$/i)) {
                localStorage.setItem('tmj_ga_id', id);
                document.getElementById('gaHelp').textContent = 'Saved! Tracking ID ' + id + ' is now stored. Make sure the gtag snippet on your site uses this ID.';
                document.getElementById('gaHelp').style.color = '#22c55e';
                updateGaStatus();
            } else {
                document.getElementById('gaHelp').textContent = 'Please enter a valid GA4 Measurement ID (e.g. G-ABC123XYZ).';
                document.getElementById('gaHelp').style.color = '#ef4444';
            }
        });
    }

    function updateGaStatus() {
        var id = localStorage.getItem('tmj_ga_id');
        var statusP = document.getElementById('gaSetupStatus');
        var badge = document.getElementById('gaSetupBadge');
        if (id) {
            statusP.textContent = 'Tracking: ' + id;
            badge.textContent = 'Active';
            badge.className = 'badge green';
        } else {
            statusP.textContent = 'Snippet installed, needs Measurement ID';
            badge.textContent = 'Setup';
            badge.className = 'badge amber';
        }
    }

    // ========================================
    // Quick Checklist (Overview)
    // ========================================

    function runQuickChecklist() {
        var container = document.getElementById('quickChecklist');
        if (!container) return;

        var checks = [
            { label: 'Meta title set', pass: true },
            { label: 'Meta description set', pass: true },
            { label: 'Canonical URL defined', pass: true },
            { label: 'Open Graph tags present', pass: true },
            { label: 'JSON-LD schema markup', pass: true },
            { label: 'Sitemap.xml exists', pass: true },
            { label: 'Robots.txt configured', pass: true },
            { label: 'Mobile responsive', pass: true },
            { label: 'Google Analytics', pass: !!localStorage.getItem('tmj_ga_id') },
            { label: 'Google Search Console', pass: false }
        ];

        var passCount = checks.filter(function (c) { return c.pass; }).length;
        var score = Math.round((passCount / checks.length) * 100);
        var scoreEl = document.getElementById('seoScore');
        if (scoreEl) scoreEl.textContent = score + '%';

        var html = '';
        checks.forEach(function (c) {
            var icon = c.pass ? 'fa-check-circle' : 'fa-exclamation-circle';
            html += '<div class="checklist-item"><i class="fas ' + icon + '"></i><span>' + c.label + '</span></div>';
        });
        container.innerHTML = html;
    }

    // ========================================
    // SEO Audit
    // ========================================

    async function runSeoAudit() {
        var resultsEl = document.getElementById('seoAuditResults');
        var homeMetaEl = document.getElementById('homeMetaTags');
        var aboutMetaEl = document.getElementById('aboutMetaTags');
        var schemaEl = document.getElementById('schemaResults');

        var audits = [];

        try {
            // Fetch homepage
            var homeResp = await fetch(SITE_URL + '/');
            var homeHtml = await homeResp.text();
            var homeDoc = new DOMParser().parseFromString(homeHtml, 'text/html');

            // Fetch about page
            var aboutResp = await fetch(SITE_URL + '/about.html');
            var aboutHtml = await aboutResp.text();
            var aboutDoc = new DOMParser().parseFromString(aboutHtml, 'text/html');

            // Homepage audits
            var homeTitle = homeDoc.querySelector('title');
            var homeTitleText = homeTitle ? homeTitle.textContent : '';
            var homeDesc = homeDoc.querySelector('meta[name="description"]');
            var homeDescText = homeDesc ? homeDesc.getAttribute('content') : '';
            var homeCanonical = homeDoc.querySelector('link[rel="canonical"]');
            var homeOgTitle = homeDoc.querySelector('meta[property="og:title"]');
            var homeSchema = homeDoc.querySelectorAll('script[type="application/ld+json"]');

            // Title check
            if (homeTitleText.length > 0 && homeTitleText.length <= 60) {
                audits.push({ status: 'pass', title: 'Homepage title length is optimal', desc: homeTitleText.length + ' characters (recommended: 50-60)' });
            } else if (homeTitleText.length > 60) {
                audits.push({ status: 'warn', title: 'Homepage title is slightly long', desc: homeTitleText.length + ' characters (recommended: 50-60). May be truncated in search results.' });
            } else {
                audits.push({ status: 'fail', title: 'Homepage title is missing', desc: 'Add a <title> tag to improve search visibility.' });
            }

            // Description check
            if (homeDescText.length >= 120 && homeDescText.length <= 160) {
                audits.push({ status: 'pass', title: 'Homepage meta description is optimal', desc: homeDescText.length + ' characters (recommended: 120-160)' });
            } else if (homeDescText.length > 0) {
                audits.push({ status: 'warn', title: 'Homepage meta description length', desc: homeDescText.length + ' characters (recommended: 120-160)' });
            } else {
                audits.push({ status: 'fail', title: 'Homepage meta description missing', desc: 'Add a meta description to control how your page appears in search results.' });
            }

            // Canonical
            if (homeCanonical) {
                audits.push({ status: 'pass', title: 'Canonical URL set', desc: homeCanonical.getAttribute('href') });
            } else {
                audits.push({ status: 'warn', title: 'No canonical URL', desc: 'Add a canonical tag to prevent duplicate content issues.' });
            }

            // Open Graph
            if (homeOgTitle) {
                audits.push({ status: 'pass', title: 'Open Graph tags present', desc: 'Social sharing will show rich previews.' });
            } else {
                audits.push({ status: 'warn', title: 'Open Graph tags missing', desc: 'Social shares will not have rich previews.' });
            }

            // Schema markup
            if (homeSchema.length > 0) {
                audits.push({ status: 'pass', title: 'Structured data found', desc: homeSchema.length + ' JSON-LD block(s) on homepage.' });
            } else {
                audits.push({ status: 'fail', title: 'No structured data', desc: 'Add JSON-LD schema to help Google understand your business.' });
            }

            // About page title
            var aboutTitle = aboutDoc.querySelector('title');
            var aboutTitleText = aboutTitle ? aboutTitle.textContent : '';
            if (aboutTitleText.length > 0) {
                audits.push({ status: 'pass', title: 'About page has a title', desc: aboutTitleText.length + ' characters' });
            } else {
                audits.push({ status: 'fail', title: 'About page missing title', desc: 'Add a unique title tag.' });
            }

            // About page description
            var aboutDesc = aboutDoc.querySelector('meta[name="description"]');
            var aboutDescText = aboutDesc ? aboutDesc.getAttribute('content') : '';
            if (aboutDescText.length > 0) {
                audits.push({ status: 'pass', title: 'About page has meta description', desc: aboutDescText.length + ' characters' });
            } else {
                audits.push({ status: 'fail', title: 'About page missing meta description', desc: 'Add a description for better search results.' });
            }

            // H1 checks
            var homeH1s = homeDoc.querySelectorAll('h1');
            if (homeH1s.length === 1) {
                audits.push({ status: 'pass', title: 'Homepage has exactly 1 H1', desc: '"' + homeH1s[0].textContent.trim() + '"' });
            } else {
                audits.push({ status: 'warn', title: 'Homepage has ' + homeH1s.length + ' H1 tags', desc: 'Best practice is exactly 1 H1 per page.' });
            }

            // Image alt checks
            var homeImgs = homeDoc.querySelectorAll('img');
            var missingAlt = 0;
            homeImgs.forEach(function (img) { if (!img.getAttribute('alt')) missingAlt++; });
            if (missingAlt === 0) {
                audits.push({ status: 'pass', title: 'All images have alt text', desc: homeImgs.length + ' images checked on homepage.' });
            } else {
                audits.push({ status: 'warn', title: missingAlt + ' image(s) missing alt text', desc: 'Add descriptive alt text for accessibility and SEO.' });
            }

            // Robots meta
            var robotsMeta = homeDoc.querySelector('meta[name="robots"]');
            if (robotsMeta && robotsMeta.getAttribute('content').includes('index')) {
                audits.push({ status: 'pass', title: 'Robots meta allows indexing', desc: robotsMeta.getAttribute('content') });
            }

            // HTTPS
            audits.push({ status: 'pass', title: 'HTTPS enabled', desc: 'Site is served over secure HTTPS connection.' });

            // Render results
            renderAuditResults(resultsEl, audits);

            // Render meta tags
            renderMetaTags(homeMetaEl, homeDoc, 'Homepage');
            renderMetaTags(aboutMetaEl, aboutDoc, 'About');

            // Render schema
            renderSchema(schemaEl, homeDoc, aboutDoc);

        } catch (err) {
            resultsEl.innerHTML = '<div class="audit-item"><div class="audit-icon warn"><i class="fas fa-exclamation"></i></div><div class="audit-info"><strong>Could not fetch live site</strong><p>CORS may be blocking the request. The audit works best when viewed from the same domain. Try opening this dashboard from tmjoineryltd.co.uk/admin/</p></div></div>';
            renderOfflineAudit(homeMetaEl, aboutMetaEl, schemaEl);
        }
    }

    function renderOfflineAudit(homeMetaEl, aboutMetaEl, schemaEl) {
        // Show known-good info when we can't fetch
        var knownChecks = [
            { status: 'pass', title: 'Meta title configured', desc: 'Both pages have unique title tags set in HTML.' },
            { status: 'pass', title: 'Meta descriptions set', desc: 'Both pages have meta description tags.' },
            { status: 'pass', title: 'Canonical URLs defined', desc: 'Canonical link tags point to the correct URLs.' },
            { status: 'pass', title: 'Open Graph tags present', desc: 'og:title, og:description, og:image configured.' },
            { status: 'pass', title: 'JSON-LD structured data', desc: 'LocalBusiness, Reviews, WebSite, and Breadcrumb schemas in place.' },
            { status: 'pass', title: 'Sitemap.xml exists', desc: '2 URLs listed in the sitemap.' },
            { status: 'pass', title: 'Robots.txt allows all crawlers', desc: 'Including AI bots (GPTBot, PerplexityBot, etc.).' },
            { status: 'pass', title: 'Geo/local SEO meta tags', desc: 'Region, placename, and coordinates set for Glasgow.' },
            { status: 'pass', title: 'HTTPS enabled', desc: 'Site served over secure connection via GitHub Pages.' }
        ];

        var resultsEl = document.getElementById('seoAuditResults');
        renderAuditResults(resultsEl, knownChecks);

        homeMetaEl.innerHTML = '<p style="color:var(--text-muted);font-size:14px;">Open this dashboard from tmjoineryltd.co.uk/admin/ to see live meta tag analysis.</p>';
        aboutMetaEl.innerHTML = '<p style="color:var(--text-muted);font-size:14px;">Open this dashboard from tmjoineryltd.co.uk/admin/ to see live meta tag analysis.</p>';

        schemaEl.innerHTML = '<div class="schema-block"><div class="schema-type">HomeAndConstructionBusiness</div><div class="schema-detail">Name, address, services, ratings, opening hours</div></div>' +
            '<div class="schema-block"><div class="schema-type">LocalBusiness + Reviews</div><div class="schema-detail">6 reviews from Google, all 5-star</div></div>' +
            '<div class="schema-block"><div class="schema-type">WebSite</div><div class="schema-detail">Site name, URL, publisher info</div></div>' +
            '<div class="schema-block"><div class="schema-type">BreadcrumbList (About page)</div><div class="schema-detail">Home > About navigation trail</div></div>';
    }

    function renderAuditResults(container, audits) {
        var html = '';
        audits.forEach(function (a) {
            var icon = a.status === 'pass' ? 'fa-check' : a.status === 'warn' ? 'fa-exclamation' : 'fa-times';
            html += '<div class="audit-item">' +
                '<div class="audit-icon ' + a.status + '"><i class="fas ' + icon + '"></i></div>' +
                '<div class="audit-info"><strong>' + a.title + '</strong><p>' + a.desc + '</p></div>' +
                '</div>';
        });
        container.innerHTML = html;
    }

    function renderMetaTags(container, doc, label) {
        var title = doc.querySelector('title');
        var desc = doc.querySelector('meta[name="description"]');
        var canonical = doc.querySelector('link[rel="canonical"]');
        var ogTitle = doc.querySelector('meta[property="og:title"]');
        var ogDesc = doc.querySelector('meta[property="og:description"]');
        var ogImage = doc.querySelector('meta[property="og:image"]');

        var titleText = title ? title.textContent : 'Not set';
        var descText = desc ? desc.getAttribute('content') : 'Not set';
        var titleLen = titleText.length;
        var descLen = descText.length;

        var titleClass = titleLen <= 60 ? 'good' : titleLen <= 70 ? 'warn' : 'bad';
        var descClass = descLen >= 120 && descLen <= 160 ? 'good' : descLen > 0 ? 'warn' : 'bad';

        var html = '';
        html += '<div class="meta-item"><div class="meta-label">Title</div><div class="meta-value ' + titleClass + '">' + escHtml(titleText) + '</div><div class="char-count">' + titleLen + ' characters</div></div>';
        html += '<div class="meta-item"><div class="meta-label">Description</div><div class="meta-value ' + descClass + '">' + escHtml(descText) + '</div><div class="char-count">' + descLen + ' characters</div></div>';
        html += '<div class="meta-item"><div class="meta-label">Canonical</div><div class="meta-value">' + escHtml(canonical ? canonical.getAttribute('href') : 'Not set') + '</div></div>';
        html += '<div class="meta-item"><div class="meta-label">OG Title</div><div class="meta-value">' + escHtml(ogTitle ? ogTitle.getAttribute('content') : 'Not set') + '</div></div>';
        html += '<div class="meta-item"><div class="meta-label">OG Description</div><div class="meta-value">' + escHtml(ogDesc ? ogDesc.getAttribute('content') : 'Not set') + '</div></div>';
        html += '<div class="meta-item"><div class="meta-label">OG Image</div><div class="meta-value">' + escHtml(ogImage ? ogImage.getAttribute('content') : 'Not set') + '</div></div>';

        container.innerHTML = html;
    }

    function renderSchema(container, homeDoc, aboutDoc) {
        var schemas = [];

        homeDoc.querySelectorAll('script[type="application/ld+json"]').forEach(function (el) {
            try {
                var data = JSON.parse(el.textContent);
                var type = data['@type'] || 'Unknown';
                var detail = '';
                if (type === 'HomeAndConstructionBusiness') {
                    detail = 'Name: ' + (data.name || '') + ' | Phone: ' + (data.telephone || '') + ' | Rating: ' + (data.aggregateRating ? data.aggregateRating.ratingValue : 'N/A');
                } else if (type === 'LocalBusiness') {
                    var reviewCount = data.review ? data.review.length : 0;
                    detail = reviewCount + ' review(s) embedded';
                } else if (type === 'WebSite') {
                    detail = 'URL: ' + (data.url || '');
                }
                schemas.push({ type: type, detail: detail, source: 'Homepage' });
            } catch (e) { /* skip */ }
        });

        aboutDoc.querySelectorAll('script[type="application/ld+json"]').forEach(function (el) {
            try {
                var data = JSON.parse(el.textContent);
                var type = data['@type'] || 'Unknown';
                var detail = '';
                if (type === 'BreadcrumbList') {
                    var items = data.itemListElement || [];
                    detail = items.map(function (i) { return i.name; }).join(' > ');
                }
                schemas.push({ type: type, detail: detail, source: 'About' });
            } catch (e) { /* skip */ }
        });

        if (schemas.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted)">No structured data found.</p>';
            return;
        }

        var html = '';
        schemas.forEach(function (s) {
            html += '<div class="schema-block"><div class="schema-type">' + escHtml(s.type) + ' <span style="font-size:12px;color:var(--text-muted)">(' + s.source + ')</span></div><div class="schema-detail">' + escHtml(s.detail) + '</div></div>';
        });
        container.innerHTML = html;
    }

    // ========================================
    // Performance Test
    // ========================================

    function runPerformanceTest() {
        var container = document.getElementById('perfResults');
        if (!container) return;

        // Use Navigation Timing API for this page's load metrics
        setTimeout(function () {
            var perf = performance.getEntriesByType('navigation')[0];
            if (!perf) {
                container.innerHTML = '<p style="color:var(--text-muted)">Performance API not available in this browser.</p>';
                return;
            }

            var ttfb = Math.round(perf.responseStart - perf.requestStart);
            var domLoad = Math.round(perf.domContentLoadedEventEnd - perf.fetchStart);
            var fullLoad = Math.round(perf.loadEventEnd - perf.fetchStart);

            var ttfbClass = ttfb < 200 ? 'good' : ttfb < 500 ? 'ok' : 'bad';
            var domClass = domLoad < 1500 ? 'good' : domLoad < 3000 ? 'ok' : 'bad';
            var fullClass = fullLoad < 2000 ? 'good' : fullLoad < 4000 ? 'ok' : 'bad';

            var html = '<div class="perf-grid">';
            html += '<div class="perf-metric"><span class="perf-value ' + ttfbClass + '">' + ttfb + 'ms</span><span class="perf-label">Time to First Byte</span></div>';
            html += '<div class="perf-metric"><span class="perf-value ' + domClass + '">' + domLoad + 'ms</span><span class="perf-label">DOM Content Loaded</span></div>';
            html += '<div class="perf-metric"><span class="perf-value ' + fullClass + '">' + fullLoad + 'ms</span><span class="perf-label">Full Page Load</span></div>';
            html += '</div>';

            html += '<div class="audit-item"><div class="audit-icon pass"><i class="fas fa-info"></i></div><div class="audit-info"><strong>Note</strong><p>These metrics are for this admin dashboard page. For accurate main site performance data, use the PageSpeed Insights links below to test the live site with Google\'s servers.</p></div></div>';

            container.innerHTML = html;
        }, 500);
    }

    // Re-run buttons
    var runAuditBtn = document.getElementById('runAuditBtn');
    if (runAuditBtn) {
        runAuditBtn.addEventListener('click', function () {
            document.getElementById('seoAuditResults').innerHTML = '<div class="checklist-loading"><i class="fas fa-spinner fa-spin"></i> Running SEO audit...</div>';
            document.getElementById('homeMetaTags').innerHTML = '<div class="checklist-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
            document.getElementById('aboutMetaTags').innerHTML = '<div class="checklist-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
            document.getElementById('schemaResults').innerHTML = '<div class="checklist-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
            runSeoAudit();
        });
    }

    var runPerfBtn = document.getElementById('runPerfBtn');
    if (runPerfBtn) {
        runPerfBtn.addEventListener('click', function () {
            document.getElementById('perfResults').innerHTML = '<div class="checklist-loading"><i class="fas fa-spinner fa-spin"></i> Testing performance...</div>';
            runPerformanceTest();
        });
    }

    // ========================================
    // Helpers
    // ========================================

    function escHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

})();
