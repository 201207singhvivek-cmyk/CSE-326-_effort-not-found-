/**
 * ============================================================
 *  Subhasree Junction — Railway Platform Management Simulator
 *  Minimalist Collapsible Sections · 24-Hour Military Time
 *  Pure Vanilla JS · No Libraries
 * ============================================================
 */

// ─── 1. STATE ────────────────────────────────────────────────

var platforms = buildPlatforms(5);
var trains = [];
var nextId = 1;

function buildPlatforms(n) {
  var list = [];
  for (var i = 1; i <= n; i++) {
    var role, label;
    if (i <= 2)       { role = "quick";   label = "⚡ Quick Stop (Mainline)"; }
    else if (i === 3) { role = "starter"; label = "🏁 Starter (1st Station)"; }
    else              { role = "loop";    label = "🔄 Loop Line (Long Stop)"; }
    list.push({ id: i, name: "P" + i, role: role, label: label, trainId: null });
  }
  return list;
}


// ─── 5. TIME HELPERS ─────────────────────────────────────────

function toMins(str) {
  if (!str) return 0;
  var p = str.split(":").map(Number);
  return (p[0] || 0) * 60 + (p[1] || 0);
}

function toTime(m) {
  m = ((m % 1440) + 1440) % 1440;
  return String(Math.floor(m / 60)).padStart(2, "0") + ":" +
         String(m % 60).padStart(2, "0");
}

/** Validates and normalizes 24h time input: "14:30", "9:30" -> "09:30", "1430" -> "14:30" */
function format24Input(str) {
  if (!str) return null;
  str = str.trim();
  var parts = str.split(":");
  if (parts.length === 2) {
    var h = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m) && h >= 0 && h < 24 && m >= 0 && m < 60) {
      return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
    }
  }
  if (/^\d{3,4}$/.test(str)) {
    var padded = str.padStart(4, "0");
    var h2 = parseInt(padded.slice(0, 2), 10);
    var m2 = parseInt(padded.slice(2), 10);
    if (h2 >= 0 && h2 < 24 && m2 >= 0 && m2 < 60) {
      return String(h2).padStart(2, "0") + ":" + String(m2).padStart(2, "0");
    }
  }
  return null;
}

function willLeave(t) {
  return toTime(toMins(t.dep) + t.delay);
}

function now24() {
  var d = new Date();
  return String(d.getHours()).padStart(2, "0") + ":" +
         String(d.getMinutes()).padStart(2, "0");
}


// ─── 6. SHORTCUT ─────────────────────────────────────────────

function el(id) { return document.getElementById(id); }


// ─── 7. BANNER ───────────────────────────────────────────────

function banner(msg, type) {
  var b = el("banner");
  b.textContent = msg;
  b.className = "banner " + type;
  if (type === "success") {
    setTimeout(function () { b.classList.add("hidden"); }, 3500);
  }
}


// ─── 8. RENDER: DOTS ─────────────────────────────────────────

function renderDots() {
  var box = el("dotsContainer");
  box.innerHTML = "";

  for (var i = 0; i < platforms.length; i++) {
    var p = platforms[i];
    var occ = p.trainId !== null;
    var train = occ ? trains.find(function (t) { return t.id === p.trainId; }) : null;

    var chip = document.createElement("span");
    chip.className = "dot-chip " + (occ ? "occ" : "free");
    chip.title = occ && train
      ? p.name + ": " + train.name
      : p.name + ": Free";

    var html = '<span class="dot-led"></span><span>' + p.name + "</span>";
    if (occ && train) {
      html += ' <span class="dot-train">(' + train.name.split(" ")[0] + ")</span>";
    }
    chip.innerHTML = html;
    box.appendChild(chip);
  }

  el("platBadge").textContent = platforms.length;

  // Update live sidebar counters
  var freeCount = platforms.filter(function (p) { return p.trainId === null; }).length;
  var occCount = platforms.length - freeCount;
  if (el("sideFreePlats")) el("sideFreePlats").textContent = freeCount;
  if (el("sideOccPlats")) el("sideOccPlats").textContent = occCount;
  if (el("sidePlatBadge")) el("sidePlatBadge").textContent = platforms.length;
}


// ─── 9. RENDER: TRAIN CARDS ──────────────────────────────────

function renderCards() {
  var grid = el("trainGrid");
  grid.innerHTML = "";
  el("trainBadge").textContent = trains.length;
  if (el("sideTrainBadge")) el("sideTrainBadge").textContent = trains.length;

  if (trains.length === 0) {
    grid.innerHTML = '<div class="empty">No trains yet — open <strong>Add Train</strong> below.</div>';
    return;
  }

  for (var i = 0; i < trains.length; i++) {
    var t = trains[i];
    var plat = t.platId ? platforms.find(function (p) { return p.id === t.platId; }) : null;
    var wl = willLeave(t);

    var card = document.createElement("div");
    card.className = "t-card";
    card.innerHTML =
      '<div class="t-card-top">' +
        '<span class="t-card-name">' + t.name + '</span>' +
        '<span class="t-card-pri pri-' + t.pri + '">P' + t.pri + '</span>' +
      '</div>' +
      '<div class="t-card-info">' +
        t.cat + ' · ' + t.stop + '<br>' +
        'Arr <strong>' + t.arr + '</strong> · Dep <strong>' + wl + '</strong>' +
        (t.delay ? ' · <span style="color:#dc2626">+' + t.delay + 'm</span>' : '') + '<br>' +
        'Platform: ' + (plat ? '<strong style="color:#059669">' + plat.name + '</strong>' : '—') +
        ' · <span class="status ' + t.status.toLowerCase() + '">' + t.status + '</span>' +
      '</div>' +
      '<div class="t-card-actions">' +
        (t.status === "Scheduled"
          ? '<button type="button" class="btn green sm" onclick="quickAlloc(' + t.id + ')">Allocate</button>' : '') +
        (t.status === "Docked"
          ? '<button type="button" class="btn red sm" onclick="quickDepart(' + t.id + ')">Depart</button>' : '') +
        (t.status !== "Departed"
          ? '<button type="button" class="btn orange sm" onclick="quickDelay(' + t.id + ')">Delay (+15m)</button>' : '') +
        (t.status === "Departed"
          ? '<span style="color:#94a3b8;font-size:.78rem">Left at ' + (t.leftAt || "—") + '</span>' : '') +
      '</div>';

    grid.appendChild(card);
  }
}


// ─── 10. RENDER: TABLE ───────────────────────────────────────

function renderTable() {
  var tb = el("tbody");
  tb.innerHTML = "";

  for (var i = 0; i < trains.length; i++) {
    var t = trains[i];
    var plat = t.platId ? platforms.find(function (p) { return p.id === t.platId; }) : null;
    var wl = willLeave(t);

    var tr = document.createElement("tr");
    tr.innerHTML =
      '<td><span class="t-card-pri pri-' + t.pri + '">P' + t.pri + '</span></td>' +
      '<td>' + t.cat + '</td>' +
      '<td>' + t.stop + '</td>' +
      '<td><strong>' + t.name + '</strong></td>' +
      '<td>' + t.arr + '</td>' +
      '<td>' + wl + '</td>' +
      '<td>' + (t.leftAt || '—') + '</td>' +
      '<td>' + (t.delay ? '+' + t.delay + 'm' : '0') + '</td>' +
      '<td>' + (plat ? plat.name : '—') + '</td>' +
      '<td><span class="status ' + t.status.toLowerCase() + '">' + t.status + '</span></td>' +
      '<td>' +
        (t.status === "Scheduled"
          ? '<button type="button" class="btn green sm" onclick="quickAlloc(' + t.id + ')">Allocate</button>'
          : (t.status === "Docked"
              ? '<button type="button" class="btn red sm" onclick="quickDepart(' + t.id + ')">Depart</button>'
              : '<span style="color:#94a3b8">Left ' + (t.leftAt || '') + '</span>')) +
      '</td>';
    tb.appendChild(tr);
  }
}


// ─── 11. RENDER: DROPDOWNS ───────────────────────────────────

function renderDropdowns() {
  var at = el("allocTrain");
  at.innerHTML = '<option value="">— pick train —</option>';
  trains.filter(function (t) { return t.status !== "Departed"; }).forEach(function (t) {
    var o = document.createElement("option");
    o.value = t.id;
    var loc = t.platId ? " (Docked P" + t.platId + ")" : " (Scheduled)";
    o.textContent = "[P" + t.pri + "] " + t.name + loc;
    at.appendChild(o);
  });

  var ap = el("allocPlat");
  ap.innerHTML = '<option value="">— pick platform —</option>';
  platforms.forEach(function (p) {
    var o = document.createElement("option");
    o.value = p.id;
    var occ = p.trainId ? trains.find(function(t){ return t.id === p.trainId; }) : null;
    o.textContent = p.name + " (" + p.label + ") " + (occ ? "[" + occ.name.split(' ')[0] + "]" : "[Free]");
    ap.appendChild(o);
  });

  var ut = el("updTrain");
  ut.innerHTML = '<option value="">— pick train —</option>';
  trains.filter(function (t) { return t.status !== "Departed"; }).forEach(function (t) {
    var o = document.createElement("option");
    o.value = t.id;
    var loc = t.platId ? " [P" + t.platId + "]" : "";
    o.textContent = t.name + loc + " (" + t.status + ")";
    ut.appendChild(o);
  });
}


// ─── 12. TRAFFIC BAR ─────────────────────────────────────────

function renderTraffic(time24) {
  var start = toMins(time24);
  var end = start + 60;

  el("windowText").textContent = toTime(start) + " – " + toTime(end);

  var count = 0;
  for (var i = 0; i < trains.length; i++) {
    var t = trains[i];
    if (t.status === "Departed") continue;
    if (t.status === "Docked") { count++; continue; }
    var a = toMins(t.arr);
    if (a >= start && a <= end) count++;
  }

  var cap = platforms.length || 1;
  var pct = Math.min(Math.round((count / cap) * 100), 100);

  el("barFill").style.width = pct + "%";
  el("barCount").textContent = count + " train(s)";
  el("barLoad").textContent = pct + " %";
}


// ─── 13. REFRESH ─────────────────────────────────────────────

function refresh() {
  renderDots();
  renderCards();
  renderTable();
  renderDropdowns();
  renderTraffic(el("simTime").value);
}


// ─── 14. PLATFORM CONFIG ─────────────────────────────────────

el("platForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var n = parseInt(el("platCount").value, 10);

  if (isNaN(n) || n < 1 || n > 20) {
    banner("Enter a number between 1 and 20.", "warning");
    return;
  }

  if (n === platforms.length) {
    banner("Already " + n + " platforms.", "success");
    return;
  }

  // Free trains on removed platforms
  if (n < platforms.length) {
    for (var i = n; i < platforms.length; i++) {
      if (platforms[i].trainId) {
        var t = trains.find(function (tr) { return tr.id === platforms[i].trainId; });
        if (t) { t.platId = null; t.status = "Scheduled"; }
      }
    }
  }

  platforms = buildPlatforms(n);

  // Re-link docked trains
  for (var j = 0; j < trains.length; j++) {
    var tr = trains[j];
    if (tr.platId) {
      var p = platforms.find(function (pl) { return pl.id === tr.platId; });
      if (!p) {
        tr.platId = null;
        if (tr.status !== "Departed") tr.status = "Scheduled";
      } else {
        p.trainId = tr.id;
      }
    }
  }

  banner("Updated to " + n + " platforms!", "success");
  refresh();
});


// ─── 15. ADD TRAIN ───────────────────────────────────────────

// Quick Time Fill Helpers for Add Train
el("btnNowAdd").addEventListener("click", function () {
  var cur = now24();
  var depMins = toMins(cur) + 30;
  el("tArr").value = cur;
  el("tDep").value = toTime(depMins);
});

el("btnMorningAdd").addEventListener("click", function () {
  el("tArr").value = "10:00";
  el("tDep").value = "10:30";
});

el("btnEveningAdd").addEventListener("click", function () {
  el("tArr").value = "18:00";
  el("tDep").value = "18:30";
});

// Auto-format on blur
function attachTimeBlur(inputEl) {
  if (!inputEl) return;
  inputEl.addEventListener("blur", function () {
    var formatted = format24Input(this.value);
    if (formatted) this.value = formatted;
  });
}
attachTimeBlur(el("tArr"));
attachTimeBlur(el("tDep"));
attachTimeBlur(el("updLeft"));
attachTimeBlur(el("simTime"));

el("addForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var name = el("tName").value.trim();
  var rawArr = el("tArr").value;
  var rawDep = el("tDep").value;

  var arr = format24Input(rawArr);
  var dep = format24Input(rawDep);

  if (!name) {
    banner("Please enter train name / number.", "warning");
    el("tName").focus();
    return;
  }

  if (!arr) {
    banner("Please enter a valid 24h arrival time (e.g. 10:00 or 14:30).", "warning");
    el("tArr").focus();
    return;
  }

  if (!dep) {
    banner("Please enter a valid 24h departure time (e.g. 10:30 or 15:00).", "warning");
    el("tDep").focus();
    return;
  }

  trains.push({
    id:     nextId++,
    name:   name,
    cat:    el("tCat").value,
    pri:    parseInt(el("tPri").value, 10),
    stop:   el("tStop").value,
    arr:    arr,
    dep:    dep,
    delay:  parseInt(el("tDelay").value, 10) || 0,
    leftAt: null,
    platId: null,
    status: "Scheduled"
  });

  this.reset();
  banner('Train "' + name + '" added (' + arr + ' → ' + dep + ')!', "success");
  refresh();
});


// ─── 16. ALLOCATE PLATFORM ───────────────────────────────────

el("allocForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var tid = parseInt(el("allocTrain").value, 10);
  var pid = parseInt(el("allocPlat").value, 10);
  if (!tid || !pid) {
    banner("Please select both a train and a platform.", "warning");
    return;
  }

  var train = trains.find(function (t) { return t.id === tid; });
  var plat  = platforms.find(function (p) { return p.id === pid; });
  if (!train || !plat) return;

  if (plat.trainId !== null && plat.trainId !== train.id) {
    var occ = trains.find(function (t) { return t.id === plat.trainId; });
    banner("⚠️ CONFLICT: " + plat.name + " is already occupied by " + (occ ? occ.name : "another train") + "!", "warning");
    return;
  }

  // Free train's old platform if it's changing platforms
  if (train.platId && train.platId !== plat.id) {
    var oldPlat = platforms.find(function (pl) { return pl.id === train.platId; });
    if (oldPlat) oldPlat.trainId = null;
  }

  if (plat.role === "quick" && (train.stop === "Long Stoppage" || train.pri >= 3)) {
    banner("⚠️ WARNING: " + plat.name + " is mainline — consider a loop platform.", "warning");
  } else {
    banner('Train "' + train.name + '" allocated to ' + plat.name + '!', "success");
  }

  plat.trainId = train.id;
  train.platId = plat.id;
  train.status = "Docked";
  refresh();
});


// ─── 17. DELAY & DEPART ──────────────────────────────────────

el("btnDelay").addEventListener("click", function () {
  var tid = parseInt(el("updTrain").value, 10);
  if (!tid) { banner("Please select a train from dropdown.", "warning"); return; }
  var train = trains.find(function (t) { return t.id === tid; });
  train.delay = parseInt(el("updDelay").value, 10) || 0;
  banner(train.name + " delay updated → will leave " + willLeave(train), "success");
  refresh();
});

el("btnLeft").addEventListener("click", function () {
  var tid = parseInt(el("updTrain").value, 10);
  if (!tid) { banner("Please select a train from dropdown to depart.", "warning"); return; }
  var rawLeft = el("updLeft").value;
  var leftTime = format24Input(rawLeft) || rawLeft || now24();
  departTrain(tid, leftTime);
});

function departTrain(id, timeOverride) {
  var train = trains.find(function (t) { return t.id === id; });
  if (!train || train.status === "Departed") return;

  var leftTime = timeOverride || now24();
  train.status = "Departed";
  train.leftAt = leftTime;

  if (train.platId) {
    var p = platforms.find(function (pl) { return pl.id === train.platId; });
    if (p) p.trainId = null;
    train.platId = null;
  }

  banner('Train "' + train.name + '" marked as DEPARTED at ' + leftTime + '. Platform is now free!', "success");
  refresh();
}


// ─── 18. QUICK ACTIONS ───────────────────────────────────────

/** 1-Click Allocate: finds first free platform and allocates immediately */
function quickAlloc(id) {
  var train = trains.find(function (t) { return t.id === id; });
  if (!train) return;

  var freePlat = platforms.find(function (p) { return p.trainId === null; });
  if (!freePlat) {
    banner("⚠️ All platforms are occupied! Depart a docked train first.", "warning");
    var d = el("secAlloc");
    if (d) d.open = true;
    el("allocTrain").value = train.id;
    return;
  }

  if (train.platId && train.platId !== freePlat.id) {
    var oldP = platforms.find(function (pl) { return pl.id === train.platId; });
    if (oldP) oldP.trainId = null;
  }

  freePlat.trainId = train.id;
  train.platId = freePlat.id;
  train.status = "Docked";

  banner('Train "' + train.name + '" allocated to ' + freePlat.name + '!', "success");
  refresh();
}

/** 1-Click Delay: increments delay by +15 mins */
function quickDelay(id) {
  var train = trains.find(function (t) { return t.id === id; });
  if (!train) return;
  train.delay = (train.delay || 0) + 15;
  banner('Delayed "' + train.name + '" by +15m (Now leaves ' + willLeave(train) + ')', "warning");
  refresh();
}

/** 1-Click Depart: marks departed at current time and frees platform */
function quickDepart(id) {
  departTrain(id);
}


// ─── 19. SIM TIME CHANGE ────────────────────────────────────

el("btnSimNow").addEventListener("click", function () {
  var cur = now24();
  el("simTime").value = cur;
  renderTraffic(cur);
});

el("simTime").addEventListener("input", function () {
  var val = format24Input(this.value) || this.value;
  renderTraffic(val);
});
el("simTime").addEventListener("change", function () {
  var val = format24Input(this.value) || this.value;
  renderTraffic(val);
});


// ─── 20. 24-HOUR CLOCK ──────────────────────────────────────

function startClock() {
  function tick() {
    var d = new Date();
    el("liveClock").textContent =
      String(d.getHours()).padStart(2, "0") + ":" +
      String(d.getMinutes()).padStart(2, "0") + ":" +
      String(d.getSeconds()).padStart(2, "0");
  }
  setInterval(tick, 1000);
  tick();
}


// ─── 21. COLLAPSIBLE SIDEBAR ────────────────────────────────

function toggleSidebar(forceState) {
  var sb = el("sidebar");
  var bd = el("sidebarBackdrop");
  if (!sb) return;

  var shouldOpen = typeof forceState === "boolean" ? forceState : !sb.classList.contains("open");
  if (shouldOpen) {
    sb.classList.add("open");
    if (bd) bd.classList.add("active");
  } else {
    sb.classList.remove("open");
    if (bd) bd.classList.remove("active");
  }
}

if (el("sidebarToggle")) {
  el("sidebarToggle").addEventListener("click", function () {
    toggleSidebar();
  });
}

if (el("sidebarCloseBtn")) {
  el("sidebarCloseBtn").addEventListener("click", function () {
    toggleSidebar(false);
  });
}

if (el("sidebarBackdrop")) {
  el("sidebarBackdrop").addEventListener("click", function () {
    toggleSidebar(false);
  });
}

// Nav links: auto-open target section and smooth scroll
document.querySelectorAll(".sidebar-nav .nav-item").forEach(function (link) {
  link.addEventListener("click", function (e) {
    var href = this.getAttribute("href");
    if (href && href.startsWith("#")) {
      var target = document.querySelector(href);
      if (target) {
        if (target.tagName === "DETAILS") target.open = true;
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
    // On small screens, close the sidebar drawer after clicking a link
    if (window.innerWidth < 900) {
      toggleSidebar(false);
    }
  });
});


// ─── INITIALIZATION ──────────────────────────────────────────
startClock();
refresh();
