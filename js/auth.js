// ── Modal open / close ────────────────────────────────────────────────────────
function openModal(tab) {
  document.getElementById('modal-overlay').classList.add('open');
  switchModalTab(tab || 'login');
  clearModalErr();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

function switchModalTab(tab) {
  document.getElementById('tab-login').classList.toggle('active',    tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('modal-login-form').classList.toggle('hidden',    tab !== 'login');
  document.getElementById('modal-register-form').classList.toggle('hidden', tab !== 'register');
  clearModalErr();
}

function showModalErr(msg) {
  var el = document.getElementById('modal-err');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function clearModalErr() {
  document.getElementById('modal-err').classList.add('hidden');
}


// ── Login ─────────────────────────────────────────────────────────────────────
async function doLogin() {
  var email = document.getElementById('login-email').value.trim();
  var pass  = document.getElementById('login-pass').value;
  if (!email || !pass) { showModalErr('Email and password are required.'); return; }

  setSubmitting('login-btn', true);

  var res = await apiCall('POST', '/api/auth/login', { email: email, password: pass });

  if (res.demo) {
    // Demo / no-backend mode
    var fakeData = {
      token: 'demo-token-' + Date.now(),
      name:  email.split('@')[0],
      email: email,
      userId: 1,
      expiresIn: 3600
    };
    saveSession(fakeData);
    closeModal();
    onAuthSuccess(fakeData);
    return;
  }

  setSubmitting('login-btn', false, 'Sign in');

  if (!res.ok) { showModalErr((res.data && res.data.message) ? res.data.message : 'Login failed.'); return; }

  saveSession(res.data);
  closeModal();
  onAuthSuccess(res.data);
}


// ── Register ──────────────────────────────────────────────────────────────────
async function doRegister() {
  var name  = document.getElementById('reg-name').value.trim();
  var email = document.getElementById('reg-email').value.trim();
  var pass  = document.getElementById('reg-pass').value;

  if (!name || !email || !pass) { showModalErr('All fields are required.'); return; }
  if (pass.length < 6) { showModalErr('Password must be at least 6 characters.'); return; }

  setSubmitting('reg-btn', true);

  var res = await apiCall('POST', '/api/auth/register', { name: name, email: email, password: pass });

  if (res.demo) {
    var fakeData = {
      token: 'demo-token-' + Date.now(),
      name:  name,
      email: email,
      userId: 1,
      expiresIn: 3600
    };
    saveSession(fakeData);
    closeModal();
    onAuthSuccess(fakeData);
    return;
  }

  setSubmitting('reg-btn', false, 'Create account');

  if (!res.ok) { showModalErr((res.data && res.data.message) ? res.data.message : 'Registration failed.'); return; }

  saveSession(res.data);
  closeModal();
  onAuthSuccess(res.data);
}


// ── Init (called from dashboard.js DOMContentLoaded) ─────────────────────────
function initAuth() {
  document.getElementById('modal-overlay').addEventListener('click', closeModalOutside);

  document.getElementById('tab-login').addEventListener('click',    function() { switchModalTab('login'); });
  document.getElementById('tab-register').addEventListener('click', function() { switchModalTab('register'); });

  document.getElementById('login-btn').addEventListener('click', doLogin);
  document.getElementById('reg-btn').addEventListener('click',   doRegister);

  document.getElementById('login-pass').addEventListener('keydown', function(e) { if (e.key === 'Enter') doLogin(); });
  document.getElementById('reg-pass').addEventListener('keydown',   function(e) { if (e.key === 'Enter') doRegister(); });

  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeModal(); });
}
