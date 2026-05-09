const taskMessage   = document.getElementById("taskMessage");
const taskForm      = document.getElementById("taskForm");
const taskList      = document.getElementById("taskList");
const logoutBtn     = document.getElementById("logoutBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveTaskBtn   = document.getElementById("saveTaskBtn");
const refreshBtn    = document.getElementById("refreshBtn");
const userBadge     = document.getElementById("userBadge");
const userAvatar    = document.getElementById("userAvatar");
const drawerTitle   = document.getElementById("drawerTitle");
const taskDrawer    = document.getElementById("taskDrawer");
const drawerOverlay = document.getElementById("drawerOverlay");
const drawerClose   = document.getElementById("drawerClose");
const openFormBtn   = document.getElementById("openFormBtn");
const newTaskNav    = document.getElementById("newTaskNav");

const totalTasks      = document.getElementById("totalTasks");
const completedTasks  = document.getElementById("completedTasks");
const pendingTasks    = document.getElementById("pendingTasks");
const completionBadge = document.getElementById("completionBadge");

let editingTaskId = null;
let tasksCache    = [];

const storedUser = getStoredUser();
const username   = storedUser?.username || "Member";
userBadge.textContent  = username;
userAvatar.textContent = username.charAt(0).toUpperCase();

const socket = io(API_BASE, { transports: ["websocket", "polling"], withCredentials: true });

socket.on("notification", (payload) => {
  if (payload?.message) setStatus(taskMessage, payload.message);
});

socket.on("task_updated", () => loadDashboard({ quiet: true }));

function openDrawer() {
  taskDrawer.classList.add("open");
  drawerOverlay.classList.add("open");
}

function closeDrawer() {
  taskDrawer.classList.remove("open");
  drawerOverlay.classList.remove("open");
  resetTaskForm();
}

openFormBtn.addEventListener("click", openDrawer);
newTaskNav.addEventListener("click", (e) => { e.preventDefault(); openDrawer(); });
drawerClose.addEventListener("click", closeDrawer);
drawerOverlay.addEventListener("click", closeDrawer);
cancelEditBtn.addEventListener("click", closeDrawer);

async function loadTasks() {
  const data = await apiFetch("/api/tasks");
  tasksCache = data.tasks || [];
  renderTasks(tasksCache);
}

async function loadAnalytics() {
  const data = await apiFetch("/api/analytics");
  totalTasks.textContent      = data.total_tasks;
  completedTasks.textContent  = data.completed_tasks;
  pendingTasks.textContent    = data.pending_tasks;
  completionBadge.textContent = `${data.completion_percentage}%`;
}

async function loadDashboard({ quiet = false } = {}) {
  try {
    await Promise.all([loadTasks(), loadAnalytics()]);
    if (!quiet) setStatus(taskMessage, "Dashboard refreshed.");
    return true;
  } catch (error) {
    if (error.status === 401) {
      storeUser(null);
      window.location.href = "auth.html";
      return false;
    }
    setStatus(taskMessage, "Unable to load dashboard.", true);
    return false;
  }
}

function renderTasks(tasks) {
  if (!tasks || tasks.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        <svg width="40" height="40" fill="none" stroke="#94a3b8" stroke-width="1.5" viewBox="0 0 24 24">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        <p>No tasks yet. Click "Add Task" to get started.</p>
      </div>`;
    return;
  }

  taskList.innerHTML = `
    <table class="task-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Description</th>
          <th>Priority</th>
          <th>Status</th>
          <th>Created</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${tasks.map((task) => `
          <tr>
            <td class="task-title-cell">${escapeHtml(task.title)}</td>
            <td class="task-desc-cell">${escapeHtml(task.description || "—")}</td>
            <td><span class="badge priority-${task.priority}">${capitalize(task.priority)}</span></td>
            <td><span class="badge status-${task.status}">${formatStatus(task.status)}</span></td>
            <td class="task-date-cell">${formatDate(task.created_at)}</td>
            <td>
              <div class="task-row-actions">
                <button type="button" data-action="edit" data-id="${task.id}">Edit</button>
                <button type="button" data-action="delete" data-id="${task.id}">Delete</button>
              </div>
            </td>
          </tr>`).join("")}
      </tbody>
    </table>`;
}

function setEditMode(task) {
  editingTaskId = task.id;
  taskForm.title.value       = task.title;
  taskForm.description.value = task.description || "";
  taskForm.priority.value    = task.priority;
  taskForm.status.value      = task.status;
  saveTaskBtn.textContent    = "Update Task";
  drawerTitle.textContent    = "Edit Task";
  cancelEditBtn.classList.remove("hidden");
  openDrawer();
}

function resetTaskForm() {
  editingTaskId = null;
  taskForm.reset();
  saveTaskBtn.textContent = "Save Task";
  drawerTitle.textContent = "New Task";
  cancelEditBtn.classList.add("hidden");
}

logoutBtn.addEventListener("click", async () => {
  try { await apiFetch("/api/auth/logout", { method: "POST" }); } catch (_) {}
  storeUser(null);
  window.location.href = "auth.html";
});

refreshBtn.addEventListener("click", () => loadDashboard());

taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(taskMessage, "");

  const payload = {
    title:       taskForm.title.value.trim(),
    description: taskForm.description.value.trim(),
    priority:    taskForm.priority.value,
    status:      taskForm.status.value,
  };

  try {
    if (editingTaskId) {
      await apiFetch(`/api/tasks/${editingTaskId}`, { method: "PUT", body: JSON.stringify(payload) });
      setStatus(taskMessage, "Task updated.");
    } else {
      await apiFetch("/api/tasks", { method: "POST", body: JSON.stringify(payload) });
      setStatus(taskMessage, "Task added.");
    }
    closeDrawer();
    await loadDashboard({ quiet: true });
  } catch (error) {
    const msg = error.data?.error || error.data?.errors?.join(", ");
    setStatus(taskMessage, msg || "Unable to save task.", true);
  }
});

taskList.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const action = button.dataset.action;
  const taskId = Number(button.dataset.id);
  const task   = tasksCache.find((t) => t.id === taskId);
  if (!task) return;

  if (action === "edit") { setEditMode(task); return; }

  if (action === "delete") {
    try {
      await apiFetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      setStatus(taskMessage, "Task deleted.");
      await loadDashboard({ quiet: true });
    } catch (error) {
      setStatus(taskMessage, error.data?.error || "Unable to delete task.", true);
    }
  }
});

loadDashboard({ quiet: true });
