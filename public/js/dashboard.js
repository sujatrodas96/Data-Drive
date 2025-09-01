let currentFolder = null;      
let folderPath = [];       

// Load contents of a folder (or root)
async function loadDrive(folderId = null, folderName = "Root", pushPath = true) {
  if (pushPath) {
    if (folderId) {
      folderPath.push({ id: folderId, name: folderName });
    } else {
      folderPath = []; // reset to root
    }
  }

  currentFolder = folderId;
  const container = document.getElementById('driveContent');
  container.innerHTML = "<p>Loading...</p>";

  try {
    const res = await fetch(`/api/folders/${folderId || ''}`);
    const data = await res.json();

    if (!data.folders && !data.files) {
      container.innerHTML = `<p style="color:red;">${data.message || "Failed to load drive"}</p>`;
      return;
    }

    const { folders, files } = data;
    container.innerHTML = "";

    // Breadcrumb
    renderBreadcrumb();

    // Render folders
    container.innerHTML += "<h3>Folders</h3>";
    if (folders.length === 0) container.innerHTML += "<p>No folders</p>";
    folders.forEach(f => {
      container.innerHTML += `
        <div class="item">
          <span onclick="loadDrive('${f._id}', '${f.name}')" style="cursor:pointer">${f.name}</span>
          <button onclick="editFolder('${f._id}', '${f.name}')">Edit</button>
          <button onclick="deleteFolder('${f._id}')">Delete</button>
        </div>
      `;
    });

    // Render files
    container.innerHTML += "<h3>Files</h3>";
    if (files.length === 0) container.innerHTML += "<p>No files</p>";
    files.forEach(f => {
      container.innerHTML += `
        <div class="item">
          ${f.name}
          <button onclick="downloadFile('${f._id}')">Download</button>
          <button onclick="deleteFile('${f._id}')">Delete</button>
        </div>
      `;
    });

  } catch (err) {
    console.error("Error loading drive:", err);
    container.innerHTML = `<p style="color:red;">Error loading drive</p>`;
  }
}

// Render breadcrumb navigation
function renderBreadcrumb() {
  const container = document.getElementById('driveContent');
  let breadcrumb = `<div class="breadcrumb">`;

  breadcrumb += `<span onclick="loadDrive(null, 'Root')">Root</span>`;

  folderPath.forEach((f, index) => {
    breadcrumb += ` / <span onclick="navigateTo(${index})">${f.name}</span>`;
  });

  breadcrumb += `</div>`;
  container.innerHTML += breadcrumb;
}

// Navigate to a breadcrumb index
function navigateTo(index) {
  const target = folderPath[index];
  folderPath = folderPath.slice(0, index + 1);
  loadDrive(target.id, target.name, false);
}

// Back navigation (one step up)
function goBack() {
  folderPath.pop(); // remove current
  const parent = folderPath.length > 0 ? folderPath[folderPath.length - 1] : null;
  if (parent) {
    loadDrive(parent.id, parent.name, false);
  } else {
    loadDrive(null, "Root", false);
  }
}

// Create folder
document.getElementById('folderForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('folderName').value;

  try {
    const res = await fetch('/api/folders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentFolder: currentFolder })
    });

    const data = await res.json();
    alert(data.name ? "Folder created!" : data.message);
    document.getElementById('folderForm').reset();
    loadDrive(currentFolder, null, false);
  } catch (err) {
    alert("Error creating folder");
  }
});

// Upload file
document.getElementById('fileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = document.getElementById('file').files[0];
  if (!file) return alert("Please select a file");

  const formData = new FormData();
  formData.append('file', file);
  if (currentFolder) formData.append('parentFolder', currentFolder);

  try {
    const res = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    alert(data.name ? "File uploaded!" : data.message);
    document.getElementById('fileForm').reset();
    loadDrive(currentFolder, null, false);
  } catch (err) {
    alert("Error uploading file");
  }
});

// Edit folder
async function editFolder(id, oldName) {
  const newName = prompt("Enter new folder name:", oldName);
  if (!newName) return;

  try {
    const res = await fetch(`/api/folders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    });

    const data = await res.json();
    alert(data.name ? "Folder updated!" : data.message);
    loadDrive(currentFolder, null, false);
  } catch (err) {
    alert("Error updating folder");
  }
}

// Delete folder
async function deleteFolder(id) {
  if (!confirm("Are you sure you want to delete this folder and its contents?")) return;

  try {
    const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' });
    const data = await res.json();
    alert(data.message);
    loadDrive(currentFolder, null, false);
  } catch (err) {
    alert("Error deleting folder");
  }
}

// Delete file
async function deleteFile(id) {
  if (!confirm("Are you sure you want to delete this file?")) return;

  try {
    const res = await fetch(`/api/files/${id}`, { method: 'DELETE' });
    const data = await res.json();
    alert(data.message);
    loadDrive(currentFolder, null, false);
  } catch (err) {
    alert("Error deleting file");
  }
}

// Download file
async function downloadFile(id) {
  try {
    const res = await fetch(`/api/files/download/${id}`);
    const data = await res.json();

    if (data.url) {
      // Open the signed Supabase URL in a new tab
      window.open(data.url, "_blank");
    } else {
      alert(data.message || "Failed to generate download link");
    }
  } catch (err) {
    console.error("Error downloading file:", err);
    alert("Error downloading file");
  }
}

// Logout
function logout() {
  fetch('/api/auth/logout', { method: 'POST' }).then(() => {
    window.location.href = 'login.html';
  });
}

// Initial load
loadDrive();
