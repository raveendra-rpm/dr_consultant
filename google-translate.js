(function () {
    const languages = [
        { code: "en", label: "English", native: "English", flag: "US" },
        { code: "hi", label: "Hindi", native: "हिन्दी", flag: "IN" },
        { code: "bn", label: "Bengali", native: "বাংলা", flag: "IN" },
        { code: "mr", label: "Marathi", native: "मराठी", flag: "IN" },
        { code: "te", label: "Telugu", native: "తెలుగు", flag: "IN" },
        { code: "ta", label: "Tamil", native: "தமிழ்", flag: "IN" },
        { code: "gu", label: "Gujarati", native: "ગુજરાતી", flag: "IN" },
        { code: "ur", label: "Urdu", native: "اردو", flag: "IN" },
        { code: "kn", label: "Kannada", native: "ಕನ್ನಡ", flag: "IN" },
        { code: "or", label: "Odia", native: "ଓଡ଼ିଆ", flag: "IN" },
        { code: "ml", label: "Malayalam", native: "മലയാളം", flag: "IN" },
        { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ", flag: "IN" },
    ];

    const includedLangs = languages.map(l => l.code).join(",");

    function triggerGoogleTranslate(langCode) {
        const combo = document.querySelector(".goog-te-combo");
        if (!combo) return false;

        if (langCode !== "en") {
            const hasLang = Array.from(combo.options).some(opt => opt.value === langCode);
            if (!hasLang) return false; 
        } else {
            if (combo.options.length === 0) return false;
        }

        combo.value = langCode === "en" ? "" : langCode;
        combo.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
    }

    function setGoogleTranslateCookie(langCode) {
        const value = `/en/${langCode}`;
        const hostname = window.location.hostname;
        const cookieBase = "path=/; max-age=31536000";

        document.cookie = `googtrans=${value}; ${cookieBase}`;
        document.cookie = `googtrans=${value}; domain=${hostname}; ${cookieBase}`;

        if (hostname.includes(".")) {
            document.cookie = `googtrans=${value}; domain=.${hostname}; ${cookieBase}`;
        }
    }

    function triggerWithRetry(langCode) {
        if (triggerGoogleTranslate(langCode)) return;
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (triggerGoogleTranslate(langCode) || attempts > 20) {
                clearInterval(interval);
            }
        }, 300);
    }

    function loadGoogleTranslate() {
        if (!document.getElementById("google_translate_element")) {
            const el = document.createElement("div");
            el.id = "google_translate_element";
            el.setAttribute("aria-hidden", "true");
            el.style.position = "fixed";
            el.style.left = "-9999px";
            el.style.top = "0";
            el.style.width = "1px";
            el.style.height = "1px";
            el.style.overflow = "hidden";
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
            document.body.appendChild(el);
        }

        if (window.google?.translate?.TranslateElement) {
            window.googleTranslateElementInit();
            return;
        }

        if (document.getElementById("google-translate-script")) return;

        window.googleTranslateElementInit = function () {
            new window.google.translate.TranslateElement(
                {
                    pageLanguage: "en",
                    includedLanguages: includedLangs,
                    autoDisplay: false,
                    multilanguagePage: true,
                },
                "google_translate_element"
            );
        };

        const script = document.createElement("script");
        script.id = "google-translate-script";
        script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        script.async = true;
        script.onerror = () => {
            script.remove();
        };
        document.body.appendChild(script);
    }

    function getRootDomain() {
        const hostname = window.location.hostname;
        const parts = hostname.split(".");
        if (parts.length === 1 || hostname.match(/^[0-9.]+$/)) {
            return hostname;
        }
        return parts.slice(-2).join(".");
    }

    function resetToEnglish() {
        const hostname = window.location.hostname;
        const rootDomain = getRootDomain();

        document.cookie = `googtrans=/en/en; path=/; domain=${hostname}`;
        document.cookie = `googtrans=/en/en; path=/; domain=.${hostname}`;
        document.cookie = `googtrans=/en/en; path=/; domain=${rootDomain}`;
        document.cookie = `googtrans=/en/en; path=/; domain=.${rootDomain}`;

        const expiry = "expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

        document.cookie = `googtrans=; ${expiry}`;
        document.cookie = `googtrans=; ${expiry} domain=${hostname}`;
        document.cookie = `googtrans=; ${expiry} domain=.${hostname}`;
        document.cookie = `googtrans=; ${expiry} domain=${rootDomain}`;
        document.cookie = `googtrans=; ${expiry} domain=.${rootDomain}`;
    }

    let currentLang = "en";
    let isOpen = false;

    function initUI() {
        const container = document.getElementById("language-selector-container");
        if (!container) return;

        container.innerHTML = `
            <div class="lang-dropdown-wrapper relative">
                <button id="lang-dropdown-btn" class="lang-dropdown-btn">
                    <div class="lang-icon-wrap">
                        <i class="fas fa-globe"></i>
                    </div>
                    <span id="current-lang-code" class="notranslate">EN</span>
                    <i class="fas fa-chevron-down chevron-icon"></i>
                </button>
                <div id="lang-dropdown-menu" class="lang-dropdown-menu hidden">
                    <div class="lang-dropdown-header">
                        <span class="notranslate">Translate</span>
                        <div class="pulse-dot"></div>
                    </div>
                    <div class="lang-list">
                        ${languages.map(lang => `
                            <button class="lang-option" data-lang="${lang.code}">
                                <span class="notranslate">
                                    <span class="lang-flag">${lang.flag}</span>
                                    ${lang.native}
                                </span>
                                <i class="fas fa-check check-icon" style="display: none;"></i>
                            </button>
                        `).join("")}
                    </div>
                </div>
            </div>
        `;

        const btn = document.getElementById("lang-dropdown-btn");
        const menu = document.getElementById("lang-dropdown-menu");
        const codeSpan = document.getElementById("current-lang-code");
        const options = document.querySelectorAll(".lang-option");

        function updateUI(code) {
            codeSpan.textContent = code.toUpperCase();
            options.forEach(opt => {
                const optCode = opt.getAttribute("data-lang");
                const check = opt.querySelector(".check-icon");
                if (optCode === code) {
                    opt.classList.add("active");
                    check.style.display = "block";
                } else {
                    opt.classList.remove("active");
                    check.style.display = "none";
                }
            });
        }

        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            isOpen = !isOpen;
            menu.classList.toggle("hidden", !isOpen);
            btn.classList.toggle("open", isOpen);
        });

        document.addEventListener("click", (e) => {
            if (!container.contains(e.target)) {
                isOpen = false;
                menu.classList.add("hidden");
                btn.classList.remove("open");
            }
        });

        options.forEach(opt => {
            opt.addEventListener("click", () => {
                const code = opt.getAttribute("data-lang");
                handleLanguageChange(code);
                updateUI(code);
                isOpen = false;
                menu.classList.add("hidden");
                btn.classList.remove("open");
            });
        });

        updateUI(currentLang);
    }

    function handleLanguageChange(code) {
        currentLang = code;
        localStorage.setItem("user-language", code);

        if (code === "en") {
            resetToEnglish();
            window.location.reload();
            return;
        }

        setGoogleTranslateCookie(code);
        triggerWithRetry(code);
    }

    document.addEventListener("DOMContentLoaded", () => {
        loadGoogleTranslate();
        initUI();

        const savedLang = localStorage.getItem("user-language") || "en";
        currentLang = savedLang;

        const container = document.getElementById("language-selector-container");
        if(container) {
           const btnSpan = document.getElementById("current-lang-code");
           if(btnSpan) btnSpan.textContent = currentLang.toUpperCase();
           const options = document.querySelectorAll(".lang-option");
           options.forEach(opt => {
                const optCode = opt.getAttribute("data-lang");
                const check = opt.querySelector(".check-icon");
                if(check) {
                    if (optCode === currentLang) {
                        opt.classList.add("active");
                        check.style.display = "block";
                    } else {
                        opt.classList.remove("active");
                        check.style.display = "none";
                    }
                }
            });
        }

        if (savedLang !== "en") {
            setGoogleTranslateCookie(savedLang);
            setTimeout(() => triggerWithRetry(savedLang), 800);
        } else {
            resetToEnglish();
        }
    });

})();
