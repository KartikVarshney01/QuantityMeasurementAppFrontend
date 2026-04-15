// ── In-memory history (populated when ops run without a backend) ──────────────
var allHistory = [];
var activeOpFilter = 'all';


// ── Add entry (called from dashboard when demo mode) ─────────────────────────
function addToHistory(op, op1, op2, result) {
  allHistory.unshift({
    id: Date.now(),
    operation: op,
    operand1: op1,
    operand2: op2 || '—',
    result: result,
    hasError: false,
    createdAt: new Date().toISOString()
  });
}

// function formatQuantity(q) {
//   if (!q) return '—';
//   if (typeof q === "object") return q.value + " " + q.unitName;
//   return q; // fallback (like '—')
// }
function formatQuantity(q) {
  if (!q) return '—';

  if (typeof q === "object") {
    const value = q.value ?? q.Value;
    const unit  = q.unitName ?? q.UnitName ?? q.unit;

    return value + " " + unit;
  }

  return q;
}

// ── Render table ──────────────────────────────────────────────────────────────
function renderHistory(rows) {
  var tbody = document.getElementById('history-tbody');
  if (!rows || rows.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:40px;font-size:12px;">' +
      'No operations yet — try one on the home page!</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(function (r) {
    var op = (r.operation || '').toLowerCase();
    var chipClass = 'op-' + op;
    var time = r.createdAt
      ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '—';
    var status = r.hasError
      ? '<span class="status-err">Error</span>'
      : '<span class="status-ok">OK</span>';

    return '<tr>' +
      '<td style="color:var(--muted)">' + r.id + '</td>' +
      '<td><span class="op-chip ' + chipClass + '">' + (r.operation || '—') + '</span></td>' +
      // '<td>' + (r.operand1 || '—') + '</td>' +
      // '<td>' + (r.operand2 || '—') + '</td>' +
      '<td>' + formatQuantity(r.operand1) + '</td>' +
      '<td>' + formatQuantity(r.operand2) + '</td>' +
      '<td>' + (r.result != null ? r.result : '—') + '</td>' +
      '<td>' + status + '</td>' +
      '<td style="color:var(--muted)">' + time + '</td>' +
      '</tr>';
  }).join('');
}


// ── Stats ─────────────────────────────────────────────────────────────────────
function updateStats(rows) {
  document.getElementById('stat-total').textContent = rows.length;
  document.getElementById('stat-compare').textContent = rows.filter(function (r) {
    return r.operation && r.operation.toLowerCase() === 'compare';
  }).length;
  document.getElementById('stat-convert').textContent = rows.filter(function (r) {
    return r.operation && r.operation.toLowerCase() === 'convert';
  }).length;
  document.getElementById('stat-arith').textContent = rows.filter(function (r) {
    var op = r.operation && r.operation.toLowerCase();
    return op === 'add' || op === 'subtract' || op === 'divide';
  }).length;
}


// ── Filter ────────────────────────────────────────────────────────────────────
function filterOp(btn, op) {
  document.querySelectorAll('.filter-pill').forEach(function (p) { p.classList.remove('active'); });
  btn.classList.add('active');
  activeOpFilter = op;
  var filtered = op === 'all' ? allHistory : allHistory.filter(function (r) {
    return r.operation && r.operation.toLowerCase() === op;
  });
  renderHistory(filtered);
}


// ── Load from API ─────────────────────────────────────────────────────────────
async function loadHistory() {
  document.getElementById('history-tbody').innerHTML =
    '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:32px;font-size:12px;">Loading…</td></tr>';

  var res = await apiCall('GET', '/api/quantities/history');

  if (res.demo || !res.ok) {
    // Fall back to locally tracked history
    renderHistory(allHistory);
    updateStats(allHistory);
    return;
  }

  allHistory = (res.data && res.data.data) || [];
  renderHistory(allHistory);
  updateStats(allHistory);
}


// ── Init (called from history.html's DOMContentLoaded) ───────────────────────
function initHistoryPage() {
  // Redirect to home if not logged in
  if (!isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  // Show username
  var userEl = document.getElementById('history-username');
  if (userEl) userEl.textContent = getUserName();

  // Logout
  var logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      clearSession();
      window.location.href = 'index.html';
    });
  }

  // Filter pills
  document.querySelectorAll('.filter-pill').forEach(function (btn) {
    btn.addEventListener('click', function () { filterOp(this, this.dataset.op); });
  });

  // Refresh button
  var refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) refreshBtn.addEventListener('click', loadHistory);

  loadHistory();
}
