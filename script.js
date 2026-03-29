// ========================================
// TM Joinery Ltd - Main Script
// ========================================

(function () {
    'use strict';

    // Rotating words in hero
    var words = document.querySelectorAll('.rotating-word');
    if (words.length > 0) {
        var currentWord = 0;
        setInterval(function () {
            words[currentWord].classList.remove('active');
            words[currentWord].classList.add('exit');
            setTimeout(function () {
                words[currentWord].classList.remove('exit');
                currentWord = (currentWord + 1) % words.length;
                words[currentWord].classList.add('active');
            }, 400);
        }, 2200);
    }

    // Navbar scroll effect
    var navbar = document.getElementById('navbar');
    var lastScroll = 0;

    window.addEventListener('scroll', function () {
        var scrollY = window.scrollY;
        if (scrollY > 80) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        lastScroll = scrollY;
    });

    // Mobile nav toggle with animation
    var navToggle = document.getElementById('navToggle');
    var navLinks = document.getElementById('navLinks');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function () {
            navLinks.classList.toggle('active');
            navToggle.classList.toggle('active');
        });

        navLinks.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                navLinks.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                var offset = navbar.offsetHeight;
                var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    });

    // ========================================
    // Scroll Reveal System
    // ========================================

    var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    });

    // Apply reveal animations to sections
    function setupReveals() {
        // Section headers - line draw animation
        document.querySelectorAll('.section-header').forEach(function (el) {
            el.classList.add('reveal');
            revealObserver.observe(el);
        });

        // About intro
        var aboutText = document.querySelector('.about-intro-text');
        var aboutImg = document.querySelector('.about-intro-image');
        if (aboutText) { aboutText.classList.add('reveal-left'); revealObserver.observe(aboutText); }
        if (aboutImg) { aboutImg.classList.add('reveal-right'); revealObserver.observe(aboutImg); }

        // Service cards - staggered
        document.querySelectorAll('.service-card').forEach(function (el, i) {
            el.classList.add('reveal', 'stagger-' + (i + 1));
            revealObserver.observe(el);
        });

        // Project cards - staggered
        document.querySelectorAll('.project-card').forEach(function (el, i) {
            el.classList.add('reveal', 'stagger-' + (i + 1));
            revealObserver.observe(el);
        });

        // Testimonial cards - staggered
        document.querySelectorAll('.testimonial-card').forEach(function (el, i) {
            el.classList.add('reveal', 'stagger-' + Math.min(i + 1, 6));
            revealObserver.observe(el);
        });

        // Featured post
        var featured = document.querySelector('.featured-post');
        if (featured) { featured.classList.add('reveal-scale'); revealObserver.observe(featured); }

        // Contact section
        var contactForm = document.querySelector('.contact-form-wrap');
        var contactInfo = document.querySelector('.contact-info');
        if (contactForm) { contactForm.classList.add('reveal-left'); revealObserver.observe(contactForm); }
        if (contactInfo) { contactInfo.classList.add('reveal-right'); revealObserver.observe(contactInfo); }

        // Stats bar
        var statsBar = document.querySelector('.stats-bar');
        if (statsBar) {
            revealObserver.observe(statsBar);
        }

        // Footer
        document.querySelectorAll('.footer-brand, .footer-links, .footer-contact').forEach(function (el, i) {
            el.classList.add('reveal', 'stagger-' + (i + 1));
            revealObserver.observe(el);
        });
    }

    // ========================================
    // Counter Animation
    // ========================================

    var countersStarted = false;

    function animateCounters() {
        if (countersStarted) return;
        countersStarted = true;

        document.querySelectorAll('.stat-number[data-target]').forEach(function (counter) {
            var target = parseInt(counter.getAttribute('data-target'));
            var duration = 1800;
            var start = 0;
            var startTime = null;

            function easeOutQuart(t) {
                return 1 - Math.pow(1 - t, 4);
            }

            function step(timestamp) {
                if (!startTime) startTime = timestamp;
                var progress = Math.min((timestamp - startTime) / duration, 1);
                var current = Math.floor(easeOutQuart(progress) * target);
                counter.textContent = current;

                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    counter.textContent = target;
                }
            }

            requestAnimationFrame(step);
        });
    }

    // Watch stats bar for counter trigger
    var statsObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                animateCounters();
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    var statsBar = document.querySelector('.stats-bar');
    if (statsBar) {
        statsObserver.observe(statsBar);
    }

    // ========================================
    // Parallax on Hero (subtle)
    // ========================================

    var hero = document.querySelector('.hero');
    if (hero) {
        window.addEventListener('scroll', function () {
            var scrollY = window.scrollY;
            if (scrollY < window.innerHeight) {
                hero.style.backgroundPositionY = (scrollY * 0.3) + 'px';
            }
        });
    }

    // ========================================
    // Contact Form
    // ========================================

    var contactFormEl = document.getElementById('contactForm');
    var formSuccess = document.getElementById('formSuccess');
    var sendAnother = document.getElementById('sendAnother');

    if (contactFormEl) {
        contactFormEl.addEventListener('submit', function (e) {
            e.preventDefault();
            var form = this;
            var data = new FormData(form);
            var submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            fetch(form.action, {
                method: 'POST',
                body: data,
                headers: { 'Accept': 'application/json' }
            })
            .then(function (response) {
                if (response.ok) {
                    form.reset();
                    form.style.display = 'none';
                    formSuccess.classList.add('active');
                } else {
                    showFormError(form);
                }
            })
            .catch(function () {
                showFormError(form);
            });
        });
    }

    function showFormError(form) {
        var submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Start Project';
        submitBtn.disabled = false;
        formSuccess.querySelector('h3').textContent = 'Something went wrong';
        formSuccess.querySelector('p').textContent = 'Please try again or contact us directly at info@tmjoineryltd.co.uk or call 07951484277.';
        form.style.display = 'none';
        formSuccess.classList.add('active');
    }

    if (sendAnother) {
        sendAnother.addEventListener('click', function () {
            formSuccess.classList.remove('active');
            formSuccess.querySelector('h3').textContent = 'Message Sent';
            formSuccess.querySelector('p').textContent = "Thanks for getting in touch! We've received your enquiry and will get back to you as soon as possible.";
            contactFormEl.style.display = 'grid';
        });
    }

    // ========================================
    // Active nav link highlighting
    // ========================================

    var sections = document.querySelectorAll('section[id]');
    var navLinksList = document.querySelectorAll('.nav-links a[href^="#"]');

    window.addEventListener('scroll', function () {
        var scrollY = window.scrollY + 200;

        sections.forEach(function (section) {
            var top = section.offsetTop;
            var height = section.offsetHeight;
            var id = section.getAttribute('id');

            if (scrollY >= top && scrollY < top + height) {
                navLinksList.forEach(function (link) {
                    link.classList.remove('nav-active');
                    if (link.getAttribute('href') === '#' + id) {
                        link.classList.add('nav-active');
                    }
                });
            }
        });
    });

    // ========================================
    // Init
    // ========================================

    setupReveals();

})();
