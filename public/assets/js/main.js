/* Ikatá · comportamento da página
   Sem dependências. Cada bloco checa se o elemento existe, assim o mesmo
   arquivo serve para a home e para o aviso de privacidade. */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Configuração
     formEndpoint: rota que recebe o formulário. No ar, é o Worker em src/worker.js,
     que grava no banco D1. Se ficar vazio, o envio abre o app de e-mail com a
     mensagem pronta para contactEmail.
     ------------------------------------------------------------------ */
  var CONFIG = {
    formEndpoint: '/api/contato',
    contactEmail: 'contato@ikata.pro',
    social: {
      instagram: '',
      linkedin: '',
      youtube: '',
      twitch: ''
    }
  };

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { return null; }
  }

  /* ================= Idioma ================= */
  var dict = window.IKATA_I18N || { en: {}, ptRuntime: {} };
  var original = new Map();      // guarda o português que está no HTML
  var originalAttrs = new Map();
  var currentLang = 'pt';
  var ptMeta = {
    title: document.title,
    description: (document.querySelector('meta[name="description"]') || {}).content
  };

  function t(key) {
    if (currentLang === 'en' && dict.en[key]) return dict.en[key];
    return dict.ptRuntime[key] || key;
  }

  function applyLang(lang) {
    currentLang = lang === 'en' ? 'en' : 'pt';
    var en = currentLang === 'en';

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (!original.has(el)) original.set(el, el.innerHTML);
      if (en && dict.en[key]) el.innerHTML = dict.en[key];
      else el.innerHTML = original.get(el);
    });

    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
        var parts = pair.split(':');
        var attr = parts[0].trim();
        var key = parts[1].trim();
        var id = attr + '|' + key;
        var saved = originalAttrs.get(el) || {};
        if (!(id in saved)) { saved[id] = el.getAttribute(attr); originalAttrs.set(el, saved); }
        el.setAttribute(attr, en && dict.en[key] ? dict.en[key] : saved[id]);
      });
    });

    // Blocos inteiros por idioma (usado no aviso de privacidade)
    document.querySelectorAll('[data-lang-block]').forEach(function (el) {
      el.hidden = el.getAttribute('data-lang-block') !== currentLang;
    });

    root.lang = en ? 'en' : 'pt-BR';
    if (document.body.hasAttribute('data-page-home')) {
      document.title = en ? dict.en.meta.title : ptMeta.title;
      var desc = document.querySelector('meta[name="description"]');
      if (desc) desc.content = en ? dict.en.meta.description : ptMeta.description;
    } else if (document.body.dataset.titleEn) {
      document.title = en ? document.body.dataset.titleEn : ptMeta.title;
    }

    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang') === currentLang));
    });

    var formStatus = document.querySelector('.form-status[data-key]');
    if (formStatus) formStatus.textContent = t(formStatus.dataset.key);

    updateMenuLabel();
    store('ikata-lang', currentLang);
  }

  document.querySelectorAll('[data-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () { applyLang(btn.getAttribute('data-lang')); });
  });

  /* ================= Cabeçalho e menu ================= */
  var header = document.querySelector('.site-header');
  var nav = document.getElementById('main-nav');
  var toggle = document.querySelector('.menu-toggle');

  function updateMenuLabel() {
    if (!toggle) return;
    var open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-label', t(open ? 'menuClose' : 'menuOpen'));
  }

  function setMenu(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    header.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    updateMenuLabel();
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        toggle.focus();
      }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (mq) {
      if (mq.matches) setMenu(false);
    });
  }

  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Marca no menu a seção que está na tela
  var navLinks = nav ? nav.querySelectorAll('ul a[href^="#"]') : [];
  if ('IntersectionObserver' in window && navLinks.length) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
        var link = byId[entry.target.id];
        if (link) link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) spy.observe(sec);
    });
  }

  /* ================= Brasas subindo no hero ================= */
  var canvas = document.querySelector('.embers');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var particles = [];
    var running = false;
    var visible = true;
    var rafId = null;
    var w = 0, h = 0, dpr = 1;
    var colors = ['255,90,31', '255,176,32', '255,130,40'];

    var resize = function () {
      var rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    var spawn = function (anywhere) {
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : h + 10,
        r: Math.random() * 1.8 + 0.6,
        vy: Math.random() * 0.5 + 0.25,
        drift: Math.random() * 0.6 - 0.3,
        phase: Math.random() * Math.PI * 2,
        life: 1,
        decay: Math.random() * 0.0025 + 0.0012,
        color: colors[(Math.random() * colors.length) | 0]
      };
    };

    var frame = function () {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.phase += 0.02;
        p.y -= p.vy;
        p.x += p.drift + Math.sin(p.phase) * 0.25;
        p.life -= p.decay;
        if (p.life <= 0 || p.y < -10) { particles[i] = spawn(false); continue; }
        var alpha = Math.min(1, p.life) * Math.min(1, (h - p.y) / 120) * 0.85;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + p.color + ',' + alpha.toFixed(3) + ')';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      rafId = requestAnimationFrame(frame);
    };

    var start = function () {
      if (running || reduceMotion.matches || !visible || document.hidden) return;
      running = true;
      rafId = requestAnimationFrame(frame);
    };
    var stop = function () {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    };

    var init = function () {
      resize();
      var count = w < 640 ? 26 : 48;
      particles = [];
      for (var i = 0; i < count; i++) particles.push(spawn(true));
    };

    init();
    start();
    window.addEventListener('resize', function () { init(); });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    reduceMotion.addEventListener('change', function () {
      if (reduceMotion.matches) { stop(); ctx.clearRect(0, 0, w, h); } else start();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        visible ? start() : stop();
      }).observe(canvas);
    }
  }

  /* ================= Ciclo "Como funciona" ================= */
  var cycle = document.querySelector('.cycle');
  if (cycle) {
    var nodes = cycle.querySelectorAll('.cycle-node');
    var steps = document.querySelectorAll('.steps li');
    var step = 0;
    var timer = null;

    var highlight = function (i) {
      nodes.forEach(function (n) { n.classList.toggle('is-active', +n.dataset.step === i); });
      steps.forEach(function (s) { s.classList.toggle('is-active', +s.dataset.step === i); });
    };
    var play = function () {
      if (timer || reduceMotion.matches) return;
      // Reinicia a órbita para ficar em sincronia com o destaque das etapas
      var orbit = cycle.querySelector('.cycle-orbit');
      if (orbit) { orbit.style.animation = 'none'; void orbit.getBoundingClientRect(); orbit.style.animation = ''; }
      step = 0;
      highlight(step);
      timer = setInterval(function () { step = (step + 1) % 4; highlight(step); }, 2000);
    };
    var pause = function () { clearInterval(timer); timer = null; };

    if (reduceMotion.matches) highlight(-1);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? play() : pause();
      }, { threshold: 0.3 }).observe(cycle);
    } else {
      play();
    }
    reduceMotion.addEventListener('change', function () {
      if (reduceMotion.matches) { pause(); highlight(-1); }
    });
  }

  /* ================= Revelar ao rolar ================= */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        // também revela o que já ficou para trás numa rolagem rápida
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          entry.target.classList.add('is-visible');
          revealer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 80 + 'ms';
      revealer.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ================= Formulário ================= */
  var form = document.getElementById('contact-form');

  // Botões que levam ao contato já marcam o perfil certo
  document.querySelectorAll('a[data-perfil]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (!form) return;
      var radio = form.querySelector('input[name="perfil"][value="' + a.dataset.perfil + '"]');
      if (radio) radio.checked = true;
    });
  });

  if (form) {
    var status = form.querySelector('.form-status');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    var setError = function (field, input, hasError, errId) {
      field.classList.toggle('has-error', hasError);
      if (input) {
        input.setAttribute('aria-invalid', String(hasError));
        if (hasError) input.setAttribute('aria-describedby', errId);
        else input.removeAttribute('aria-describedby');
      }
    };

    var validate = function () {
      var ok = true;
      var first = null;
      var nome = form.nome;
      var email = form.email;
      var lgpd = form.consentimento;
      var perfil = form.querySelector('input[name="perfil"]:checked');

      var badNome = !nome.value.trim();
      setError(nome.closest('.field'), nome, badNome, 'e-nome');
      if (badNome) { ok = false; first = first || nome; }

      var badEmail = !emailRe.test(email.value.trim());
      setError(email.closest('.field'), email, badEmail, 'e-email');
      if (badEmail) { ok = false; first = first || email; }

      var perfilField = form.querySelector('fieldset.field');
      var badPerfil = !perfil;
      setError(perfilField, null, badPerfil);
      if (badPerfil) { ok = false; first = first || form.querySelector('input[name="perfil"]'); }

      var badLgpd = !lgpd.checked;
      setError(lgpd.closest('.field'), lgpd, badLgpd, 'e-lgpd');
      if (badLgpd) { ok = false; first = first || lgpd; }

      if (first) first.focus();
      return ok;
    };

    // Limpa o erro assim que a pessoa corrige
    form.addEventListener('input', function (e) {
      var field = e.target.closest('.field');
      if (field && field.classList.contains('has-error')) {
        field.classList.remove('has-error');
        e.target.removeAttribute('aria-invalid');
      }
    });
    form.addEventListener('change', function (e) {
      var field = e.target.closest('.field');
      if (field) field.classList.remove('has-error');
    });

    var setStatus = function (key, kind) {
      status.textContent = t(key);
      status.dataset.key = key;
      status.className = 'form-status' + (kind ? ' is-' + kind : '');
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.site.value) return; // robô preencheu o campo escondido
      if (!validate()) { setStatus('form.fixErrors', 'error'); return; }

      var perfil = form.querySelector('input[name="perfil"]:checked').value;
      var data = {
        nome: form.nome.value.trim(),
        empresa: form.empresa.value.trim(),
        email: form.email.value.trim(),
        perfil: perfil,
        mensagem: form.mensagem.value.trim(),
        consentimento: true,
        idioma: currentLang
      };
      var button = form.querySelector('button[type="submit"]');

      if (!CONFIG.formEndpoint) {
        var body = [
          'Nome: ' + data.nome,
          'Empresa/canal: ' + (data.empresa || '-'),
          'E-mail: ' + data.email,
          'Perfil: ' + data.perfil,
          '',
          data.mensagem
        ].join('\n');
        window.location.href = 'mailto:' + CONFIG.contactEmail +
          '?subject=' + encodeURIComponent('Contato pelo site: ' + data.nome) +
          '&body=' + encodeURIComponent(body);
        return;
      }

      button.disabled = true;
      setStatus('form.sending');
      fetch(CONFIG.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (!res.ok) throw new Error(res.status);
        form.reset();
        setStatus('form.ok', 'ok');
      }).catch(function () {
        setStatus('form.fail', 'error');
      }).finally(function () {
        button.disabled = false;
      });
    });
  }

  /* ================= Redes sociais ================= */
  // Sem URL configurada, o nome da rede aparece sem link e com o selo "em breve"
  var missingSocial = false;
  document.querySelectorAll('[data-social]').forEach(function (a) {
    var url = CONFIG.social[a.dataset.social];
    if (url) { a.href = url; a.target = '_blank'; }
    else missingSocial = true;
  });
  var soon = document.querySelector('[data-social-soon]');
  if (soon) soon.hidden = !missingSocial;

  /* ================= Cookies (LGPD) ================= */
  var banner = document.querySelector('.cookie-banner');
  var CONSENT_KEY = 'ikata-cookie-consent';

  window.ikataConsent = function () { return store(CONSENT_KEY); };

  function showBanner() {
    if (!banner) return;
    banner.hidden = false;
    var firstBtn = banner.querySelector('button');
    if (firstBtn && document.activeElement && document.activeElement.hasAttribute('data-open-cookies')) firstBtn.focus();
  }

  if (banner) {
    if (!store(CONSENT_KEY)) showBanner();
    banner.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-consent]');
      if (!btn) return;
      store(CONSENT_KEY, btn.dataset.consent);
      banner.hidden = true;
      // Ponto de integração: carregue ferramentas de medição só se o valor for "all".
      document.dispatchEvent(new CustomEvent('ikata:consent', { detail: btn.dataset.consent }));
    });
  }
  document.querySelectorAll('[data-open-cookies]').forEach(function (btn) {
    btn.addEventListener('click', showBanner);
  });

  /* ================= Ano no rodapé ================= */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ================= Idioma inicial ================= */
  var param = new URLSearchParams(window.location.search).get('lang');
  var saved = store('ikata-lang');
  var initial = param || saved || 'pt';
  if (initial === 'en') applyLang('en');
  else { currentLang = 'pt'; updateMenuLabel(); }
})();
