const API_URL = "http://localhost:8080/api/resources";
const FILE_API = "http://localhost:8080/api/files";
const AUTH_API = "http://localhost:8080/api/auth";

const resourceList = document.getElementById("resourceList");
const resourceMessage = document.getElementById("resourceMessage");
const resourceForm = document.getElementById("resourceForm");
const formMessage = document.getElementById("formMessage");
const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const searchBtn = document.getElementById("searchBtn");
const submitBtn = resourceForm.querySelector(".submit-btn");

let resources = [];
let editingId = null;
let adminToken = sessionStorage.getItem("adminToken");

// ---------- Cancel Edit button ----------
const cancelBtn = document.createElement("button");
cancelBtn.type = "button";
cancelBtn.className = "btn secondary submit-btn";
cancelBtn.style.marginTop = "10px";
cancelBtn.textContent = "Cancel Edit";
cancelBtn.hidden = true;
submitBtn.after(cancelBtn);

// ---------- Admin login UI ----------
const authBtn = document.createElement("button");
authBtn.type = "button";
authBtn.className = "btn secondary";
document.querySelector(".topbar").appendChild(authBtn);

const loginDialog = document.createElement("dialog");
loginDialog.className = "login-dialog";
loginDialog.innerHTML = `
    <form id="loginForm">
        <h3>Admin Login</h3>
        <input id="loginUser" type="text" placeholder="Username" required>
        <input id="loginPass" type="password" placeholder="Password" required>
        <p id="loginMsg" class="message"></p>
        <div class="card-actions">
            <button type="submit" class="btn primary">Login</button>
            <button type="button" id="loginCancel" class="btn secondary">Cancel</button>
        </div>
    </form>
`;
document.body.appendChild(loginDialog);

const loginForm = loginDialog.querySelector("#loginForm");
const loginMsg = loginDialog.querySelector("#loginMsg");

function isAdmin() {
    return Boolean(adminToken);
}

function updateAuthUI() {
    authBtn.textContent = isAdmin() ? "Logout (Admin)" : "Admin Login";
    renderResources();
}

function authHeaders(extra = {}) {
    return adminToken ? { ...extra, "X-Admin-Token": adminToken } : extra;
}

function clearSession() {
    adminToken = null;
    sessionStorage.removeItem("adminToken");
    if (editingId !== null) stopEditing();
    updateAuthUI();
}

authBtn.addEventListener("click", async () => {
    if (isAdmin()) {
        try {
            await fetch(`${AUTH_API}/logout`, { method: "POST", headers: authHeaders() });
        } catch (e) {
            console.error("Logout request failed:", e);
        }
        clearSession();
        showMessage(resourceMessage, "You have logged out.");
    } else {
        loginMsg.textContent = "";
        loginForm.reset();
        loginDialog.showModal();
    }
});

loginDialog.querySelector("#loginCancel").addEventListener("click", () => loginDialog.close());

loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    loginMsg.textContent = "Checking...";
    loginMsg.style.color = "#6b7280";

    try {
        const response = await fetch(`${AUTH_API}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: loginDialog.querySelector("#loginUser").value.trim(),
                password: loginDialog.querySelector("#loginPass").value
            })
        });

        if (response.status === 401) {
            loginMsg.textContent = "Wrong username or password.";
            loginMsg.style.color = "#c62828";
            return;
        }
        if (!response.ok) throw new Error("Server returned status " + response.status);

        const data = await response.json();
        adminToken = data.token;
        sessionStorage.setItem("adminToken", adminToken);
        loginDialog.close();
        updateAuthUI();
        showMessage(resourceMessage, "Logged in as admin. You can now edit and delete.");
    } catch (error) {
        console.error("Login failed:", error);
        loginMsg.textContent = "Cannot reach the backend.";
        loginMsg.style.color = "#c62828";
    }
});

// ---------- Helpers ----------
function showMessage(element, message, isError = false) {
    element.textContent = message;
    element.style.color = isError ? "#c62828" : "#087f70";
}

function normalize(value) {
    return String(value ?? "").toLowerCase().trim();
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
}

// ---------- Load ----------
async function loadResources() {
    showMessage(resourceMessage, "Loading learning resources...");
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Server returned status " + response.status);

        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Unexpected data format.");

        resources = data;
        renderResources();
        updateStatistics();
        showMessage(resourceMessage,
            resources.length ? "" : "No learning resources found yet.");
    } catch (error) {
        console.error("Loading resources failed:", error);
        resources = [];
        renderResources();
        updateStatistics();
        showMessage(resourceMessage,
            "Could not connect to the backend. Is Spring Boot running on port 8080?", true);
    }
}

// ---------- Render ----------
function renderResources() {
    const searchTerm = normalize(searchInput.value);
    const selectedType = normalize(typeFilter.value);

    const filtered = resources.filter(r => {
        const matchesSearch =
            normalize(r.title).includes(searchTerm) ||
            normalize(r.courseName).includes(searchTerm) ||
            normalize(r.description).includes(searchTerm);
        const matchesType = !selectedType || normalize(r.resourceType) === selectedType;
        return matchesSearch && matchesType;
    });

    resourceList.replaceChildren();

    if (filtered.length === 0) {
        const empty = document.createElement("p");
        empty.className = "message";
        empty.textContent = "No matching resources found.";
        resourceList.appendChild(empty);
        return;
    }

    filtered.forEach(r => {
        const card = document.createElement("article");
        card.className = "resource-card";

        const downloadHTML = r.filePath
            ? `<a class="btn primary" href="${FILE_API}/download/${encodeURIComponent(r.filePath)}">⬇ Download</a>`
            : `<small>No file attached</small>`;

        const adminHTML = isAdmin()
            ? `<button type="button" class="btn secondary" data-action="edit" data-id="${r.id}">✏ Edit</button>
               <button type="button" class="btn danger" data-action="delete" data-id="${r.id}">🗑 Delete</button>`
            : "";

        card.innerHTML = `
            <span class="resource-type">${escapeHTML(r.resourceType) || "Resource"}</span>
            <h3>${escapeHTML(r.title) || "Untitled Resource"}</h3>
            <p>${escapeHTML(r.description) || "No description provided."}</p>
            <div class="resource-meta">
                <p><strong>Course:</strong> ${escapeHTML(r.courseName) || "Not specified"}</p>
                <p><strong>Academic Year:</strong> ${escapeHTML(r.academicYear) || "Not specified"}</p>
                <p><strong>Uploaded by:</strong> ${escapeHTML(r.uploadedBy) || "Not specified"}</p>
                ${r.fileName ? `<p><strong>File:</strong> ${escapeHTML(r.fileName)}</p>` : ""}
            </div>
            <div class="card-actions">
                ${downloadHTML}
                ${adminHTML}
            </div>
        `;
        resourceList.appendChild(card);
    });
}

function updateStatistics() {
    const count = t => resources.filter(r => normalize(r.resourceType) === t).length;
    document.getElementById("totalResources").textContent = resources.length;
    document.getElementById("totalNotes").textContent = count("notes");
    document.getElementById("totalPapers").textContent = count("past paper");
    document.getElementById("totalTutorials").textContent = count("tutorial");
}

// ---------- Edit ----------
function startEdit(id) {
    const r = resources.find(item => item.id === id);
    if (!r) return;

    const f = resourceForm.elements;
    f["title"].value = r.title ?? "";
    f["resourceType"].value = r.resourceType ?? "";
    f["description"].value = r.description ?? "";
    f["courseName"].value = r.courseName ?? "";
    f["academicYear"].value = r.academicYear ?? "";
    f["uploadedBy"].value = r.uploadedBy ?? "";

    editingId = id;
    submitBtn.textContent = "Update Resource";
    cancelBtn.hidden = false;
    showMessage(formMessage,
        "Editing: " + (r.title ?? "") + ". Choose a new file only if you want to replace the old one.");

    document.getElementById("upload").scrollIntoView({ behavior: "smooth" });
}

function stopEditing() {
    editingId = null;
    resourceForm.reset();
    submitBtn.textContent = "Submit Resource";
    cancelBtn.hidden = true;
}

cancelBtn.addEventListener("click", () => {
    stopEditing();
    showMessage(formMessage, "");
});

// ---------- Delete ----------
async function deleteResource(id) {
    const r = resources.find(item => item.id === id);
    if (!confirm(`Delete "${r ? r.title : "this resource"}"? This cannot be undone.`)) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE",
            headers: authHeaders()
        });

        if (response.status === 401) {
            clearSession();
            showMessage(resourceMessage, "Session expired. Please log in again.", true);
            return;
        }
        if (!response.ok) throw new Error("Server returned status " + response.status);

        if (editingId === id) stopEditing();
        await loadResources();
        showMessage(resourceMessage, "Resource deleted.");
    } catch (error) {
        console.error("Delete failed:", error);
        showMessage(resourceMessage, "Delete failed. Check that the backend is running.", true);
    }
}

resourceList.addEventListener("click", event => {
    const btn = event.target.closest("button[data-action]");
    if (!btn) return;

    const id = Number(btn.dataset.id);
    if (btn.dataset.action === "edit") startEdit(id);
    if (btn.dataset.action === "delete") deleteResource(id);
});

searchBtn.addEventListener("click", renderResources);
searchInput.addEventListener("input", renderResources);
typeFilter.addEventListener("change", renderResources);

// ---------- Submit (Create or Update) ----------
resourceForm.addEventListener("submit", async event => {
    event.preventDefault();

    const formData = new FormData(resourceForm);
    const file = document.getElementById("resourceFile").files[0];
    const existing = editingId ? resources.find(item => item.id === editingId) : null;

    const resource = {
        title: formData.get("title").trim(),
        description: formData.get("description").trim(),
        resourceType: formData.get("resourceType"),
        courseName: formData.get("courseName").trim(),
        academicYear: Number(formData.get("academicYear")),
        uploadedBy: formData.get("uploadedBy").trim(),
        fileName: existing ? existing.fileName : null,
        filePath: existing ? existing.filePath : null
    };

    showMessage(formMessage, editingId ? "Updating resource..." : "Submitting resource...");

    try {
        if (file) {
            const fileData = new FormData();
            fileData.append("file", file);

            const uploadRes = await fetch(`${FILE_API}/upload`, {
                method: "POST",
                body: fileData
            });
            if (!uploadRes.ok) throw new Error("File upload failed: " + uploadRes.status);

            const uploaded = await uploadRes.json();
            resource.fileName = uploaded.fileName;
            resource.filePath = uploaded.filePath;
        }

        const url = editingId ? `${API_URL}/${editingId}` : API_URL;
        const method = editingId ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: authHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify(resource)
        });

        if (response.status === 401) {
            clearSession();
            showMessage(formMessage, "Session expired. Please log in again.", true);
            return;
        }
        if (!response.ok) throw new Error("Server returned status " + response.status);

        const wasEditing = editingId !== null;
        stopEditing();
        showMessage(formMessage,
            wasEditing ? "Resource updated successfully." : "Resource submitted successfully.");
        await loadResources();
    } catch (error) {
        console.error("Saving resource failed:", error);
        showMessage(formMessage, "Failed to save. Check that the backend is running.", true);
    }
});

updateAuthUI();
loadResources();