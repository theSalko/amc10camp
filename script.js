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

// Early-bird countdown -> Aug 21, 2026, 11:59:59 PM ET (EDT, UTC-4).
// TODO: confirm the exact cutoff time you want; this assumes end of day Eastern.
(function(){
  var deadline = new Date('2026-08-21T23:59:59-04:00').getTime();
  var els = {
    d: document.getElementById('cd-d'),
    h: document.getElementById('cd-h'),
    m: document.getElementById('cd-m'),
    s: document.getElementById('cd-s')
  };
  var label = document.getElementById('cd-label');
  var nums = document.querySelector('#countdown .countdown__nums');

  function pad(n){ return String(n).padStart(2,'0'); }

  function tick(){
    var diff = deadline - Date.now();
    if(diff <= 0){
      if(label) label.textContent = 'Early bird pricing has ended';
      if(nums) nums.style.display = 'none';
      clearInterval(timer);
      return;
    }
    var s = Math.floor(diff/1000);
    var d = Math.floor(s/86400); s -= d*86400;
    var h = Math.floor(s/3600); s -= h*3600;
    var m = Math.floor(s/60); s -= m*60;
    if(els.d) els.d.textContent = pad(d);
    if(els.h) els.h.textContent = pad(h);
    if(els.m) els.m.textContent = pad(m);
    if(els.s) els.s.textContent = pad(s);
  }

  var timer = setInterval(tick, 1000);
  tick();
})();