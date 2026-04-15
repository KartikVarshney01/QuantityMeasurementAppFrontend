// ── Page navigation ───────────────────────────────────────────────────────────
function showPage(page) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(function(b) { b.classList.remove('active'); });
  if (page === 'home')    document.querySelectorAll('.nav-btn')[0].classList.add('active');
  if (page === 'history') document.querySelectorAll('.nav-btn')[1].classList.add('active');
}

function handleHistoryClick() {
  showPage('history');
  if (!isLoggedIn()) {
    document.getElementById('history-gate').classList.remove('hidden');
    document.getElementById('history-content').classList.add('hidden');
  } else {
    document.getElementById('history-gate').classList.add('hidden');
    document.getElementById('history-content').classList.remove('hidden');
    loadHistory();
  }
}


// ── Op tabs ───────────────────────────────────────────────────────────────────
function switchOp(op, tabEl) {
  document.querySelectorAll('.op-tab').forEach(function(t) { t.classList.remove('active'); });
  tabEl.classList.add('active');
  document.querySelectorAll('.op-panel').forEach(function(p) { p.classList.add('hidden'); });
  document.getElementById('op-' + op).classList.remove('hidden');
}


// ── Auth UI ───────────────────────────────────────────────────────────────────
function updateAuthUI() {
  var authArea = document.getElementById('auth-area');
  var lockIcon = document.getElementById('lock-icon');

  if (isLoggedIn()) {
    authArea.innerHTML =
      '<div class="user-chip"><span class="user-dot"></span>' + getUserName() + '</div>' +
      '<button class="btn-sm" id="logout-btn">Logout</button>';
    document.getElementById('logout-btn').addEventListener('click', logout);
    if (lockIcon) lockIcon.style.display = 'none';
  } else {
    authArea.innerHTML =
      '<button class="btn-sm" id="nav-signin-btn">Sign in</button>' +
      '<button class="btn-sm primary" id="nav-register-btn">Register</button>';
    document.getElementById('nav-signin-btn').addEventListener('click',   function() { openModal('login'); });
    document.getElementById('nav-register-btn').addEventListener('click', function() { openModal('register'); });
    if (lockIcon) lockIcon.style.display = '';
  }
}

function logout() {
  clearSession();
  updateAuthUI();
  // If on history page, drop back to gate
  if (document.getElementById('page-history').classList.contains('active')) {
    document.getElementById('history-gate').classList.remove('hidden');
    document.getElementById('history-content').classList.add('hidden');
  }
}

// Called after successful login or register
function onAuthSuccess(data) {
  updateAuthUI();
  // Unlock history if user was on that page
  if (document.getElementById('page-history').classList.contains('active')) {
    document.getElementById('history-gate').classList.add('hidden');
    document.getElementById('history-content').classList.remove('hidden');
    loadHistory();
  }
}


// ── Operations ────────────────────────────────────────────────────────────────

// Compare
async function doCompare() {
  var v1 = +document.getElementById('cmp-v1').value;
  var u1 =  document.getElementById('cmp-u1').value;
  var c1 =  document.getElementById('cmp-c1').value;
  var v2 = +document.getElementById('cmp-v2').value;
  var u2 =  document.getElementById('cmp-u2').value;
  var c2 =  document.getElementById('cmp-c2').value;

  var res = await apiCall('POST', '/api/quantities/compare', {
    q1: { value: v1, unitName: u1, category: c1 },
    q2: { value: v2, unitName: u2, category: c2 }
  });

  var equal;
  if (res.demo || !res.ok) {
    var loc = localCompare(v1, u1, c1, v2, u2, c2);
    if (loc.error) { showError('compare-result', loc.error); return; }
    equal = loc.equal;
  } else {
    equal = res.data && res.data.data && res.data.data.areEqual;
  }

  var badge = equal
    ? '<span class="result-badge badge-eq">= Equal</span>'
    : '<span class="result-badge badge-neq">≠ Not equal</span>';

  showResult('compare-result',
    '<div class="result-box ' + (equal ? 'success' : 'danger') + '">' +
      '<div class="result-lbl">Comparison result</div>' +
      badge +
      '<div class="result-meta">' + v1 + ' ' + u1 + ' vs ' + v2 + ' ' + u2 + ' (' + c1 + ')</div>' +
    '</div>');
}


// Convert
async function doConvert() {
  var val    = +document.getElementById('cvt-v').value;
  var unit   =  document.getElementById('cvt-u').value;
  var cat    =  document.getElementById('cvt-c').value;
  var target =  document.getElementById('cvt-target').value;

  var res = await apiCall('POST', '/api/quantities/convert', {
    quantity:   { value: val, unitName: unit, category: cat },
    targetUnit: target
  });

  var result, runit;
  if (res.demo || !res.ok) {
    var loc = localConvert(val, unit, cat, target);
    result = loc.result; runit = loc.unit;
  } else {
    result = res.data.data.result; runit = res.data.data.unit;
  }

  showResult('convert-result',
    '<div class="result-box success">' +
      '<div class="result-lbl">Conversion result</div>' +
      '<div class="result-val">'+  (+result.toFixed(6)) + '<span class="result-unit">' + runit + '</span></div>' +
      '<div class="result-meta">' + val + ' ' + unit + ' → ' + runit + ' (' + cat + ')</div>' +
    '</div>');
}


// Add / Subtract (shared)
async function doArithmetic(op) {
  var prefix = op.slice(0, 3);
  var v1 = +document.getElementById(prefix + '-v1').value;
  var u1 =  document.getElementById(prefix + '-u1').value;
  var c1 =  document.getElementById(prefix + '-c1').value;
  var v2 = +document.getElementById(prefix + '-v2').value;
  var u2 =  document.getElementById(prefix + '-u2').value;
  var c2 =  document.getElementById(prefix + '-c2').value;

  var res = await apiCall('POST', '/api/quantities/' + op, {
    q1: { value: v1, unitName: u1, category: c1 },
    q2: { value: v2, unitName: u2, category: c2 }
  });

  var result, runit;
  if (res.demo || !res.ok) {
    var loc = op === 'add' ? localAdd(v1,u1,c1,v2,u2,c2) : localSubtract(v1,u1,c1,v2,u2,c2);
    if (loc.error) { showError(op + '-result', loc.error); return; }
    result = loc.result; runit = loc.unit;
  } else {
    result = res.data.data.result; runit = res.data.data.unit;
  }

  var sym   = op === 'add' ? '+' : '−';
  var label = op.charAt(0).toUpperCase() + op.slice(1) + 'ition result';

  showResult(op + '-result',
    '<div class="result-box success">' +
      '<div class="result-lbl">' + label + '</div>' +
      '<div class="result-val">' + (+result.toFixed(6)) + '<span class="result-unit">' + runit + '</span></div>' +
      '<div class="result-meta">' + v1 + ' ' + u1 + ' ' + sym + ' ' + v2 + ' ' + u2 + ' (' + c1 + ')</div>' +
    '</div>');
}


// Divide
async function doDivide() {
  var v1 = +document.getElementById('div-v1').value;
  var u1 =  document.getElementById('div-u1').value;
  var c1 =  document.getElementById('div-c1').value;
  var v2 = +document.getElementById('div-v2').value;
  var u2 =  document.getElementById('div-u2').value;
  var c2 =  document.getElementById('div-c2').value;

  var res = await apiCall('POST', '/api/quantities/divide', {
    q1: { value: v1, unitName: u1, category: c1 },
    q2: { value: v2, unitName: u2, category: c2 }
  });

  var result;
  if (res.demo || !res.ok) {
    var loc = localDivide(v1,u1,c1,v2,u2,c2);
    if (loc.error) { showError('divide-result', loc.error); return; }
    result = loc.result;
  } else {
    result = res.data.data.result;
  }

  showResult('divide-result',
    '<div class="result-box success">' +
      '<div class="result-lbl">Division result (ratio)</div>' +
      '<div class="result-val">' + (+result.toFixed(6)) + '<span class="result-unit">dimensionless</span></div>' +
      '<div class="result-meta">' + v1 + ' ' + u1 + ' ÷ ' + v2 + ' ' + u2 + ' (' + c1 + ')</div>' +
    '</div>');
}


// ── DOMContentLoaded ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {

  // Auth modal
  initAuth();

  // Navbar auth UI
  updateAuthUI();

  // Op tab buttons
  document.querySelectorAll('.op-tab').forEach(function(btn) {
    btn.addEventListener('click', function() { switchOp(this.dataset.op, this); });
  });

  // Category ↔ unit sync
  ['cmp-c1','cmp-c2'].forEach(function(id) {
    document.getElementById(id).addEventListener('change', function() {
      filterUnits(id.replace('c','u'), id);
    });
  });
  ['cmp-u1','cmp-u2'].forEach(function(id) {
    document.getElementById(id).addEventListener('change', function() {
      syncCategory(id.replace('u','c'), id);
    });
  });

  document.getElementById('cvt-c').addEventListener('change', function() { filterUnits('cvt-u', 'cvt-c'); });
  document.getElementById('cvt-u').addEventListener('change', function() { syncCategory('cvt-c', 'cvt-u'); });

  // Convert — also refresh target unit dropdown when category changes
  document.getElementById('cvt-c').addEventListener('change', function() {
    var units = UNITS[this.value] || [];
    var sel = document.getElementById('cvt-target');
    sel.innerHTML = units.map(function(u) { return '<option>' + u + '</option>'; }).join('');
  });

  ['add','sub','div'].forEach(function(p) {
    ['c1','c2'].forEach(function(s) {
      var cId = p+'-'+s, uId = p+'-'+s.replace('c','u');
      if (document.getElementById(cId)) {
        document.getElementById(cId).addEventListener('change', function() { filterUnits(uId, cId); });
      }
    });
    ['u1','u2'].forEach(function(s) {
      var uId = p+'-'+s, cId = p+'-'+s.replace('u','c');
      if (document.getElementById(uId)) {
        document.getElementById(uId).addEventListener('change', function() { syncCategory(cId, uId); });
      }
    });
  });

  // Action buttons
  document.getElementById('cmp-btn').addEventListener('click',  doCompare);
  document.getElementById('conv-btn').addEventListener('click', doConvert);
  document.getElementById('add-btn').addEventListener('click',  function() { doArithmetic('add'); });
  document.getElementById('sub-btn').addEventListener('click',  function() { doArithmetic('subtract'); });
  document.getElementById('div-btn').addEventListener('click',  doDivide);

  // Clear buttons
  document.querySelectorAll('.btn-clear').forEach(function(btn) {
    btn.addEventListener('click', function() { clearResult(this.dataset.target); });
  });

  // History nav button
  document.getElementById('nav-history-btn').addEventListener('click', handleHistoryClick);

  // Operations nav button
  document.getElementById('nav-ops-btn').addEventListener('click', function() { showPage('home'); });

  // History gate buttons
  document.getElementById('gate-register-btn').addEventListener('click', function() { openModal('register'); });
  document.getElementById('gate-login-btn').addEventListener('click',    function() { openModal('login'); });

});
