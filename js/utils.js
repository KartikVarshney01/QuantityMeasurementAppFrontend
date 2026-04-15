// ── API ───────────────────────────────────────────────────────────────────────
async function apiCall(method, path, body) {
  var headers = { 'Content-Type': 'application/json' };
  var storedToken = sessionStorage.getItem('token');
  if (storedToken) headers['Authorization'] = 'Bearer ' + storedToken;

  try {
    var res  = await fetch(API_BASE + path, {
      method:  method,
      headers: headers,
      body:    body ? JSON.stringify(body) : undefined
    });
    var data = await res.json();
    return { ok: res.ok, status: res.status, data: data };
  } catch (e) {
    return { ok: false, status: 0, data: { message: 'No backend connected.' }, demo: true };
  }
}


// ── Session ───────────────────────────────────────────────────────────────────
function saveSession(data) {
  sessionStorage.setItem('token',     data.token);
  sessionStorage.setItem('userName',  data.name  || data.email);
  sessionStorage.setItem('userEmail', data.email || '');
}

function clearSession() {
  sessionStorage.clear();
}

function isLoggedIn() {
  return !!sessionStorage.getItem('token');
}

function getToken() {
  return sessionStorage.getItem('token');
}

function getUserName() {
  return sessionStorage.getItem('userName') || '';
}


// ── Local fallback math (no backend) ─────────────────────────────────────────
function toBase(val, unit, cat) {
  var factors = {
    LENGTH:  { Feet: 30.48, Inch: 2.54, Yard: 91.44, Centimeter: 1 },
    WEIGHT:  { Kilogram: 1000, Gram: 1, Pound: 453.592 },
    VOLUME:  { Litre: 1000, Millilitre: 1, Gallon: 3785.41 }
  };
  if (cat === 'TEMPERATURE') {
    if (unit === 'Celsius')    return val;
    if (unit === 'Fahrenheit') return (val - 32) * 5 / 9;
    if (unit === 'Kelvin')     return val - 273.15;
  }
  return val * ((factors[cat] && factors[cat][unit]) || 1);
}

function fromBase(base, unit, cat) {
  var factors = {
    LENGTH:  { Feet: 30.48, Inch: 2.54, Yard: 91.44, Centimeter: 1 },
    WEIGHT:  { Kilogram: 1000, Gram: 1, Pound: 453.592 },
    VOLUME:  { Litre: 1000, Millilitre: 1, Gallon: 3785.41 }
  };
  if (cat === 'TEMPERATURE') {
    if (unit === 'Celsius')    return base;
    if (unit === 'Fahrenheit') return base * 9 / 5 + 32;
    if (unit === 'Kelvin')     return base + 273.15;
  }
  return base / ((factors[cat] && factors[cat][unit]) || 1);
}

function localCompare(v1, u1, c1, v2, u2, c2) {
  if (c1 !== c2) return { error: 'Categories must match' };
  var b1 = toBase(v1, u1, c1), b2 = toBase(v2, u2, c2);
  return { equal: Math.abs(b1 - b2) < 1e-9 };
}

function localConvert(val, unit, cat, target) {
  return { result: fromBase(toBase(val, unit, cat), target, cat), unit: target };
}

function localAdd(v1, u1, c1, v2, u2, c2) {
  if (c1 !== c2)             return { error: 'Categories must match' };
  if (c1 === 'TEMPERATURE')  return { error: 'Temperature addition not supported' };
  return { result: fromBase(toBase(v1, u1, c1) + toBase(v2, u2, c2), u1, c1), unit: u1 };
}

function localSubtract(v1, u1, c1, v2, u2, c2) {
  if (c1 !== c2)             return { error: 'Categories must match' };
  if (c1 === 'TEMPERATURE')  return { error: 'Temperature subtraction not supported' };
  return { result: fromBase(toBase(v1, u1, c1) - toBase(v2, u2, c2), u1, c1), unit: u1 };
}

function localDivide(v1, u1, c1, v2, u2, c2) {
  if (c1 !== c2)            return { error: 'Categories must match' };
  if (c1 === 'TEMPERATURE') return { error: 'Temperature division not supported' };
  var b2 = toBase(v2, u2, c2);
  if (b2 === 0)             return { error: 'Division by zero' };
  return { result: toBase(v1, u1, c1) / b2 };
}


// ── Unit dropdown helpers ─────────────────────────────────────────────────────
function filterUnits(selectId, catSelectId) {
  var cat  = document.getElementById(catSelectId).value;
  var sel  = document.getElementById(selectId);
  var prev = sel.value;
  sel.innerHTML = (UNITS[cat] || []).map(function(u) {
    return '<option' + (u === prev ? ' selected' : '') + '>' + u + '</option>';
  }).join('');
  if (!UNITS[cat] || UNITS[cat].indexOf(prev) === -1) sel.selectedIndex = 0;
}

function syncCategory(catSelectId, unitSelectId) {
  var unit   = document.getElementById(unitSelectId).value;
  var catSel = document.getElementById(catSelectId);
  var cats   = Object.keys(UNITS);
  for (var i = 0; i < cats.length; i++) {
    if (UNITS[cats[i]].indexOf(unit) !== -1) { catSel.value = cats[i]; break; }
  }
}

function fillSelect(selectId, options) {
  var sel = document.getElementById(selectId);
  sel.innerHTML = '<option value="">-- Select --</option>';
  options.forEach(function(opt) {
    var o = document.createElement('option');
    o.value = opt; o.textContent = opt;
    sel.appendChild(o);
  });
}


// ── Result / error display ────────────────────────────────────────────────────
function showResult(containerId, html) {
  var el = document.getElementById(containerId);
  el.innerHTML = html;
  el.classList.remove('hidden');
}

function showError(containerId, msg) {
  showResult(containerId,
    '<div class="result-box danger">' +
      '<div class="result-lbl">Error</div>' +
      '<div class="result-err">' + msg + '</div>' +
    '</div>');
}

function clearResult(id) {
  var el = document.getElementById(id);
  el.classList.add('hidden');
  el.innerHTML = '';
}


// ── Spinner button state ──────────────────────────────────────────────────────
function setSubmitting(btnId, loading, label) {
  var btn = document.getElementById(btnId);
  if (loading) {
    btn.disabled  = true;
    btn.innerHTML = '<span class="spinner"></span>';
  } else {
    btn.disabled   = false;
    btn.textContent = label || btn.dataset.label || 'Submit';
  }
}
