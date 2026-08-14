(function () {
  const isEnglish = document.documentElement.lang === "en";
  const copy = isEnglish
    ? {
        step1: "01 Buyer profile",
        step2: "02 Product requirements",
        next: "Continue to specifications",
        back: "Back to buyer details",
        required: "Please complete this field so the factory can qualify the request.",
        whatsapp: "WhatsApp",
        quote: "Request quote",
        documentTitle: "Technical document status",
        documentBody:
          "Product data sheet, applicable test report and declaration slots are reserved. Files will only be published after verification for this exact SKU.",
        finderAdded: "Product direction added to your RFQ notes.",
      }
    : {
        step1: "01 买家信息",
        step2: "02 产品需求",
        next: "继续填写产品规格",
        back: "返回买家信息",
        required: "请填写此项，便于工厂判断询盘并准确回复。",
        whatsapp: "WhatsApp",
        quote: "提交询价",
        documentTitle: "技术文件状态",
        documentBody: "产品数据表、适用测试报告及声明文件位置已预留。仅在对应 SKU 文件核验后正式发布。",
        finderAdded: "产品方向已加入询盘备注。",
      };

  const normalizeCategory = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/(?:gloves?|series|系列|手套)/g, "");

  function showLocalToast(message) {
    if (typeof window.showToast === "function") {
      window.showToast(message);
      return;
    }
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 2400);
  }

  function initializeGuidedFinder() {
    document.querySelectorAll("[data-guide-category]").forEach((button) => {
      button.addEventListener("click", () => {
        const requestedCategory = button.dataset.guideCategory || "";
        const requestedKey = normalizeCategory(requestedCategory);
        const tabs = [...document.querySelectorAll("#categoryTabs button")];
        const categoryTab = tabs.find(
          (tab) => normalizeCategory(tab.textContent) === requestedKey
        );
        if (categoryTab) categoryTab.click();

        const categoryField = document.getElementById("category");
        if (categoryField) {
          const option = [...categoryField.options].find(
            (item) => normalizeCategory(item.textContent) === requestedKey
          );
          if (option) categoryField.value = option.value;
        }

        const note = button.dataset.guideNote;
        const message = document.getElementById("message");
        if (message && note && !message.value.includes(note)) {
          message.value = message.value ? `${message.value}\n${note}` : note;
        }

        document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
        showLocalToast(copy.finderAdded);
      });
    });
  }

  function initializeHeroSkuRail() {
    const track = document.getElementById("heroSkuTrack");
    if (!track || typeof products === "undefined" || !Array.isArray(products) || !products.length) return;

    function createCard(product, duplicate = false) {
      const card = document.createElement("button");
      card.className = "hero-sku-card";
      card.type = "button";
      card.dataset.heroSku = product.id;
      card.dataset.heroCategory = product.category || "";
      card.setAttribute(
        "aria-label",
        isEnglish ? `View ${product.name}` : `查看 ${product.name}`
      );
      if (duplicate) {
        card.tabIndex = -1;
        card.setAttribute("aria-hidden", "true");
      }

      const image = document.createElement("img");
      image.src = product.image;
      image.alt = duplicate ? "" : product.name;
      image.loading = "lazy";

      const cardCopy = document.createElement("span");
      cardCopy.className = "hero-sku-copy";
      const category = document.createElement("small");
      category.textContent = product.category || (isEnglish ? "Leather glove" : "皮革手套");
      const name = document.createElement("strong");
      name.textContent = product.name;
      const action = document.createElement("em");
      action.textContent = isEnglish ? "View SKU →" : "查看详情 →";
      cardCopy.append(category, name, action);
      card.append(image, cardCopy);
      return card;
    }

    const fragment = document.createDocumentFragment();
    products.forEach((product) => fragment.appendChild(createCard(product)));
    products.forEach((product) => fragment.appendChild(createCard(product, true)));
    track.replaceChildren(fragment);

    let resumeTimer = 0;
    let paused = false;
    let lastFrame = 0;
    let autoPosition = track.scrollLeft;

    function pauseTemporarily(delay = 2800) {
      paused = true;
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        paused = false;
      }, delay);
    }

    function loopPoint() {
      return track.children[products.length]?.offsetLeft || track.scrollWidth / 2;
    }

    function animate(timestamp) {
      if (!paused && !document.hidden) {
        const elapsed = lastFrame ? Math.min(timestamp - lastFrame, 50) : 0;
        autoPosition += elapsed * 0.024;
        const resetAt = loopPoint();
        if (autoPosition >= resetAt) autoPosition -= resetAt;
        track.scrollLeft = autoPosition;
      }
      lastFrame = timestamp;
      window.requestAnimationFrame(animate);
    }
    window.requestAnimationFrame(animate);

    track.addEventListener("focusin", () => {
      paused = true;
      window.clearTimeout(resumeTimer);
    });
    track.addEventListener("focusout", () => pauseTemporarily(900));
    track.addEventListener("pointerdown", () => {
      paused = true;
      window.clearTimeout(resumeTimer);
    });
    track.addEventListener("pointerup", () => pauseTemporarily(2200));
    track.addEventListener("pointercancel", () => pauseTemporarily(900));
    track.addEventListener("scroll", () => {
      if (paused) autoPosition = track.scrollLeft;
    });

    document.querySelectorAll("[data-sku-scroll]").forEach((control) => {
      control.addEventListener("click", () => {
        pauseTemporarily(3200);
        const direction = Number(control.dataset.skuScroll) || 1;
        track.scrollBy({ left: direction * Math.max(260, track.clientWidth * 0.82), behavior: "smooth" });
      });
    });

    track.addEventListener("click", (event) => {
      const card = event.target.closest("[data-hero-sku]");
      if (!card) return;
      const requestedKey = normalizeCategory(card.dataset.heroCategory);
      const categoryTab = [...document.querySelectorAll("#categoryTabs button")].find(
        (tab) => normalizeCategory(tab.textContent) === requestedKey
      );
      categoryTab?.click();
      document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
      window.setTimeout(() => {
        document
          .querySelector(`.product-card[data-open-product="${card.dataset.heroSku}"] .product-detail-trigger`)
          ?.click();
      }, 420);
    });
  }

  function initializeProgressiveRfq() {
    const form = document.getElementById("inquiryForm");
    const originalGrid = form?.querySelector(".form-grid");
    if (!form || !originalGrid || form.dataset.progressiveReady === "true") return;

    form.dataset.progressiveReady = "true";
    form.dataset.rfqStep = "1";

    const stepOneNames = new Set(["company", "name", "email", "whatsapp", "market", "quantity", "buyerType"]);
    const stepOne = document.createElement("div");
    const stepTwo = document.createElement("div");
    stepOne.className = "rfq-panel form-grid";
    stepTwo.className = "rfq-panel form-grid";
    stepTwo.hidden = true;

    [...originalGrid.children].forEach((field) => {
      const control = field.querySelector("[name]");
      (control && stepOneNames.has(control.name) ? stepOne : stepTwo).appendChild(field);
    });

    originalGrid.replaceWith(stepOne, stepTwo);

    const progress = document.createElement("div");
    progress.className = "rfq-progress";
    progress.setAttribute("aria-label", isEnglish ? "Inquiry progress" : "询盘填写进度");
    progress.innerHTML = `
      <div class="rfq-progress-step active" data-progress-step="1"><span>01</span>${copy.step1.replace("01 ", "")}</div>
      <div class="rfq-progress-step" data-progress-step="2"><span>02</span>${copy.step2.replace("02 ", "")}</div>
    `;
    form.querySelector(".selected-list")?.after(progress);

    const navigation = document.createElement("div");
    navigation.className = "rfq-navigation";
    navigation.innerHTML = `
      <button class="btn secondary" type="button" data-rfq-back hidden>${copy.back}</button>
      <button class="btn" type="button" data-rfq-next>${copy.next}</button>
    `;
    stepTwo.after(navigation);

    const back = navigation.querySelector("[data-rfq-back]");
    const next = navigation.querySelector("[data-rfq-next]");
    const actions = form.querySelector(".form-actions");

    function setStep(step) {
      const first = step === 1;
      form.dataset.rfqStep = String(step);
      stepOne.hidden = !first;
      stepTwo.hidden = first;
      back.hidden = first;
      next.hidden = !first;
      if (actions) actions.hidden = first;
      progress.querySelectorAll("[data-progress-step]").forEach((item) => {
        item.classList.toggle("active", item.dataset.progressStep === String(step));
      });
      const firstControl = (first ? stepOne : stepTwo).querySelector("input, select, textarea");
      firstControl?.focus({ preventScroll: true });
    }

    function validateStepOne() {
      let valid = true;
      stepOne.querySelectorAll("[required]").forEach((control) => {
        const existingError = control.parentElement.querySelector(".field-error");
        existingError?.remove();
        control.removeAttribute("aria-invalid");
        if (!control.value.trim() || !control.checkValidity()) {
          valid = false;
          control.setAttribute("aria-invalid", "true");
          const error = document.createElement("div");
          error.className = "field-error";
          error.textContent = copy.required;
          control.after(error);
        }
      });
      stepOne.querySelector('[aria-invalid="true"]')?.focus();
      return valid;
    }

    next.addEventListener("click", () => {
      if (!validateStepOne()) return;
      setStep(2);
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    back.addEventListener("click", () => {
      setStep(1);
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    form.addEventListener(
      "submit",
      (event) => {
        if (form.dataset.rfqStep === "1") {
          event.preventDefault();
          if (validateStepOne()) setStep(2);
        }
      },
      true
    );

    setStep(1);
  }

  function enhanceProductDocuments() {
    document.querySelectorAll(".product-modal-info").forEach((modalInfo) => {
      if (modalInfo.querySelector(".product-document-status")) return;
      const status = document.createElement("div");
      status.className = "product-document-status";
      status.innerHTML = `<b>${copy.documentTitle}</b>${copy.documentBody}`;
      const actions = modalInfo.querySelector(".product-modal-actions");
      actions?.before(status);
    });
  }

  function initializeMobileActions() {
    if (document.querySelector(".mobile-trade-actions")) return;
    const bar = document.createElement("div");
    bar.className = "mobile-trade-actions";
    bar.setAttribute("aria-label", isEnglish ? "Quick contact" : "快速联系");
    bar.innerHTML = `
      <a class="btn green" href="https://wa.me/message/JF3NK3JK3BGUG1" target="_blank" rel="noopener">${copy.whatsapp}</a>
      <a class="btn" href="#contact">${copy.quote} <span aria-hidden="true">→</span></a>
    `;
    document.body.appendChild(bar);
  }

  function initializeScrollReveal() {
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = document.querySelectorAll(".finder-card, .quality-step, .document-card");
    targets.forEach((target) => {
      target.style.opacity = "0";
      target.style.transform = "translateY(18px)";
      target.style.transition = "opacity 420ms ease, transform 420ms ease";
    });
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 }
    );
    targets.forEach((target) => observer.observe(target));
  }

  function initialize() {
    initializeHeroSkuRail();
    initializeGuidedFinder();
    initializeProgressiveRfq();
    initializeMobileActions();
    enhanceProductDocuments();
    initializeScrollReveal();

    const observer = new MutationObserver(enhanceProductDocuments);
    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-open-product], [data-view-product]")) {
        window.setTimeout(enhanceProductDocuments, 0);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
