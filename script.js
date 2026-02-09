// MM Export Brokerage — i18n toggle (EN/ES) + year
(function () {
  const html = document.documentElement;
  const btn = document.getElementById("langToggle");
  const year = document.getElementById("year");

  // --- config (edita acá 1 sola vez) ---
  const CONTACT = {
    email: "sales@mmexportbrokerage.com",
    whatsapp: "5492614606949", // sin +, sin espacios
    whatsappLabel: "+54 9 261 460 6949",
  };

  // Actualiza cualquier link placeholder si existe
  function patchContact() {
    // mailto
    const mailto = `mailto:${CONTACT.email}?subject=RFQ%20-%20MM%20Export%20Brokerage&body=Product%2FSpec%3A%0APackaging%3A%0AVolume%3A%0ADestination%3A%0AIncoterm%20(FOB%2FCIF)%3A%0ACompliance%20requirements%3A`;
    document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
      a.setAttribute("href", mailto);
      if (a.textContent.includes("@")) a.textContent = CONTACT.email;
    });

    // wa.me
    const wa = `https://wa.me/${CONTACT.whatsapp}`;
    document.querySelectorAll('a[href*="wa.me/"]').forEach(a => {
      a.setAttribute("href", wa);
      if (a.textContent.toLowerCase().includes("whatsapp")) return;
      // si el link es el número, lo setea
      if (a.textContent.includes("+") || a.textContent.match(/\d{6,}/)) {
        a.textContent = CONTACT.whatsappLabel;
      }
    });
  }

  function setLang(lang) {
    const next = lang === "es" ? "es" : "en";
    html.setAttribute("data-lang", next);
    html.setAttribute("lang", next === "es" ? "es" : "en");
    if (btn) btn.textContent = next.toUpperCase();
    try { localStorage.setItem("mm_lang", next); } catch (_) {}
  }

  function getInitialLang() {
    try {
      const saved = localStorage.getItem("mm_lang");
      if (saved === "en" || saved === "es") return saved;
    } catch (_) {}

    // por defecto: si el navegador está en español, arrancamos ES
    const nav = (navigator.language || "").toLowerCase();
    if (nav.startsWith("es")) return "es";
    return "en";
  }

  // init
  patchContact();
  setLang(getInitialLang());
  if (year) year.textContent = String(new Date().getFullYear());

  if (btn) {
    btn.addEventListener("click", () => {
      const current = html.getAttribute("data-lang") || "en";
      setLang(current === "en" ? "es" : "en");
    });
  }
})();