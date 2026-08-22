// Reveal on scroll + fill the hero meter once it's visible.
(function(){
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('is-on'); io.unobserve(e.target); }
    });
  },{threshold:.15});
  document.querySelectorAll('.rise').forEach(function(el){ io.observe(el); });

  var m = document.getElementById('heroMeter');
  if(m){ setTimeout(function(){ m.classList.add('is-on'); }, 250); }

  // One FAQ open at a time.
  var ds = document.querySelectorAll('.faq details');
  ds.forEach(function(d){
    d.addEventListener('toggle', function(){
      if(d.open) ds.forEach(function(o){ if(o!==d) o.open = false; });
    });
  });
})();

// Early-bird countdown, ends Aug 25, 2026, 11:59:59 PM ET (EDT, UTC-4).
(function(){
  var deadline = new Date('2026-08-25T23:59:59-04:00').getTime();

  var cards = document.querySelectorAll('[data-countdown], #countdown');
  if(!cards.length) return;

  function pad(n){ return String(n).padStart(2,'0'); }

  function digit(card, k){
    return card.querySelector('[data-cd="' + k + '"]') ||
           card.querySelector('#cd-' + k);
  }

  function expire(){
    document.querySelectorAll('[data-cd-nums], #countdown .countdown__nums')
      .forEach(function(el){ el.style.display = 'none'; });
    document.querySelectorAll('[data-cd-label], #cd-label')
      .forEach(function(el){ el.textContent = 'Early bird pricing has ended'; });
    document.querySelectorAll('[data-regular]')
      .forEach(function(el){ el.innerHTML = el.getAttribute('data-regular'); });
    document.querySelectorAll('[data-regular-href]').forEach(function(el){
      var href = el.getAttribute('data-regular-href');
      if(href && href !== '#') el.setAttribute('href', href);
    });
  }

  var timer;
  function tick(){
    var diff = deadline - Date.now();
    if(diff <= 0){ expire(); clearInterval(timer); return; }
    var s = Math.floor(diff/1000);
    var d = Math.floor(s/86400); s -= d*86400;
    var h = Math.floor(s/3600);  s -= h*3600;
    var m = Math.floor(s/60);    s -= m*60;
    var v = { d:d, h:h, m:m, s:s };
    cards.forEach(function(card){
      for(var k in v){
        var el = digit(card, k);
        if(el) el.textContent = pad(v[k]);
      }
    });
  }

  timer = setInterval(tick, 1000);
  tick();
})();

// Schedule, fetched from schedule.json and rendered as tabs + track cards.
(function(){
  var tabsEl = document.getElementById('sched-tabs');
  var panelEl = document.getElementById('sched-panel');
  if(!tabsEl || !panelEl) return;

  var trackVar = { alg: '--alg', geo: '--geo', comb: '--comb', nt: '--nt' };

  function esc(s){
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function pdfLink(s){
    if(!s.pdf) return '';
    return '<a class="sched-card__pdf" href="' + esc(encodeURI(s.pdf)) + '" ' +
           'target="_blank" rel="noopener" ' +
           'aria-label="' + esc(s.title) + ' PDF, opens in a new tab">' +
           '<span aria-hidden="true">&#8595;</span> ' +
           esc(s.pdfLabel || 'Open the PDF') + '</a>';
  }

  function renderWeek(week){
    var wed = null;
    var rest = [];
    week.sessions.forEach(function(s){
      if(s.track === 'all'){ wed = s; } else { rest.push(s); }
    });

    var html = '';
    html += '<div class="sched-head"><h3>' + esc(week.title) + '</h3>' +
            '<span class="sched-date num">' + esc(week.dateNote) + '</span></div>';
    if(week.description){
      html += '<p class="sched-desc">' + esc(week.description) + '</p>';
    }
    if(week.pdf){
      html += '<p style="margin-top:14px">' + pdfLink(week) + '</p>';
    }
    if(wed){
      html += '<div class="sched-wed">' +
              '<span class="sched-wed__tag">' + esc(wed.trackLabel) + '</span>' +
              '<b>' + esc(wed.title) + '</b>' +
              '<span class="num">' + esc(wed.when) + '</span></div>';
    }
    html += '<div class="sched-grid">';
    rest.forEach(function(s){
      var tc = 'var(' + (trackVar[s.track] || '--ink-3') + ')';
      html += '<div class="sched-card" style="--tc:' + tc + '">' +
              '<span class="sched-card__track">' + esc(s.trackLabel) + '</span>' +
              '<h4>' + esc(s.title) + '</h4>' +
              '<p class="sched-card__when num">' + esc(s.when) + '</p>' +
              '<p class="sched-card__desc">' + esc(s.description) + '</p>' +
              pdfLink(s) +
              '</div>';
    });
    html += '</div>';
    panelEl.innerHTML = html;
  }

  fetch('schedule.json')
    .then(function(r){
      if(!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function(data){
      data.weeks.forEach(function(week, i){
        var tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'sched-tab' + (i === 0 ? ' is-active' : '');
        tab.textContent = week.label;
        tab.addEventListener('click', function(){
          tabsEl.querySelectorAll('.sched-tab').forEach(function(t){ t.classList.remove('is-active'); });
          tab.classList.add('is-active');
          renderWeek(week);
        });
        tabsEl.appendChild(tab);
      });
      if(data.weeks.length) renderWeek(data.weeks[0]);
    })
    .catch(function(err){
      panelEl.innerHTML = '<p class="sched-error">Couldn\'t load the schedule (' + err.message +
        '). If you\'re opening this file directly from disk, serve the folder over HTTP so fetch() can reach schedule.json.</p>';
      console.error('Schedule load failed:', err);
    });
})();