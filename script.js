/* ============================================================
   Animations et interactions du site. Rien d'essentiel au
   contenu : si le JavaScript est coupé, tout reste lisible.
   ============================================================ */

(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var toTimecode = function (frames, fps) {
    var s = Math.floor(frames / fps);
    return pad(Math.floor(s / 3600)) + ":" + pad(Math.floor(s / 60) % 60) + ":" + pad(s % 60) + ":" + pad(frames % fps);
  };

  /* --- Rideau d'ouverture : un timecode qui défile puis le rideau se lève --- */
  var introTc = document.getElementById("intro-tc");
  if (reduce) {
    root.classList.add("is-loaded");
  } else {
    var start = performance.now();
    var tickIntro = function (now) {
      var t = now - start;
      if (introTc) { introTc.textContent = toTimecode(Math.floor(t / 40), 25); }
      if (t < 1000) { requestAnimationFrame(tickIntro); }
      else { root.classList.add("is-loaded"); }
    };
    requestAnimationFrame(tickIntro);
    // sécurité si l'onglet est en arrière-plan
    setTimeout(function () { root.classList.add("is-loaded"); }, 1600);
  }

  /* --- Année et heure locale (Paris) dans le pied de page --- */
  var year = document.getElementById("year");
  if (year) { year.textContent = new Date().getFullYear(); }

  var clock = document.getElementById("clock");
  if (clock) {
    var showTime = function () {
      try {
        // À REMPLACER si tu n'es pas à Paris : ex. "America/Montreal"
        clock.textContent = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
      } catch (e) {
        clock.textContent = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      }
    };
    showTime();
    setInterval(showTime, 15000);
  }

  /* --- Hero : timecode "REC" et bouton pause --- */
  var hero = document.querySelector(".hero");
  var heroTc = document.getElementById("hero-tc");
  var pauseBtn = document.getElementById("pause");
  var heroVideo = document.querySelector(".hero__video");
  var paused = reduce;
  var frames = 0;

  function setPaused(p) {
    paused = p;
    hero.classList.toggle("is-paused", p);
    if (pauseBtn) {
      pauseBtn.textContent = p ? "Lecture" : "Pause";
      pauseBtn.setAttribute("aria-pressed", p ? "true" : "false");
    }
    if (heroVideo) { if (p) { heroVideo.pause(); } else { heroVideo.play(); } }
  }
  if (hero) {
    setPaused(paused);
    if (pauseBtn) { pauseBtn.addEventListener("click", function () { setPaused(!paused); }); }
    if (heroTc) {
      setInterval(function () {
        if (!paused) { frames++; heroTc.textContent = toTimecode(frames, 25); }
      }, 40);
    }
  }

  /* --- Menu mobile --- */
  var burger = document.getElementById("burger");
  var menu = document.getElementById("menu");
  function setMenu(open) {
    menu.classList.toggle("is-open", open);
    burger.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  }
  if (burger && menu) {
    burger.addEventListener("click", function () { setMenu(!menu.classList.contains("is-open")); });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) { setMenu(false); burger.focus(); }
    });
  }

  /* --- Apparition des blocs au défilement --- */
  var items = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduce) {
    var revealObs = new IntersectionObserver(function (entries) {
      var i = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) { return; }
        var el = e.target;
        setTimeout(function () { el.classList.add("is-in"); }, i * 80);
        i++;
        revealObs.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -5% 0px" });
    items.forEach(function (el) { revealObs.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* --- Lien actif dans le menu selon la section visible --- */
  var navLinks = document.querySelectorAll('.nav__links a[href^="#"]');
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) { return; }
        navLinks.forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("#travaux, #showreel, #methode, #apropos, #faq, #contact").forEach(function (s) { spy.observe(s); });
  }

  /* --- Phrase d'intro : les mots s'allument un par un au défilement --- */
  var statement = document.querySelector("[data-words]");
  if (statement && !reduce) {
    var words = [];
    var split = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) { return; }
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            var span = document.createElement("span");
            span.className = "w";
            span.textContent = part;
            words.push(span);
            frag.appendChild(span);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          split(child);
        }
      });
    };
    split(statement);

    var lightWords = function () {
      var r = statement.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.85 - r.top) / (r.height + vh * 0.3);
      p = Math.max(0, Math.min(1, p));
      var lit = Math.round(p * words.length);
      words.forEach(function (w, i) { w.classList.toggle("is-lit", i < lit); });
    };
    window.addEventListener("scroll", lightWords, { passive: true });
    window.addEventListener("resize", lightWords);
    lightWords();
  }

  /* --- Bascule Liste / Grille des projets --- */
  var work = document.querySelector(".work");
  var toggles = document.querySelectorAll(".view-toggle__btn");
  toggles.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var grid = btn.getAttribute("data-view") === "grid";
      work.classList.toggle("is-grid", grid);
      toggles.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    });
  });

  /* --- Aperçu du projet qui suit la souris (vue liste, ordinateur) --- */
  var preview = document.querySelector(".cursor-preview");
  var previewInner = preview && preview.querySelector(".cursor-preview__inner");
  if (preview && finePointer && !reduce) {
    var mx = 0, my = 0, px = 0, py = 0, running = false;
    var follow = function () {
      px += (mx - px) * 0.14;
      py += (my - py) * 0.14;
      preview.style.left = px + "px";
      preview.style.top = py + "px";
      if (running) { requestAnimationFrame(follow); }
    };
    document.querySelectorAll(".project a").forEach(function (link) {
      link.addEventListener("mouseenter", function (e) {
        if (work.classList.contains("is-grid") || window.innerWidth <= 820) { return; }
        var img = link.getAttribute("data-img");
        previewInner.className = "cursor-preview__inner " + (img ? "" : link.getAttribute("data-thumb"));
        previewInner.style.backgroundImage = img ? "url('" + img + "')" : "";
        if (!running) { px = e.clientX; py = e.clientY; }
        mx = e.clientX; my = e.clientY;
        preview.classList.add("is-visible");
        if (!running) { running = true; requestAnimationFrame(follow); }
      });
      link.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; });
      link.addEventListener("mouseleave", function () {
        preview.classList.remove("is-visible");
        setTimeout(function () { if (!preview.classList.contains("is-visible")) { running = false; } }, 450);
      });
    });
  }

  /* --- Bouton "Me contacter" magnétique (attiré par la souris) --- */
  if (finePointer && !reduce) {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      var label = el.querySelector("span");
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2);
        var y = e.clientY - (r.top + r.height / 2);
        el.style.transform = "translate(" + x * 0.3 + "px," + y * 0.3 + "px)";
        if (label) { label.style.transform = "translate(" + x * 0.15 + "px," + y * 0.15 + "px)"; }
      });
      el.addEventListener("mouseleave", function () {
        el.style.transition = "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), background 0.35s, color 0.35s";
        el.style.transform = "";
        if (label) { label.style.transform = ""; }
        setTimeout(function () { el.style.transition = ""; }, 600);
      });
    });
  }
})();
