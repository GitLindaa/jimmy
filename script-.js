(() => {
  // constants
  const PASS = "jimmy2026";

  // helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function parseData(id) {
    try { return JSON.parse($(id)?.textContent || "[]"); }
    catch { return []; }
  }

  function saveSet(key, set) {
    localStorage.setItem(key, JSON.stringify([...set]));
  }

  // data & state
  const jobs = parseData("#jobs-data");
  const schools = parseData("#schools-data");
  const jobsById = Object.fromEntries(jobs.map(item => [item.id, item]));
  const schoolsById = Object.fromEntries(schools.map(item => [item.id, item]));

  const savedJobs = new Set(JSON.parse(localStorage.getItem("savedJobs") || "[]"));
  const savedSchools = new Set(JSON.parse(localStorage.getItem("savedSchools") || "[]"));
  let modalType = null;
  let modalId = null;

  // login
  function initLogin() {
    const gate = $("#gate");
    const content = $("#content");
    const input = $("#pw");
    const error = $("#pw-error");
    const submit = $("#gate-submit");
    if (!gate || !content) return;

    function open() {
      gate.classList.add("hidden");
      content.classList.add("visible");
      document.body.classList.add("unlocked");
    }

    function fail() {
      error?.classList.add("show");
      setTimeout(() => error?.classList.remove("show"), 1800);
      if (input) input.value = "";
      input?.focus();
    }

    function tryLogin() {
      if ((input?.value || "").trim() === PASS) {
        sessionStorage.setItem("auth", "1");
        open();
      } else {
        fail();
      }
    }

    if (sessionStorage.getItem("auth") === "1") open();
    else input?.focus();

    submit?.addEventListener("click", tryLogin);
    input?.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        tryLogin();
      }
    });
  }

  // mobile navigation
  function initMobileNav() {
    const toggle   = $(".menu-toggle");
    const drawer   = document.getElementById("nav-drawer");
    const backdrop = document.getElementById("nav-backdrop");
    const closeBtn = document.querySelector(".nav-close");
    const panel    = document.getElementById("primary-nav");
    if (!toggle || !drawer) return;

    function openMenu() {
      drawer.classList.add("open");
      drawer.setAttribute("aria-hidden", "false");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Menu sluiten");
      document.body.style.overflow = "hidden";
    }

    function closeMenu() {
      drawer.classList.remove("open");
      drawer.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Menu openen");
      document.body.style.overflow = "";
    }

    toggle.addEventListener("click", () => {
      drawer.classList.contains("open") ? closeMenu() : openMenu();
    });

    if (closeBtn) closeBtn.addEventListener("click", closeMenu);
    if (backdrop) backdrop.addEventListener("click", closeMenu);

    if (panel) panel.addEventListener("click", event => {
      if (event.target.closest("a")) closeMenu();
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && drawer.classList.contains("open")) {
        closeMenu();
        toggle.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) closeMenu();
    });
  }

  // saved items
  function renderSavedJobs() {
    $$("[data-job-id]").forEach(card => {
      const id = card.dataset.jobId;
      const saved = savedJobs.has(id);
      card.classList.toggle("is-saved", saved);
      const btn = $("[data-save-job]", card);
      if (btn) {
        btn.textContent = saved ? "✓ Bewaard" : "Bewaar";
        btn.classList.toggle("is-saved", saved);
      }
    });

    const count = $("[data-job-count]");
    if (count) count.textContent = savedJobs.size;

    const list = $("[data-job-list]");
    if (!list) return;

    const ids = [...savedJobs];
    const MAX_VISIBLE = 3;

    if (!ids.length) {
      list.innerHTML = "<p>Bewaar wat nieuwsgierigheid oproept.</p>";
      return;
    }

    const visibleIds  = ids.slice(0, MAX_VISIBLE);
    const hiddenIds   = ids.slice(MAX_VISIBLE);
    const extraCount  = hiddenIds.length;

    const itemHTML = id => {
      const item = jobsById[id];
      if (!item) return "";
      return `<div class="saved-item" data-remove-job="${id}"><div><strong>${item.title}</strong></div><button type="button">×</button></div>`;
    };

    let html = visibleIds.map(itemHTML).join("");

    if (extraCount > 0) {
      html += `<button class="saved-expand-btn" type="button" data-expand-saved>+${extraCount} meer</button>`;
      html += `<div class="saved-extra" hidden>${hiddenIds.map(itemHTML).join("")}</div>`;
    }

    list.innerHTML = html;

    const expandBtn = $("[data-expand-saved]", list);
    if (expandBtn) {
      expandBtn.addEventListener("click", () => {
        const extra = $(".saved-extra", list);
        if (extra) extra.hidden = false;
        expandBtn.hidden = true;
      });
    }
  }

  function renderSavedSchools() {
    $$("[data-school-id]").forEach(card => {
      const id = card.dataset.schoolId;
      const saved = savedSchools.has(id);
      card.classList.toggle("is-saved", saved);
      const btn = $("[data-save-school]", card);
      if (btn) {
        btn.textContent = saved ? "✓ Bewaard" : "☆ Bewaar";
        btn.classList.toggle("is-saved", saved);
      }
    });

    const count = $("[data-school-count]");
    if (count) count.textContent = savedSchools.size;

    const compareBtn = $("[data-open-compare]");
    if (compareBtn) compareBtn.disabled = savedSchools.size < 2;

    const list = $("[data-school-list]");
    if (!list) return;
    list.innerHTML = savedSchools.size
      ? [...savedSchools].map(id => {
          const item = schoolsById[id];
          if (!item) return "";
          return `<div class="saved-item" data-remove-school="${id}"><div><strong>${item.name}</strong><p>${item.travel || ""} · ${item.levels || ""}</p></div><button type="button">×</button></div>`;
        }).join("")
      : "<p>Bewaar scholen die je interessant vindt.</p>";

  }

  // modals
  function openModal(type, id) {
    const modal = $("[data-modal]");
    if (!modal) return;

    modalType = type;
    modalId = id;
    modal.dataset.modalType = type;
    const item = type === "job" ? jobsById[id] : schoolsById[id];
    if (!item) return;

    const modalKicker = $("[data-modal-kicker]");
    if (modalKicker) {
      if (type === "job") {
        const card = $(`[data-job-id="${id}"]`);
        const cardEyebrow = card ? ($(".eyebrow", card) || {}).textContent : null;
        modalKicker.textContent = cardEyebrow || item.nr ? (cardEyebrow || `Beroep ${item.nr}`) : "";
      } else {
        modalKicker.textContent = item.tag || "School";
      }
    }

    const title = $("[data-modal-title]");
    if (title) title.textContent = item.title || item.name || "";

    const modalSubtitle = $("[data-modal-subtitle]");
    if (modalSubtitle) {
      modalSubtitle.textContent = item.subtitle ? `(${item.subtitle})` : "";
      modalSubtitle.hidden = !item.subtitle;
    }

    const short = $("[data-modal-short]");
    if (short) short.textContent = item.short || `${item.location || ""} · ${item.travel || ""}`;

    const label1 = $("[data-modal-label-1]");
    if (label1) label1.textContent = type === "job" ? "Wat is dit?" : "Waarom misschien passend?";

    const body1 = $("[data-modal-body-1]");
    if (body1) body1.textContent = type === "job" ? item.what || "" : item.why || "";

    const label2 = $("[data-modal-label-2]");
    if (label2) label2.textContent = type === "job" ? "Waarom misschien interessant?" : "Waar op letten?";

    const body2 = $("[data-modal-body-2]");
    if (body2) body2.textContent = type === "job" ? item.why || "" : item.watch || "";

    const extraSchoolBlock = $("[data-modal-school-extra]");
    if (extraSchoolBlock) extraSchoolBlock.hidden = type !== "school";

    const label4 = $("[data-modal-label-4]");
    if (label4) label4.textContent = "Sfeer";

    const body4 = $("[data-modal-body-4]");
    if (body4) {
      body4.textContent = type === "school"
        ? `${item.vibe || "Sfeer nog checken"}. Let op of de klas, mentor en manier van lesgeven rustig genoeg voelen.`
        : "";
    }

    const label3 = $("[data-modal-label-3]");
    if (label3) {
      label3.textContent = type === "job"
        ? "Hoe kun je hier komen?"
        : item.practical ? "Praktisch / OV / reizen" : "OV / reizen";
    }

    const body3 = $("[data-modal-body-3]");
    if (body3) {
      body3.textContent = type === "job"
        ? item.route || ""
        : [item.practical, item.route].filter(Boolean).join(" ");
    }

    const saveBtn = $("[data-modal-save]");
    if (saveBtn) {
      const saved = type === "job" ? savedJobs.has(id) : savedSchools.has(id);
      saveBtn.textContent = saved ? "✓ Bewaard" : "☆ Bewaar";
      saveBtn.classList.toggle("is-saved", saved);
    }

    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    const modal = $("[data-modal]");
    if (modal) {
      modal.hidden = true;
      delete modal.dataset.modalType;
    }
    document.body.style.overflow = "";
    modalType = null;
    modalId = null;
  }

  // compare
  function renderCompare() {
    const selected = [...savedSchools].map(id => schoolsById[id]).filter(Boolean);
    const table = $("[data-compare-table]");
    if (!table) return;

    const rows = [
      ["Locatie", "location"],
      ["Reistijd", "travel"],
      ["Niveaus", "levels"],
      ["Vmbo-t", "vmbo"],
      ["Havo", "havo"],
      ["Klein/groot", "size"],
      ["Past bij", "why"],
      ["Let op", "watch"]
    ];

    table.style.setProperty("--compare-cols", Math.max(selected.length, 2));

    let desktop = `<div class="compare-desktop-table">`;
    desktop += `<div class="compare-cell heading"></div>`;
    desktop += selected.map(s => `<div class="compare-cell heading">${s.name}</div>`).join("");
    rows.forEach(([label, key]) => {
      desktop += `<div class="compare-cell label">${label}</div>`;
      desktop += selected.map(s => `<div class="compare-cell">${s[key] || ""}</div>`).join("");
    });
    desktop += `</div>`;

    let mobile = `<div class="compare-mobile-cards">`;
    mobile += selected.map(s => {
      const items = rows.map(([label, key]) => `
        <div class="compare-mobile-row">
          <span>${label}</span>
          <p>${s[key] || ""}</p>
        </div>
      `).join("");

      return `
        <article class="compare-mobile-card">
          <h4>${s.name}</h4>
          ${items}
        </article>
      `;
    }).join("");
    mobile += `</div>`;

    table.innerHTML = desktop + mobile;
  }

  // week tabs
  function initWeekTabs() {
    const pin = $("[data-week-pin]");
    if (!pin) localStorage.removeItem("week2Pinned");

    function isWeekPinned() {
      return Boolean(pin) && localStorage.getItem("week2Pinned") === "1";
    }

    function show(name) {
      $$("[data-week-show]").forEach(btn => btn.classList.toggle("is-active", btn.dataset.weekShow === name));
      $$("[data-week-panel]").forEach(panel => {
        if (isWeekPinned() && panel.dataset.weekPanel === "week-2") panel.hidden = false;
        else panel.hidden = panel.dataset.weekPanel !== name;
      });
    }

    $$("[data-week-show]").forEach(btn => {
      btn.addEventListener("click", () => show(btn.dataset.weekShow));
    });

    function updatePin() {
      const pinned = isWeekPinned();
      pin?.classList.toggle("is-active", pinned);
      if (pin) pin.textContent = pinned ? "Volgende week staat vast" : "Volgende week vastzetten";
      show("week-1");
    }

    pin?.addEventListener("click", () => {
      const pinned = isWeekPinned();
      localStorage.setItem("week2Pinned", pinned ? "0" : "1");
      updatePin();
    });

    updatePin();
  }


  // flipcards
  function initFlipcards() {
    const data = parseData("#flipcards-data");
    if (!data.length) return;

    const sets = Object.fromEntries(data.map(set => [set.id, set]));
    let activeSetId = data.find(set => set.active && set.cards.length)?.id || data[0].id;

    // Queue: cards still to master in this session (copies, not originals)
    let queue = [];
    let mastered = 0;
    let isFlipped = false;

    // DOM refs
    const scene      = $("[data-flip-scene]");
    const inner      = $("[data-flip-inner]");
    const frontEl    = $("[data-flip-face-front] [data-flip-front]");
    const backEl     = $("[data-flip-back]");
    const exampleEl  = $("[data-flip-example]");
    const subjectEl  = $("[data-flip-subject]");
    const progressEl = $("[data-flip-progress]");
    const emptyEl    = $("[data-flip-empty]");
    const flipCard   = $("[data-flip-card]");
    const masteredEl = $("[data-flip-mastered]");
    const totalEl    = $("[data-flip-total]");
    const barFill    = $("[data-panel-bar-fill]");
    const rewardBox  = $("[data-reward-box]");
    const rewardTitle= $("[data-reward-title]");
    const rewardText = $("[data-reward-text]");

    // Build a fresh shuffled queue from the active set
    function buildQueue(shuffle) {
      const set = sets[activeSetId];
      queue = set.cards.map((card, i) => ({ ...card, _orig: i }));
      if (shuffle) shuffleArray(queue);
      mastered = 0;
      isFlipped = false;
    }

    function shuffleArray(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }

    function currentCard() {
      return queue[0] || null;
    }

    function renderDeckCounts() {
      data.forEach(set => {
        const el = document.querySelector(`[data-deck-count="${set.id}"]`);
        if (el) el.textContent = `${set.cards.length} kaart${set.cards.length === 1 ? "" : "en"}`;
      });
    }

    function renderPanel() {
      const total = sets[activeSetId].cards.length;
      if (masteredEl) masteredEl.textContent = mastered;
      if (totalEl)    totalEl.textContent    = total;
      const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
      if (barFill) barFill.style.width = pct + "%";

      const done = mastered >= total && total > 0;
      if (rewardBox) rewardBox.hidden = !done;
      if (done && rewardText) {
        rewardText.textContent = "Alle kaarten beheerst. Mooi werk.";
      }
    }

    function animateChange() {
      if (!scene) return;
      scene.classList.remove("is-changing");
      void scene.offsetWidth; // reflow
      scene.classList.add("is-changing");
    }

    function renderFlipcard() {
      const card = currentCard();
      const set  = sets[activeSetId];
      const hasCards = set.cards.length > 0;
      const inProgress = queue.length > 0;

      flipCard?.classList.toggle("is-empty", !inProgress);

      // Subject + progress
      if (subjectEl) subjectEl.textContent = set.subject;
      if (progressEl) {
        if (!hasCards) {
          progressEl.textContent = "0 kaarten";
        } else {
          const remaining = queue.length;
          progressEl.textContent = remaining > 0
            ? `nog ${remaining} / ${set.cards.length}`
            : "Klaar 🎉";
        }
      }

      // Show/hide empty state
      if (emptyEl) emptyEl.hidden = hasCards;
      if (scene)   scene.style.display = hasCards ? "" : "none";

      if (card) {
        // Reset flip to front
        if (inner) inner.classList.toggle("is-flipped", isFlipped);
        if (frontEl)  frontEl.textContent  = card.front;
        if (backEl)   backEl.textContent   = card.back;
        if (exampleEl) exampleEl.textContent = card.example || "";
      }

      $$("[data-flip-set]").forEach(btn => {
        btn.classList.toggle("is-active", btn.dataset.flipSet === activeSetId);
      });

      renderDeckCounts();
      renderPanel();
    }

    function flipCard_() {
      if (!currentCard()) return;
      isFlipped = !isFlipped;
      if (inner) inner.classList.toggle("is-flipped", isFlipped);
    }

    function markKnown() {
      if (!currentCard()) return;
      mastered++;
      queue.shift(); // remove from front
      isFlipped = false;
      animateChange();
      renderFlipcard();
    }

    function markUnknown() {
      if (!currentCard()) return;
      const card = queue.shift();
      queue.push(card); // move to end
      isFlipped = false;
      animateChange();
      renderFlipcard();
    }

    // Deck switch
    $$("[data-flip-set]").forEach(btn => {
      btn.addEventListener("click", () => {
        activeSetId = btn.dataset.flipSet;
        buildQueue(false);
        animateChange();
        renderFlipcard();
      });
    });

    // Click on flip scene / inner to flip
    inner?.addEventListener("click", flipCard_);
    inner?.setAttribute("tabindex", "0");
    inner?.setAttribute("role", "button");
    inner?.setAttribute("aria-label", "Draai kaart om");
    inner?.addEventListener("keydown", e => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); flipCard_(); }
    });

    // Action buttons
    $("[data-flip-known]")?.addEventListener("click", markKnown);
    $("[data-flip-unknown]")?.addEventListener("click", markUnknown);
    $("[data-flip-shuffle]")?.addEventListener("click", () => {
      buildQueue(true);
      animateChange();
      renderFlipcard();
    });

    // Keyboard shortcuts (global, only when not in an input)
    document.addEventListener("keydown", e => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      // Only active when flipcard section is visible
      const section = document.getElementById("oefenen");
      if (!section) return;
      const rect = section.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      if (e.key === " ") { e.preventDefault(); flipCard_(); }
      if (e.key === "ArrowRight") { e.preventDefault(); markKnown(); }
      if (e.key === "ArrowDown")  { e.preventDefault(); markUnknown(); }
    });

    // Init
    buildQueue(false);
    renderFlipcard();
  }

  // global click delegation
  document.addEventListener("click", event => {
    const jobSave = event.target.closest("[data-save-job]");
    if (jobSave) {
      const id = jobSave.closest("[data-job-id]")?.dataset.jobId;
      if (id) {
        savedJobs.has(id) ? savedJobs.delete(id) : savedJobs.add(id);
        saveSet("savedJobs", savedJobs);
        renderSavedJobs();
      }
      return;
    }

    const schoolSave = event.target.closest("[data-save-school]");
    if (schoolSave) {
      const id = schoolSave.closest("[data-school-id]")?.dataset.schoolId;
      if (id) {
        savedSchools.has(id) ? savedSchools.delete(id) : savedSchools.add(id);
        saveSet("savedSchools", savedSchools);
        renderSavedSchools();
      }
      return;
    }

    const removeJob = event.target.closest("[data-remove-job]");
    if (removeJob) {
      savedJobs.delete(removeJob.dataset.removeJob);
      saveSet("savedJobs", savedJobs);
      renderSavedJobs();
      return;
    }

    const removeSchool = event.target.closest("[data-remove-school]");
    if (removeSchool) {
      savedSchools.delete(removeSchool.dataset.removeSchool);
      saveSet("savedSchools", savedSchools);
      renderSavedSchools();
      return;
    }

    const openJob = event.target.closest("[data-open-job]");
    if (openJob) {
      const id = openJob.closest("[data-job-id]")?.dataset.jobId;
      if (id) openModal("job", id);
      return;
    }

    const openSchool = event.target.closest("[data-open-school]");
    if (openSchool) {
      const id = openSchool.closest("[data-school-id]")?.dataset.schoolId;
      if (id) openModal("school", id);
      return;
    }

    if (event.target.closest("[data-close-modal]")) {
      closeModal();
      return;
    }

    if (event.target.closest("[data-modal-save]") && modalId) {
      const scrollY = window.scrollY;
      const modal = $("[data-modal]");
      const modalCard = $(".modal-card", modal || document);
      const modalScrollTop = modalCard?.scrollTop || 0;

      const set = modalType === "job" ? savedJobs : savedSchools;
      set.has(modalId) ? set.delete(modalId) : set.add(modalId);
      saveSet(modalType === "job" ? "savedJobs" : "savedSchools", set);
      renderSavedJobs();
      renderSavedSchools();
      openModal(modalType, modalId);

      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
        const refreshedModalCard = $(".modal-card", $("[data-modal]") || document);
        if (refreshedModalCard) refreshedModalCard.scrollTop = modalScrollTop;
      });

      return;
    }

    const filter = event.target.closest("[data-filter]");
    if (filter) {
      const value = filter.dataset.filter;
      $$("[data-filter]").forEach(btn => btn.classList.toggle("is-active", btn === filter));
      $$("[data-school-id]").forEach(card => {
        let show = value === "all";
        if (value === "logical") show = card.dataset.group === "Dichtbij & logisch";
        if (value === "alternative") show = card.dataset.group === "Andere route";
        if (value === "strong") show = card.dataset.match === "sterk";
        if (value === "small") show = (card.dataset.size || "").toLowerCase().includes("klein");
        if (value === "both") show = card.dataset.vmbo === "Ja" && card.dataset.havo === "Ja";
        card.hidden = !show;
      });
      return;
    }

    if (event.target.closest("[data-open-compare]")) {
      renderCompare();
      const compare = $("[data-compare]");
      if (compare) {
        compare.hidden = false;
        compare.scrollIntoView({behavior: "smooth", block: "start"});
      }
      return;
    }

    if (event.target.closest("[data-close-compare]")) {
      const compare = $("[data-compare]");
      if (compare) compare.hidden = true;
      return;
    }

    if (event.target.closest("[data-back-top]")) {
      window.scrollTo({top: 0, behavior: "smooth"});
    }

    // Load more beroepen
    const loadMoreJobs = event.target.closest("#load-more-jobs");
    if (loadMoreJobs) {
      const btn = $("#load-more-jobs");
      if (!btn) return;

      const extras = $$("[data-job-extra], .beroep-hidden");
      extras.forEach(el => {
        el.dataset.jobExtra = "true";
      });

      const expanded = btn.dataset.expanded === "true";
      extras.forEach(el => {
        el.classList.toggle("beroep-hidden", expanded);
      });

      btn.dataset.expanded = expanded ? "false" : "true";
      btn.setAttribute("aria-expanded", expanded ? "false" : "true");
      btn.textContent = expanded ? "↓ Meer beroepen laden" : "↑ Minder beroepen tonen";

      if (expanded) {
        requestAnimationFrame(() => {
          btn.scrollIntoView({behavior: "smooth", block: "center"});
        });
      }
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal();
  });

  // init
  initLogin();
  initMobileNav();
  initWeekTabs();
  initFlipcards();
  renderSavedJobs();
  renderSavedSchools();

  // animations

  // ① Mario: benen wisselen om de 350ms
  (function() {
    let frame = 0;
    const char = document.getElementById("mario-char");
    if (!char) return;
    setInterval(() => {
      frame = 1 - frame;
      const legEls  = char.querySelectorAll(".leg-l, .leg-r");
      const shoeEls = char.querySelectorAll(".shoe-l, .shoe-r");
      if (legEls[0])  legEls[0].setAttribute("y",  frame ? "31" : "35");
      if (legEls[1])  legEls[1].setAttribute("y",  frame ? "39" : "35");
      if (shoeEls[0]) shoeEls[0].setAttribute("y", frame ? "38" : "42");
      if (shoeEls[1]) shoeEls[1].setAttribute("y", frame ? "46" : "42");
    }, 350);
  })();

  // ④ Drijvende woorden op canvas
  (function() {
    const canvas = document.getElementById("art-words-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const woorden = [
      "wiskunde","verhalen","code","schaken","gitaar","ontdekken",
      "havo","toets","proberen","bouwen","tekenen","nieuwsgierig",
      "scheikunde","Frans","natuur","Amstelveen","level","spelen",
      "denken","idee","muziek","toekomst","kijken","begrijpen"
    ];

    let W, H, particles = [];

    function resize() {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W; canvas.height = H;
    }
    resize();
    window.addEventListener("resize", resize);

    function spawn(i) {
      return {
        word: woorden[i % woorden.length],
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: Math.random() * 0.3 + 0.1,
        size: Math.floor(Math.random() * 10 + 11),
        alpha: Math.random() * 0.06 + 0.03
      };
    }

    particles = Array.from({length: 24}, (_, i) => spawn(i));

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.font = "500 {size}px Karla, sans-serif";
      particles.forEach(p => {
        ctx.font = `500 ${p.size}px Karla, sans-serif`;
        ctx.fillStyle = `rgba(26,26,46,${p.alpha})`;
        ctx.fillText(p.word, p.x, p.y);
        p.x += p.vx; p.y += p.vy;
        if (p.y > H + 30) { p.y = -20; p.x = Math.random() * W; }
        if (p.x > W + 80) p.x = -80;
        if (p.x < -80)    p.x = W + 80;
      });
      requestAnimationFrame(draw);
    }
    draw();
  })();

  // week tabs
  // Verwijder oude afspraken/overzicht-sectie als een browser nog een eerdere HTML-versie heeft geladen.
  (function() {
    const legacyWeekOverview = document.getElementById("week-afspraken");
    if (legacyWeekOverview) legacyWeekOverview.remove();
  })();

  // Week-afspraken: vul Vandaag vanuit de weekitems.
  (function() {
    const dayEl       = document.getElementById("wa-day-name");
    const labelEl     = document.getElementById("wa-today-label");
    const todayCard   = document.getElementById("wa-today");
    const contentEl   = document.getElementById("wa-today-content");
    if (!dayEl || !contentEl) return;

    const dagNamen = ["Zondag","Maandag","Dinsdag","Woensdag","Donderdag","Vrijdag","Zaterdag"];
    const maandNamen = ["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"];
    const now = new Date();
    const dag = now.getDay();
    dayEl.textContent = dagNamen[dag];

    const dateEl = document.getElementById("wa-date");
    if (dateEl) dateEl.textContent = now.getDate() + " " + maandNamen[now.getMonth()];

    const isWeekend = dag === 0 || dag === 6;
    if (todayCard) todayCard.classList.toggle("wa-today--weekend", isWeekend);
    if (labelEl) labelEl.textContent = isWeekend ? "Weekend" : "Vandaag";

    function isoDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return year + "-" + month + "-" + day;
    }

    function nextMonday(date) {
      const next = new Date(date);
      const daysUntilMonday = (8 - next.getDay()) % 7 || 7;
      next.setDate(next.getDate() + daysUntilMonday);
      return isoDate(next);
    }

    function addLine(label, text) {
      const p = document.createElement("p");
      p.className = "wa-routine-line";
      if (label) {
        const strong = document.createElement("strong");
        strong.textContent = label;
        p.append(strong, " " + text);
      } else {
        p.textContent = text;
      }
      contentEl.appendChild(p);
    }

    const today = isoDate(now);
    const items = $$('[data-week-date]').map(card => ({
      date: card.dataset.weekDate,
      type: card.dataset.weekType || "",
      subject: card.dataset.weekSubject || "",
      summary: card.dataset.weekSummary || "",
      actionLabel: card.dataset.weekActionLabel || "",
      action: card.dataset.weekAction || ""
    }));
    const todayItems = items.filter(item => item.date === today);

    contentEl.textContent = "";

    if (!todayItems.length) {
      addLine(null, "Vandaag geen huiswerk of toetsen.");
      addLine(null, "Even vrijhouden. Alleen Magister kort checken.");
    } else {
      todayItems.forEach(item => {
        if (item.type === "meenemen") {
          addLine("Meenemen:", item.summary + ".");
        } else if (item.type === "toets" || item.type === "proefwerk") {
          addLine("Vandaag:", item.subject + " " + item.type + ".");
        } else {
          addLine("Vandaag:", item.summary + ".");
        }

        if (item.actionLabel && item.action) {
          const actionText = item.action.endsWith(".") || item.action.endsWith("?") ? item.action : item.action + ".";
          addLine(item.actionLabel + ":", actionText);
        }
      });

      const hasLearning = todayItems.some(item =>
        item.type === "toets" || item.type === "proefwerk" || item.actionLabel.toLowerCase() === "overhoren"
      );
      if (hasLearning) addLine(null, "Leren en overhoren: maximaal 1,5 uur.");
    }

    const hasMondayPrep = items.some(item => {
      const prepTypes = ["huiswerk", "opdracht", "toets", "proefwerk", "check"];
      return item.date === nextMonday(now) && prepTypes.includes(item.type);
    });
    if (dag === 5 && hasMondayPrep) {
      addLine("Tip voor vrijdag:", "staat er iets voor maandag? Doe het vandaag alvast.");
    }
  })();
})();
