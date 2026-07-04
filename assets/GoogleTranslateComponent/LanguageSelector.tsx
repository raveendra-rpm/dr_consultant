"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronDown, Globe, Check } from "lucide-react";

declare global {
  interface Window {
    gtranslate_settings: any;
    doGTranslate: (lang_pair: string) => void;
    googleTranslateElementInit: () => void;
    google?: {
      translate?: {
        TranslateElement: new (
          options: Record<string, unknown>,
          elementId: string,
        ) => unknown;
      };
    };
  }
}

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

// Helper: trigger the hidden Google Translate combo box to change language
function triggerGoogleTranslate(langCode: string): boolean {
  const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement;
  if (!combo) return false;

  // Google injects the combobox early with only 1 option ("Select Language").
  // If we try to set a value before the real languages are populated, it fails.
  if (langCode !== "en") {
    const hasLang = Array.from(combo.options).some(
      (opt) => opt.value === langCode,
    );
    if (!hasLang) return false; // Not fully populated yet, trigger retry
  } else {
    // For English, we just need the combo to be present
    if (combo.options.length === 0) return false;
  }

  if (langCode === "en") {
    // Setting value to empty string tells Google Translate to restore original content
    combo.value = "";
  } else {
    combo.value = langCode;
  }

  combo.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function setGoogleTranslateCookie(langCode: string) {
  const value = `/en/${langCode}`;
  const hostname = window.location.hostname;
  const cookieBase = "path=/; max-age=31536000";

  document.cookie = `googtrans=${value}; ${cookieBase}`;
  document.cookie = `googtrans=${value}; domain=${hostname}; ${cookieBase}`;

  if (hostname.includes(".")) {
    document.cookie = `googtrans=${value}; domain=.${hostname}; ${cookieBase}`;
  }
}

// Helper: retry triggering until the combo is ready (max ~6 seconds)
function triggerWithRetry(langCode: string) {
  if (triggerGoogleTranslate(langCode)) return;
  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    if (triggerGoogleTranslate(langCode) || attempts > 20) {
      clearInterval(interval);
    }
  }, 300);
}

// Helper: load the Google Translate script once
function loadGoogleTranslate(includedLangs: string) {
  // Create hidden container element
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
    new (window as any).google.translate.TranslateElement(
      {
        pageLanguage: "en",
        includedLanguages: includedLangs,
        autoDisplay: false,
        multilanguagePage: true,
      },
      "google_translate_element",
    );
  };

  const script = document.createElement("script");
  script.id = "google-translate-script";
  script.src =
    "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  script.onerror = () => {
    // Remove on failure so we can retry next time
    script.remove();
    const el = document.getElementById("google-translate-script");
    if (el) el.remove();
  };
  document.body.appendChild(script);
}

// Helper: extract root domain for cookie setting/clearing
function getRootDomain() {
  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  // If it's an IP address or localhost, just return the hostname
  if (parts.length === 1 || hostname.match(/^[0-9.]+$/)) {
    return hostname;
  }
  // Extract trailing root domain (e.g., example.com from www.example.com)
  return parts.slice(-2).join(".");
}

// Helper: clear Google Translate cookies to restore English
function resetToEnglish() {
  const hostname = window.location.hostname;
  const rootDomain = getRootDomain();

  // Set to /en/en temporarily to flush Google's state before clearing
  document.cookie = `googtrans=/en/en; path=/; domain=${hostname}`;
  document.cookie = `googtrans=/en/en; path=/; domain=.${hostname}`;
  document.cookie = `googtrans=/en/en; path=/; domain=${rootDomain}`;
  document.cookie = `googtrans=/en/en; path=/; domain=.${rootDomain}`;

  const expiry = "expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  // Clear on exact hostname
  document.cookie = `googtrans=; ${expiry}`;
  document.cookie = `googtrans=; ${expiry} domain=${hostname}`;
  // Clear on wildcard hostname
  document.cookie = `googtrans=; ${expiry} domain=.${hostname}`;
  // Clear on root domain
  document.cookie = `googtrans=; ${expiry} domain=${rootDomain}`;
  // Clear on wildcard root domain
  document.cookie = `googtrans=; ${expiry} domain=.${rootDomain}`;
}

const LanguageSelector = ({
  scrolled,
  isTransparentPage,
}: {
  scrolled: boolean;
  isTransparentPage: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const includedLangs = languages.map((l) => l.code).join(",");

  useEffect(() => {
    loadGoogleTranslate(includedLangs);

    // Sync UI state with saved preference
    const savedLang = localStorage.getItem("user-language") || "en";
    setCurrentLang(savedLang);

    if (savedLang !== "en") {
      // Script already loaded on a previous visit — load and re-apply
      setGoogleTranslateCookie(savedLang);
      // Wait slightly for the element to init, then trigger
      const timeout = setTimeout(() => triggerWithRetry(savedLang), 800);
      return () => clearTimeout(timeout);
    } else {
      // Make sure no stale translation cookie forces a foreign language
      resetToEnglish();
    }
  }, [includedLangs]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (code: string) => {
    setCurrentLang(code);
    setIsOpen(false);
    localStorage.setItem("user-language", code);

    if (code === "en") {
      // Restore original English: Clear cookies and reload to restore the clean, default React DOM
      resetToEnglish();
      window.location.reload();
      return;
    }

    // Non-English: trigger translation immediately without reload
    setGoogleTranslateCookie(code);
    triggerWithRetry(code);
  };

  const isDark = scrolled || !isTransparentPage;
  const textColor = isDark ? "text-gray-700" : "text-white";
  const bgColor = isDark ? "bg-white/90" : "bg-white/10";
  const hoverBgColor = isDark ? "hover:bg-gray-100" : "hover:bg-white/20";

  const currentLanguageDetails =
    languages.find((l) => l.code === currentLang) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all duration-300 group focus:outline-none ${
          isDark
            ? "border-gray-200 shadow-sm hover:border-hospital-teal/30 hover:shadow-md"
            : "border-white/20 hover:border-white/40 shadow-none"
        } ${bgColor} ${hoverBgColor}`}
      >
        <div
          className={`p-1 rounded-full transition-colors duration-300 ${
            isDark
              ? "bg-hospital-teal/10 text-hospital-teal"
              : "bg-white/20 text-white"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
        </div>
        <span
          className={`text-[13px] font-bold tracking-tight uppercase ${textColor} notranslate`}
        >
          {currentLanguageDetails.code}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-500 ${isOpen ? "rotate-180" : ""} ${textColor} opacity-60`}
        />
      </button>

      {/* Language Selection List */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-48 max-h-[400px] overflow-y-auto bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] z-[100] animate-in fade-in slide-in-from-top-2 duration-200 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <div className="sticky top-0 bg-white/95 backdrop-blur-md px-4 py-2.5 border-b border-gray-50 flex items-center justify-between z-10">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.1em] notranslate">
              Translate
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
          </div>
          <div className="p-1.5 flex flex-col gap-0.5">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                  currentLang === lang.code
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                <span className="flex items-center gap-2 notranslate">
                  <span className="w-6 text-[10px] font-bold tracking-wider opacity-60 uppercase flex-shrink-0">
                    {lang.flag}
                  </span>
                  {lang.native}
                </span>
                {currentLang === lang.code && (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <style jsx global>{`
        #google_translate_element {
          position: fixed !important;
          left: -9999px !important;
          top: 0 !important;
          width: 1px !important;
          height: 1px !important;
          overflow: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        body {
          top: 0 !important;
        }
        .goog-te-banner-frame {
          display: none !important;
        }
        .goog-te-gadget {
          font-size: 0 !important;
        }
      `}</style>
    </div>
  );
};

export default LanguageSelector;
