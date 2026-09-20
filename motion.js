(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- Split headings into masked words ---------- */
  document.querySelectorAll('[data-split]').forEach(function (el) {
    if (el.children.length) return; 
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach(function (word, i) {
      var mask = document.createElement('span');
      mask.className = 'w';
      var inner = document.createElement('span');
      inner.style.setProperty('--wi', i);
      inner.textContent = word;
      mask.appendChild(inner);
      el.appendChild(mask);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll('[data-reveal], [data-split]');

  if (calm || !hasIO) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target); 
      });
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0.1 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Gliding Nav Pill & Scroll Spy ---------- */
  var navList = document.querySelector('.nav-links');
  var navItems = navList ? Array.prototype.slice.call(navList.querySelectorAll('a')) : [];

  if (navList && navItems.length && window.innerWidth > 1024) {
    var pill = document.createElement('span');
    pill.className = 'nav-indicator';
    navList.appendChild(pill);

    var current = navItems.find(function (a) { return a.getAttribute('aria-current') === 'page'; }) || navItems[0];

    function moveTo(link) {
      if (!link) return;
      var r = link.getBoundingClientRect();
      var p = navList.getBoundingClientRect();
      pill.style.setProperty('--y', (r.top - p.top) + 'px');
      pill.style.setProperty('--h', r.height + 'px');
      pill.classList.add('is-on');
    }

    requestAnimationFrame(function () { moveTo(current); });
    window.addEventListener('resize', function () { 
      if(window.innerWidth > 1024) moveTo(current); 
    });

    if (fine) {
      navItems.forEach(function (link) {
        link.addEventListener('pointerenter', function () { moveTo(link); });
        link.addEventListener('focus', function () { moveTo(link); });
      });
      navList.addEventListener('pointerleave', function () { moveTo(current); });
    }

    /* Scroll-spy */
    var sections = navItems
      .map(function (a) {
        var id = (a.getAttribute('href') || '').replace(/^#/, '');
        return id ? document.getElementById(id) : null;
      }).filter(Boolean);

    if (hasIO && sections.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var match = navItems.find(function (a) {
            return a.getAttribute('href') === '#' + entry.target.id;
          });
          if (!match || match === current) return;
          navItems.forEach(function (a) { a.removeAttribute('aria-current'); });
          match.setAttribute('aria-current', 'page');
          current = match;
          moveTo(current);
        });
      }, { rootMargin: '-40% 0px -50% 0px' });
      sections.forEach(function (s) { spy.observe(s); });
    }
  }

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById('navToggle');
  var navContainer = document.querySelector('.sidebar-nav');
  if (toggle && navContainer) {
    toggle.addEventListener('click', function () {
      var isOpen = navContainer.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
    navContainer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        navContainer.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- Card pointer light + tilt ---------- */
  if (!calm && fine) {
    document.querySelectorAll('.card').forEach(function (card) {
      var queued = false, ev = null;
      card.addEventListener('pointermove', function (e) {
        ev = e;
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () {
          var r = card.getBoundingClientRect();
          var px = (ev.clientX - r.left) / r.width;
          var py = (ev.clientY - r.top) / r.height;
          card.style.setProperty('--mx', (px * 100).toFixed(2) + '%');
          card.style.setProperty('--my', (py * 100).toFixed(2) + '%');
          card.style.setProperty('--rx', ((px - 0.5) * 10).toFixed(2));
          card.style.setProperty('--ry', ((0.5 - py) * 10).toFixed(2));
          queued = false;
        });
      });
      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--rx', 0);
        card.style.setProperty('--ry', 0);
      });
    });
  }

  /* ---------- Stat count-up ---------- */
  function countUp(el) {
    var end = parseFloat(el.dataset.count);
    if (calm) { el.textContent = end; return; }
    var t0 = performance.now();
    (function step(now) {
      var p = Math.min((now - t0) / 1500, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(end * eased);
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  
  var counters = document.querySelectorAll('[data-count]');
  if (hasIO) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        co.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { co.observe(el); });
  }
})();
