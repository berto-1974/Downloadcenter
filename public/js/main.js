let currentPassword = '';
let currentGroupId = null;
let deleteFileId = null;
let deleteModal = null;

document.addEventListener('DOMContentLoaded', () => {
  deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

  document.getElementById('passwordForm').addEventListener('submit', handlePasswordSubmit);
  document.getElementById('backBtn').addEventListener('click', showPasswordSection);
  document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
});

async function handlePasswordSubmit(e) {
  e.preventDefault();

  const password = document.getElementById('passwordInput').value;
  const errorEl = document.getElementById('passwordError');
  const spinner = document.getElementById('submitSpinner');
  const icon = document.getElementById('submitIcon');
  const btn = document.getElementById('submitBtn');

  errorEl.classList.add('d-none');
  spinner.classList.remove('d-none');
  icon.classList.add('d-none');
  btn.disabled = true;

  try {
    const res = await fetch('/api/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.classList.remove('d-none');
      return;
    }

    currentPassword = password;
    currentGroupId = data.group.id;
    showFiles(data.group, data.files);
  } catch (err) {
    errorEl.textContent = 'Verbindungsfehler. Bitte versuchen Sie es erneut.';
    errorEl.classList.remove('d-none');
  } finally {
    spinner.classList.add('d-none');
    icon.classList.remove('d-none');
    btn.disabled = false;
  }
}

function showFiles(group, files) {
  document.getElementById('passwordSection').classList.add('d-none');
  document.getElementById('fileSection').classList.remove('d-none');
  document.getElementById('groupName').textContent = group.name;
  document.getElementById('fileCount').textContent =
    files.length === 0 ? 'Keine Dateien vorhanden' :
    files.length === 1 ? '1 Datei' : `${files.length} Dateien`;

  renderFiles(files);
}

function renderFiles(files) {
  const grid = document.getElementById('fileGrid');

  if (files.length === 0) {
    grid.innerHTML = `
      <div class="col-12 text-center py-5 text-muted">
        <i class="bi bi-folder2-open fs-1 d-block mb-2"></i>
        <p>Diese Gruppe enthält keine Dateien.</p>
      </div>`;
    return;
  }

  grid.innerHTML = files.map(file => createFileCard(file)).join('');

  // Lösch-Buttons aktivieren
  grid.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteFileId = parseInt(btn.dataset.id);
      document.getElementById('deleteFileName').textContent = btn.dataset.name;
      deleteModal.show();
    });
  });
}

function createFileCard(file) {
  const isImage = file.mimetype.startsWith('image/');
  const isPdf   = file.mimetype === 'application/pdf';
  const sizeFormatted = formatFileSize(file.size);
  const dateFormatted = new Date(file.created_at).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  let preview;
  if (isImage) {
    preview = `<div class="file-preview">
      <img src="/api/preview/${file.id}" alt="${escapeHtml(file.original_name)}"
           class="img-thumbnail-preview" loading="lazy"
           onerror="this.parentElement.innerHTML='<div class=\\'preview-icon\\'><i class=\\'bi bi-image text-muted\\'></i></div>'">
    </div>`;
  } else if (isPdf) {
    preview = `<div class="file-preview file-preview-pdf">
      <i class="bi bi-file-earmark-pdf" style="font-size:3rem;color:#f87171"></i>
      <span class="file-preview-label">PDF</span>
    </div>`;
  } else {
    preview = `<div class="file-preview">
      <div class="preview-icon">${getFileIcon(file.mimetype)}</div>
      <span class="file-preview-label">${getFileLabel(file.mimetype)}</span>
    </div>`;
  }

  return `
    <div class="col-sm-6 col-md-4 col-lg-3" id="file-card-${file.id}">
      <div class="card h-100 border-0 shadow-sm file-card">
        ${preview}
        <div class="card-body p-3">
          <p class="card-title fw-semibold text-truncate mb-1 small" title="${escapeHtml(file.original_name)}">
            ${escapeHtml(file.original_name)}
          </p>
          <p class="text-muted small mb-3">${sizeFormatted} &bull; ${dateFormatted}</p>
          <div class="d-flex gap-2">
            <a href="/api/download/${file.id}" class="btn btn-primary btn-sm flex-fill" download>
              <i class="bi bi-download me-1"></i>Download
            </a>
            <button class="btn btn-outline-danger btn-sm delete-btn"
                    data-id="${file.id}" data-name="${escapeHtml(file.original_name)}">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>`;
}

async function confirmDelete() {
  if (!deleteFileId) return;

  const btn = document.getElementById('confirmDeleteBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Löschen…';

  try {
    const res = await fetch(`/api/files/${deleteFileId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: currentPassword })
    });

    if (res.ok) {
      deleteModal.hide();
      const card = document.getElementById(`file-card-${deleteFileId}`);
      if (card) card.remove();

      // Dateianzahl aktualisieren
      const remaining = document.querySelectorAll('[id^="file-card-"]').length;
      document.getElementById('fileCount').textContent =
        remaining === 0 ? 'Keine Dateien vorhanden' :
        remaining === 1 ? '1 Datei' : `${remaining} Dateien`;

      if (remaining === 0) {
        document.getElementById('fileGrid').innerHTML = `
          <div class="col-12 text-center py-5 text-muted">
            <i class="bi bi-folder2-open fs-1 d-block mb-2"></i>
            <p>Diese Gruppe enthält keine Dateien.</p>
          </div>`;
      }
    } else {
      const data = await res.json();
      alert(data.error || 'Fehler beim Löschen');
    }
  } catch {
    alert('Verbindungsfehler. Bitte versuchen Sie es erneut.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-trash me-1"></i>Löschen';
    deleteFileId = null;
  }
}

function showPasswordSection() {
  document.getElementById('fileSection').classList.add('d-none');
  document.getElementById('passwordSection').classList.remove('d-none');
  document.getElementById('passwordInput').value = '';
  currentPassword = '';
  currentGroupId = null;
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

function getFileLabel(mimetype) {
  const map = {
    'application/zip':                                                             'ZIP',
    'application/x-zip-compressed':                                               'ZIP',
    'application/x-rar-compressed':                                               'RAR',
    'application/vnd.rar':                                                        'RAR',
    'application/x-7z-compressed':                                                '7Z',
    'application/x-tar':                                                          'TAR',
    'application/gzip':                                                           'GZ',
    'application/msword':                                                         'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':   'DOCX',
    'application/vnd.ms-excel':                                                   'XLS',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':         'XLSX',
    'application/vnd.ms-powerpoint':                                              'PPT',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'text/plain':                                                                  'TXT',
    'text/csv':                                                                    'CSV',
    'text/html':                                                                   'HTML',
    'application/json':                                                            'JSON',
    'application/xml':                                                             'XML',
    'text/xml':                                                                    'XML',
    'video/mp4':                                                                   'MP4',
    'video/quicktime':                                                             'MOV',
    'video/x-msvideo':                                                             'AVI',
    'video/webm':                                                                  'WEBM',
    'audio/mpeg':                                                                  'MP3',
    'audio/mp4':                                                                   'M4A',
    'audio/wav':                                                                   'WAV',
    'audio/flac':                                                                  'FLAC',
    'audio/ogg':                                                                   'OGG',
  };
  if (!mimetype) return 'FILE';
  if (map[mimetype]) return map[mimetype];
  const sub = (mimetype.split('/')[1] || '').split(';')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return sub.slice(0, 5) || 'FILE';
}

function getFileIcon(mimetype) {
  if (mimetype.startsWith('video/')) return '<i class="bi bi-play-circle fs-1 text-danger"></i>';
  if (mimetype.startsWith('audio/')) return '<i class="bi bi-music-note-beamed fs-1 text-info"></i>';
  if (mimetype === 'application/pdf') return '<i class="bi bi-file-earmark-pdf fs-1 text-danger"></i>';
  if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('7z') || mimetype.includes('tar'))
    return '<i class="bi bi-file-earmark-zip fs-1 text-warning"></i>';
  if (mimetype.includes('word') || mimetype.includes('document'))
    return '<i class="bi bi-file-earmark-word fs-1 text-primary"></i>';
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet'))
    return '<i class="bi bi-file-earmark-excel fs-1 text-success"></i>';
  if (mimetype.includes('powerpoint') || mimetype.includes('presentation'))
    return '<i class="bi bi-file-earmark-ppt fs-1 text-warning"></i>';
  return '<i class="bi bi-file-earmark fs-1 text-secondary"></i>';
}
