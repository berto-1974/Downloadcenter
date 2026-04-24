let adminToken = null;
let selectedFiles = [];
let deleteGroupId = null;
let deleteAdminFileId = null;
let deleteGroupModal = null;
let deleteFileModal = null;

document.addEventListener('DOMContentLoaded', () => {
  deleteGroupModal = new bootstrap.Modal(document.getElementById('deleteGroupModal'));
  deleteFileModal = new bootstrap.Modal(document.getElementById('deleteFileModal'));

  // Gespeichertes Token prüfen
  const savedToken = sessionStorage.getItem('adminToken');
  if (savedToken) {
    adminToken = savedToken;
    showAdminDashboard();
  }

  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('uploadForm').addEventListener('submit', handleUpload);
  document.getElementById('refreshBtn').addEventListener('click', loadGroups);
  document.getElementById('generatePwBtn').addEventListener('click', generatePassword);
  document.getElementById('copyPwBtn').addEventListener('click', copyPassword);
  document.getElementById('confirmDeleteGroupBtn').addEventListener('click', confirmDeleteGroup);
  document.getElementById('confirmDeleteFileBtn').addEventListener('click', confirmDeleteFile);

  // Datei-Auswahl
  document.getElementById('fileInput').addEventListener('change', handleFileSelect);

  // Drag & Drop
  const dropZone = document.getElementById('dropZone');
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    addFiles(Array.from(e.dataTransfer.files));
  });
});

// --- Login ---

async function handleLogin(e) {
  e.preventDefault();
  const password = document.getElementById('adminPassword').value;
  const errorEl = document.getElementById('loginError');
  const spinner = document.getElementById('loginSpinner');
  const icon = document.getElementById('loginIcon');
  const btn = document.getElementById('loginBtn');

  errorEl.classList.add('d-none');
  spinner.classList.remove('d-none');
  icon.classList.add('d-none');
  btn.disabled = true;

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error || 'Login fehlgeschlagen';
      errorEl.classList.remove('d-none');
      return;
    }

    adminToken = data.token;
    sessionStorage.setItem('adminToken', adminToken);
    showAdminDashboard();
  } catch {
    errorEl.textContent = 'Verbindungsfehler. Bitte versuchen Sie es erneut.';
    errorEl.classList.remove('d-none');
  } finally {
    spinner.classList.add('d-none');
    icon.classList.remove('d-none');
    btn.disabled = false;
  }
}

function showAdminDashboard() {
  document.getElementById('loginSection').classList.add('d-none');
  document.getElementById('adminSection').classList.remove('d-none');
  document.getElementById('logoutBtn').classList.remove('d-none');
  loadGroups();
}

function logout() {
  adminToken = null;
  sessionStorage.removeItem('adminToken');
  document.getElementById('adminSection').classList.add('d-none');
  document.getElementById('loginSection').classList.remove('d-none');
  document.getElementById('logoutBtn').classList.add('d-none');
  document.getElementById('adminPassword').value = '';
}

// --- Upload ---

function handleFileSelect(e) {
  addFiles(Array.from(e.target.files));
}

function addFiles(newFiles) {
  selectedFiles = [...selectedFiles, ...newFiles];
  renderFileList();
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  renderFileList();
}

function renderFileList() {
  const container = document.getElementById('fileList');
  if (selectedFiles.length === 0) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = `
    <div class="list-group">
      ${selectedFiles.map((f, i) => `
        <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2">
          <div class="d-flex align-items-center gap-2 text-truncate">
            <i class="bi bi-file-earmark text-secondary flex-shrink-0"></i>
            <span class="text-truncate small">${escapeHtml(f.name)}</span>
            <span class="text-muted small flex-shrink-0">${formatFileSize(f.size)}</span>
          </div>
          <button type="button" class="btn btn-link text-danger btn-sm p-0 ms-2 flex-shrink-0"
                  onclick="removeFile(${i})">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>`).join('')}
    </div>
    <p class="text-muted small mt-1">${selectedFiles.length} Datei${selectedFiles.length !== 1 ? 'en' : ''} ausgewählt</p>`;
}

async function handleUpload(e) {
  e.preventDefault();

  const groupName = document.getElementById('groupName').value.trim();
  const groupPassword = document.getElementById('groupPassword').value.trim();
  const errorEl = document.getElementById('uploadError');
  const successEl = document.getElementById('uploadSuccess');
  const spinner = document.getElementById('uploadSpinner');
  const icon = document.getElementById('uploadIcon');
  const btn = document.getElementById('uploadBtn');

  errorEl.classList.add('d-none');
  successEl.classList.add('d-none');

  if (!groupName || !groupPassword) {
    errorEl.textContent = 'Bitte Gruppenname und Kennwort eingeben.';
    errorEl.classList.remove('d-none');
    return;
  }

  if (selectedFiles.length === 0) {
    errorEl.textContent = 'Bitte mindestens eine Datei auswählen.';
    errorEl.classList.remove('d-none');
    return;
  }

  spinner.classList.remove('d-none');
  icon.classList.add('d-none');
  btn.disabled = true;

  try {
    const encrypt = document.getElementById('encryptFiles').checked;
    const formData = new FormData();
    formData.append('groupName', groupName);
    formData.append('groupPassword', groupPassword);
    formData.append('encrypt', encrypt ? 'true' : 'false');
    selectedFiles.forEach(f => formData.append('files', f));

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
      errorEl.textContent = data.error || 'Upload fehlgeschlagen';
      errorEl.classList.remove('d-none');
      return;
    }

    successEl.textContent = `Upload erfolgreich! Gruppe „${groupName}" wurde erstellt.`;
    successEl.classList.remove('d-none');

    // Formular zurücksetzen
    document.getElementById('groupName').value = '';
    document.getElementById('groupPassword').value = '';
    document.getElementById('fileInput').value = '';
    document.getElementById('encryptFiles').checked = false;
    selectedFiles = [];
    renderFileList();

    loadGroups();
  } catch {
    errorEl.textContent = 'Verbindungsfehler. Bitte versuchen Sie es erneut.';
    errorEl.classList.remove('d-none');
  } finally {
    spinner.classList.add('d-none');
    icon.classList.remove('d-none');
    btn.disabled = false;
  }
}

// --- Gruppen laden ---

async function loadGroups() {
  const container = document.getElementById('groupsList');
  container.innerHTML = '<div class="text-center py-4"><span class="spinner-border text-primary"></span></div>';

  try {
    const res = await fetch('/api/admin/groups', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (res.status === 401 || res.status === 403) {
      logout();
      return;
    }

    const groups = await res.json();

    if (groups.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-muted">
          <i class="bi bi-collection fs-2 d-block mb-2"></i>
          <p>Noch keine Gruppen vorhanden.</p>
        </div>`;
      return;
    }

    container.innerHTML = groups.map(g => createGroupCard(g)).join('');

    container.querySelectorAll('.expand-group-btn').forEach(btn => {
      btn.addEventListener('click', () => toggleGroupFiles(btn.dataset.id));
    });

    container.querySelectorAll('.delete-group-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        deleteGroupId = parseInt(btn.dataset.id);
        document.getElementById('deleteGroupName').textContent = btn.dataset.name;
        deleteGroupModal.show();
      });
    });
  } catch {
    container.innerHTML = '<div class="alert alert-danger">Fehler beim Laden der Gruppen.</div>';
  }
}

function createGroupCard(group) {
  const date = new Date(group.created_at).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  return `
    <div class="card border-0 bg-light mb-3" id="group-card-${group.id}">
      <div class="card-body p-3">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <span class="fw-semibold">${escapeHtml(group.name)}</span>
            <span class="badge bg-primary ms-2">${group.file_count} Datei${group.file_count !== 1 ? 'en' : ''}</span>
            ${group.has_encrypted ? '<span class="badge bg-warning text-dark ms-1"><i class="bi bi-lock-fill me-1"></i>Verschlüsselt</span>' : ''}
            <small class="text-muted d-block mt-1"><i class="bi bi-calendar3 me-1"></i>${date}</small>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary btn-sm expand-group-btn" data-id="${group.id}"
                    title="Dateien anzeigen">
              <i class="bi bi-chevron-down"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm delete-group-btn"
                    data-id="${group.id}" data-name="${escapeHtml(group.name)}"
                    title="Gruppe löschen">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
        <div id="group-files-${group.id}" class="mt-3 d-none"></div>
      </div>
    </div>`;
}

async function toggleGroupFiles(groupId) {
  const container = document.getElementById(`group-files-${groupId}`);
  const btn = document.querySelector(`.expand-group-btn[data-id="${groupId}"]`);

  if (!container.classList.contains('d-none')) {
    container.classList.add('d-none');
    btn.querySelector('i').className = 'bi bi-chevron-down';
    return;
  }

  container.classList.remove('d-none');
  btn.querySelector('i').className = 'bi bi-chevron-up';
  container.innerHTML = '<span class="spinner-border spinner-border-sm text-primary"></span>';

  try {
    const res = await fetch(`/api/admin/groups/${groupId}/files`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();

    if (data.files.length === 0) {
      container.innerHTML = '<p class="text-muted small mb-0">Keine Dateien in dieser Gruppe.</p>';
      return;
    }

    container.innerHTML = `
      <div class="list-group list-group-flush">
        ${data.files.map(f => `
          <div class="list-group-item bg-transparent px-0 py-2 d-flex justify-content-between align-items-center"
               id="admin-file-${f.id}">
            <div class="d-flex align-items-center gap-2 text-truncate">
              <i class="bi bi-file-earmark text-secondary flex-shrink-0"></i>
              <span class="small text-truncate">${escapeHtml(f.original_name)}</span>
              <span class="text-muted small flex-shrink-0">${formatFileSize(f.size)}</span>
              ${f.encrypted ? '<i class="bi bi-lock-fill text-warning flex-shrink-0" title="Verschlüsselt"></i>' : ''}
            </div>
            <div class="d-flex gap-1 flex-shrink-0 ms-2">
              <a href="/api/download/${f.id}" class="btn btn-outline-primary btn-sm" download title="Herunterladen">
                <i class="bi bi-download"></i>
              </a>
              <button class="btn btn-outline-danger btn-sm admin-delete-file-btn"
                      data-id="${f.id}" data-name="${escapeHtml(f.original_name)}"
                      title="Löschen">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>`).join('')}
      </div>`;

    container.querySelectorAll('.admin-delete-file-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        deleteAdminFileId = parseInt(btn.dataset.id);
        document.getElementById('deleteAdminFileName').textContent = btn.dataset.name;
        deleteFileModal.show();
      });
    });
  } catch {
    container.innerHTML = '<p class="text-danger small">Fehler beim Laden der Dateien.</p>';
  }
}

async function confirmDeleteGroup() {
  if (!deleteGroupId) return;
  const btn = document.getElementById('confirmDeleteGroupBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Löschen…';

  try {
    const res = await fetch(`/api/admin/groups/${deleteGroupId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (res.ok) {
      deleteGroupModal.hide();
      const card = document.getElementById(`group-card-${deleteGroupId}`);
      if (card) card.remove();
      if (document.querySelectorAll('[id^="group-card-"]').length === 0) {
        document.getElementById('groupsList').innerHTML = `
          <div class="text-center py-4 text-muted">
            <i class="bi bi-collection fs-2 d-block mb-2"></i>
            <p>Noch keine Gruppen vorhanden.</p>
          </div>`;
      }
    } else {
      alert('Fehler beim Löschen der Gruppe.');
    }
  } catch {
    alert('Verbindungsfehler.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-trash me-1"></i>Gruppe löschen';
    deleteGroupId = null;
  }
}

async function confirmDeleteFile() {
  if (!deleteAdminFileId) return;
  const btn = document.getElementById('confirmDeleteFileBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Löschen…';

  try {
    const res = await fetch(`/api/admin/files/${deleteAdminFileId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (res.ok) {
      deleteFileModal.hide();
      const row = document.getElementById(`admin-file-${deleteAdminFileId}`);
      if (row) row.remove();
    } else {
      alert('Fehler beim Löschen der Datei.');
    }
  } catch {
    alert('Verbindungsfehler.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-trash me-1"></i>Löschen';
    deleteAdminFileId = null;
  }
}

// --- Hilfstools ---

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pw = '';
  for (let i = 0; i < 12; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  document.getElementById('groupPassword').value = pw;
}

async function copyPassword() {
  const pw = document.getElementById('groupPassword').value;
  if (!pw) return;
  try {
    await navigator.clipboard.writeText(pw);
    const btn = document.getElementById('copyPwBtn');
    btn.innerHTML = '<i class="bi bi-check2 text-success"></i>';
    setTimeout(() => { btn.innerHTML = '<i class="bi bi-clipboard"></i>'; }, 2000);
  } catch {}
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
