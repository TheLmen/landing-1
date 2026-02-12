// MM Export Brokerage — Enhanced functionality
(function () {
  const html = document.documentElement;
  const langBtn = document.getElementById("langToggle");
  const yearEl = document.getElementById("year");
  const form = document.getElementById("rfqForm");
  const emailBtn = document.getElementById("rfqEmail");
  const whatsappBtn = document.getElementById("rfqWhatsApp");

  // ═══════════════════════════════════════════════════════════
  // CONFIG (edit once)
  // ═══════════════════════════════════════════════════════════
  const CONFIG = {
    email: "sales@mmexportbrokerage.com",
    whatsapp: "5492614606949",
    whatsappLabel: "+54 9 261 460 6949",
    // Formspree endpoint (OPCIONAL - si quieres recibir emails automáticamente)
    // Regístrate gratis en https://formspree.io y pega tu endpoint aquí
    formspreeEndpoint: "", // Ejemplo: "https://formspree.io/f/xpwzabcd"
  };

  // ═══════════════════════════════════════════════════════════
  // i18n (Language Toggle)
  // ═══════════════════════════════════════════════════════════
  const i18n = {
    en: {
      fieldRequired: "This field is required",
      invalidEmail: "Please enter a valid email",
      sending: "Sending...",
      sent: "Sent successfully!",
      error: "Error sending. Please try again.",
      fillRequired: "Please fill in all required fields",
    },
    es: {
      fieldRequired: "Este campo es requerido",
      invalidEmail: "Por favor ingresa un email válido",
      sending: "Enviando...",
      sent: "¡Enviado exitosamente!",
      error: "Error al enviar. Por favor intenta de nuevo.",
      fillRequired: "Por favor completa todos los campos requeridos",
    }
  };

  function t(key) {
    const lang = html.getAttribute("data-lang") || "en";
    return i18n[lang][key] || key;
  }

  function setLang(lang) {
    const next = lang === "es" ? "es" : "en";
    html.setAttribute("data-lang", next);
    html.setAttribute("lang", next === "es" ? "es" : "en");
    if (langBtn) langBtn.textContent = next.toUpperCase();
    try { localStorage.setItem("mm_lang", next); } catch (_) {}
  }

  function getInitialLang() {
    try {
      const saved = localStorage.getItem("mm_lang");
      if (saved === "en" || saved === "es") return saved;
    } catch (_) {}
    const nav = (navigator.language || "").toLowerCase();
    return nav.startsWith("es") ? "es" : "en";
  }

  // ═══════════════════════════════════════════════════════════
  // Contact Links Patch
  // ═══════════════════════════════════════════════════════════
  function patchContactLinks() {
    const mailto = `mailto:${CONFIG.email}?subject=RFQ%20-%20MM%20Export%20Brokerage&body=Product%2FSpec%3A%0APackaging%3A%0AVolume%3A%0ADestination%3A%0AIncoterm%20(FOB%2FCIF)%3A%0ACompliance%20requirements%3A`;
    
    document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
      a.setAttribute("href", mailto);
      if (a.textContent.includes("@")) a.textContent = CONFIG.email;
    });

    const wa = `https://wa.me/${CONFIG.whatsapp}`;
    document.querySelectorAll('a[href*="wa.me/"]').forEach(a => {
      a.setAttribute("href", wa);
      if (a.textContent.toLowerCase().includes("whatsapp")) return;
      if (a.textContent.includes("+") || a.textContent.match(/\d{6,}/)) {
        a.textContent = CONFIG.whatsappLabel;
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // Form Validation
  // ═══════════════════════════════════════════════════════════
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showError(input, message) {
    const group = input.closest(".form__group");
    let error = group.querySelector(".form__error");
    
    if (!error) {
      error = document.createElement("div");
      error.className = "form__error";
      group.appendChild(error);
    }
    
    error.textContent = message;
    input.classList.add("form__input--error");
  }

  function clearError(input) {
    const group = input.closest(".form__group");
    const error = group.querySelector(".form__error");
    if (error) error.remove();
    input.classList.remove("form__input--error");
  }

  function validateForm() {
    let isValid = true;
    
    // Product (required)
    const product = form.querySelector("#rfq-product");
    if (!product.value.trim()) {
      showError(product, t("fieldRequired"));
      isValid = false;
    } else {
      clearError(product);
    }
    
    // Email (required + format)
    const email = form.querySelector("#rfq-email");
    if (!email.value.trim()) {
      showError(email, t("fieldRequired"));
      isValid = false;
    } else if (!validateEmail(email.value)) {
      showError(email, t("invalidEmail"));
      isValid = false;
    } else {
      clearError(email);
    }
    
    return isValid;
  }

  // Real-time validation
  if (form) {
    const inputs = form.querySelectorAll("input[required], input[type='email']");
    inputs.forEach(input => {
      input.addEventListener("blur", () => {
        if (input.hasAttribute("required") && !input.value.trim()) {
          showError(input, t("fieldRequired"));
        } else if (input.type === "email" && input.value && !validateEmail(input.value)) {
          showError(input, t("invalidEmail"));
        } else {
          clearError(input);
        }
      });
      
      input.addEventListener("input", () => {
        if (input.classList.contains("form__input--error")) {
          clearError(input);
        }
      });
    });
  }

  // ═══════════════════════════════════════════════════════════
  // Get Form Data
  // ═══════════════════════════════════════════════════════════
  function getFormData() {
    return {
      product: form.querySelector("#rfq-product").value.trim(),
      spec: form.querySelector("#rfq-spec").value.trim(),
      volume: form.querySelector("#rfq-volume").value.trim(),
      destination: form.querySelector("#rfq-destination").value.trim(),
      incoterm: form.querySelector("#rfq-incoterm").value.trim(),
      email: form.querySelector("#rfq-email").value.trim(),
      whatsapp: form.querySelector("#rfq-whatsapp").value.trim(),
    };
  }

  // ═══════════════════════════════════════════════════════════
  // Send via Email (Formspree or mailto)
  // ═══════════════════════════════════════════════════════════
  async function sendViaEmail(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification(t("fillRequired"), "error");
      return;
    }
    
    const data = getFormData();
    
    // Si hay endpoint de Formspree configurado, usarlo
    if (CONFIG.formspreeEndpoint) {
      setButtonLoading(emailBtn, true);
      
      try {
        const response = await fetch(CONFIG.formspreeEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          showNotification(t("sent"), "success");
          form.reset();
        } else {
          throw new Error("Failed to send");
        }
      } catch (error) {
        console.error(error);
        showNotification(t("error"), "error");
      } finally {
        setButtonLoading(emailBtn, false);
      }
    } else {
      // Fallback: usar mailto
      const subject = `RFQ - ${data.product}`;
      const body = `
Product/Spec: ${data.product}${data.spec ? ' - ' + data.spec : ''}
Volume: ${data.volume || 'N/A'}
Destination: ${data.destination || 'N/A'}
Incoterm: ${data.incoterm || 'N/A'}

Contact:
Email: ${data.email}
WhatsApp: ${data.whatsapp || 'N/A'}
      `.trim();
      
      window.location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      showNotification(t("sent"), "success");
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Send via WhatsApp
  // ═══════════════════════════════════════════════════════════
  function sendViaWhatsApp() {
    if (!validateForm()) {
      showNotification(t("fillRequired"), "error");
      return;
    }
    
    const data = getFormData();
    const message = `
Hi MM Export Brokerage — I'd like a quote.

Product/Spec: ${data.product}${data.spec ? ' - ' + data.spec : ''}
Packaging: ${data.spec || 'N/A'}
Volume: ${data.volume || 'N/A'}
Destination: ${data.destination || 'N/A'}
Incoterm: ${data.incoterm || 'FOB/CIF'}

Contact:
Email: ${data.email}
WhatsApp: ${data.whatsapp || 'N/A'}
    `.trim();
    
    const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  // ═══════════════════════════════════════════════════════════
  // UI Helpers
  // ═══════════════════════════════════════════════════════════
  function setButtonLoading(button, loading) {
    if (loading) {
      button.dataset.originalText = button.textContent;
      button.textContent = t("sending");
      button.disabled = true;
      button.style.opacity = "0.6";
    } else {
      button.textContent = button.dataset.originalText || button.textContent;
      button.disabled = false;
      button.style.opacity = "1";
    }
  }

  function showNotification(message, type = "info") {
    // Remove existing notifications
    const existing = document.querySelector(".notification");
    if (existing) existing.remove();
    
    const notification = document.createElement("div");
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add("notification--show"), 10);
    
    // Auto-remove after 4s
    setTimeout(() => {
      notification.classList.remove("notification--show");
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  // ═══════════════════════════════════════════════════════════
  // Smooth Scroll Polyfill (Safari)
  // ═══════════════════════════════════════════════════════════
  function smoothScrollTo(target) {
    const element = document.querySelector(target);
    if (!element) return;
    
    const offsetTop = element.getBoundingClientRect().top + window.pageYOffset - 80;
    
    if ('scrollBehavior' in document.documentElement.style) {
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    } else {
      window.scrollTo(0, offsetTop);
    }
  }

  // Handle anchor links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", (e) => {
      const target = link.getAttribute("href");
      if (target && target !== "#") {
        e.preventDefault();
        smoothScrollTo(target);
        history.pushState(null, "", target);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Event Listeners
  // ═══════════════════════════════════════════════════════════
  if (langBtn) {
    langBtn.addEventListener("click", () => {
      const current = html.getAttribute("data-lang") || "en";
      setLang(current === "en" ? "es" : "en");
    });
  }

  if (form && emailBtn) {
    form.addEventListener("submit", sendViaEmail);
  }

  if (whatsappBtn) {
    whatsappBtn.addEventListener("click", sendViaWhatsApp);
  }

  // ═══════════════════════════════════════════════════════════
  // Mobile Menu Toggle
  // ═══════════════════════════════════════════════════════════
  const menuToggle = document.getElementById("menuToggle");
  const nav = document.querySelector(".nav");
  const navOverlay = document.getElementById("navOverlay");
  const body = document.body;

  function openMenu() {
    menuToggle?.classList.add("active");
    nav?.classList.add("active");
    navOverlay?.classList.add("active");
    body.classList.add("menu-open");
    if (navOverlay) navOverlay.style.display = "block";
  }

  function closeMenu() {
    menuToggle?.classList.remove("active");
    nav?.classList.remove("active");
    navOverlay?.classList.remove("active");
    body.classList.remove("menu-open");
    setTimeout(() => {
      if (navOverlay && !navOverlay.classList.contains("active")) {
        navOverlay.style.display = "none";
      }
    }, 300);
  }

  function toggleMenu() {
    if (nav?.classList.contains("active")) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  // Toggle button click
  menuToggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Overlay click to close
  navOverlay?.addEventListener("click", closeMenu);

  // Close menu when clicking nav links
  nav?.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  // Close menu on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav?.classList.contains("active")) {
      closeMenu();
    }
  });

  // Close menu on window resize to desktop
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth > 960 && nav?.classList.contains("active")) {
        closeMenu();
      }
    }, 250);
  });

  // ═══════════════════════════════════════════════════════════
  // Scroll Animations
  // ═══════════════════════════════════════════════════════════
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, observerOptions);

  // Observe all sections and cards
  document.querySelectorAll(".section, .card, .step").forEach(el => {
    el.classList.add("fade-in");
    observer.observe(el);
  });

  // ═══════════════════════════════════════════════════════════
  // Animated Counters for Stats
  // ═══════════════════════════════════════════════════════════
  function animateCounter(element, target, suffix = "") {
    let current = 0;
    const increment = target / 50;
    const duration = 2000;
    const stepTime = duration / 50;

    const counter = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = target + suffix;
        clearInterval(counter);
      } else {
        element.textContent = Math.floor(current) + suffix;
      }
    }, stepTime);
  }

  // Observe stats for counter animation
  const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;

    const number = entry.target.querySelector(".stat__number");
    if (!number) {
      statsObserver.unobserve(entry.target);
      return;
    }

    const targetRaw = number.dataset.target;
    const target = parseInt(targetRaw, 10);
    if (!Number.isFinite(target)) {
      // Si falta data-target o es inválido, no animamos para evitar NaN
      statsObserver.unobserve(entry.target);
      return;
    }

    const suffix = number.dataset.suffix || "";
    animateCounter(number, target, suffix);
    statsObserver.unobserve(entry.target);
  });
}, { threshold: 0.5 });

  document.querySelectorAll(".stat").forEach(stat => {
    statsObserver.observe(stat);
  });

  // ═══════════════════════════════════════════════════════════
  // Initialize
  // ═══════════════════════════════════════════════════════════
  patchContactLinks();
  setLang(getInitialLang());
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

})();
