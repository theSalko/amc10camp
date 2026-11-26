// Progressively enhance the page without hiding content when JavaScript is unavailable.
(function(){
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-on');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: .15 });
    document.querySelectorAll('.rise').forEach(function(el){ io.observe(el); });
    document.documentElement.classList.add('js-reveal');
  }

  var meter = document.getElementById('heroMeter');
  if(meter) meter.classList.add('is-on');

  // One FAQ open at a time.
  var details = document.querySelectorAll('.faq details');
  details.forEach(function(detail){
    detail.addEventListener('toggle', function(){
      if(detail.open){
        details.forEach(function(other){ if(other !== detail) other.open = false; });
      }
    });
  });
})();

// Early bird includes November 27, 2026 in ET (EST, UTC-5).
(function(){
  var deadline = new Date('2026-11-28T00:00:00-05:00').getTime();
  var countdowns = document.querySelectorAll('[data-countdown]');
  var timer;

  function pad(n){ return String(n).padStart(2, '0'); }

  function expire(){
    document.querySelectorAll('[data-cd-nums]').forEach(function(el){ el.hidden = true; });
    document.querySelectorAll('[data-cd-label]').forEach(function(el){
      el.textContent = 'Early bird pricing has ended';
    });
    document.querySelectorAll('[data-regular]').forEach(function(el){
      el.innerHTML = el.getAttribute('data-regular');
    });
    var missingStandardCheckout = false;
    document.querySelectorAll('[data-regular-href]').forEach(function(el){
      var href = (el.getAttribute('data-regular-href') || '').trim();
      var validHref = false;
      try {
        var protocol = new URL(href).protocol;
        validHref = protocol === 'https:' || protocol === 'http:';
      } catch(error) {}
      if(validHref){
        el.setAttribute('href', href);
        el.removeAttribute('aria-disabled');
        el.removeAttribute('aria-describedby');
      } else {
        el.removeAttribute('href');
        el.setAttribute('role', 'link');
        el.setAttribute('aria-disabled', 'true');
        el.setAttribute('aria-describedby', 'checkout-status');
        missingStandardCheckout = true;
      }
    });
    var checkoutStatus = document.getElementById('checkout-status');
    if(checkoutStatus) checkoutStatus.hidden = !missingStandardCheckout;
  }

  function tick(){
    var diff = deadline - Date.now();
    if(diff <= 0){
      expire();
      if(timer) clearInterval(timer);
      return false;
    }
    var seconds = Math.floor(diff / 1000);
    var days = Math.floor(seconds / 86400); seconds -= days * 86400;
    var hours = Math.floor(seconds / 3600); seconds -= hours * 3600;
    var minutes = Math.floor(seconds / 60); seconds -= minutes * 60;
    var values = { d: days, h: hours, m: minutes, s: seconds };
    countdowns.forEach(function(countdown){
      Object.keys(values).forEach(function(key){
        var digit = countdown.querySelector('[data-cd="' + key + '"]');
        if(digit) digit.textContent = pad(values[key]);
      });
    });
    return true;
  }

  // Price and checkout changes must also work on pages without a countdown widget.
  if(tick()) timer = setInterval(tick, 1000);
})();

// Keep the static four-week schedule as a fallback; add week selectors after loading data.
(function(){
  var tabsEl = document.getElementById('sched-tabs');
  var panelEl = document.getElementById('sched-panel');
  if(!tabsEl || !panelEl || !window.fetch) return;

  var trackVar = { alg: '--alg', geo: '--geo', comb: '--comb', nt: '--nt', test: '--ink' };

  function esc(value){
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function weekMarkup(week){
    var html = '<div class="sched-head"><h3>' + esc(week.title) + '</h3>' +
      '<span class="sched-date num">' + esc(week.dateNote) + '</span></div>';
    if(week.description) html += '<p class="sched-desc">' + esc(week.description) + '</p>';
    html += '<div class="sched-grid">';
    week.sessions.forEach(function(session, index){
      var color = 'var(' + (trackVar[session.track] || '--ink-3') + ')';
      html += '<div class="sched-card" style="--tc:' + color + '">' +
        '<span class="sched-card__track">Session ' + (index + 1) + '</span>' +
        '<h4>' + esc(session.title) + '</h4>' +
        '<p class="sched-card__when num">' + esc(session.when) + '</p>';
      if(session.description){
        html += '<p class="sched-card__desc">' + esc(session.description) + '</p>';
      }
      html += '</div>';
    });
    return html + '</div>';
  }

  function validWeek(week){
    return week && typeof week.label === 'string' && typeof week.title === 'string' &&
      typeof week.dateNote === 'string' && Array.isArray(week.sessions) &&
      week.sessions.length === 2 && week.sessions.every(function(session){
        return session && typeof session.title === 'string' && typeof session.when === 'string';
      });
  }

  fetch('schedule.json?v=december-2026')
    .then(function(response){
      if(!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    })
    .then(function(data){
      if(!data || !Array.isArray(data.weeks) || !data.weeks.length || !data.weeks.every(validWeek)){
        throw new Error('Invalid schedule data');
      }
      // Prepare everything before replacing the visible static fallback.
      var markups = data.weeks.map(weekMarkup);
      var selectors = document.createDocumentFragment();
      data.weeks.forEach(function(week, index){
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'sched-tab' + (index === 0 ? ' is-active' : '');
        button.textContent = week.label;
        button.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
        button.setAttribute('aria-controls', 'sched-panel');
        button.addEventListener('click', function(){
          tabsEl.querySelectorAll('.sched-tab').forEach(function(other){
            var active = other === button;
            other.classList.toggle('is-active', active);
            other.setAttribute('aria-pressed', active ? 'true' : 'false');
          });
          panelEl.innerHTML = markups[index];
        });
        selectors.appendChild(button);
      });
      tabsEl.replaceChildren(selectors);
      panelEl.innerHTML = markups[0];
    })
    .catch(function(error){
      // The full December schedule remains readable if the request fails.
      console.warn('Using the on-page December schedule:', error);
    });
})();
