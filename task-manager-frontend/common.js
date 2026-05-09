const API_BASE = "http://127.0.0.1:5000"

function setStatus(element, message, isError = false) {
  if (!element) return;
  element.textContent = message;
  element.classList.toggle("error", isError);
}

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("taskflow:token");
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    credentials: "include",
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error("Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

function formatStatus(value) {
  return value.replace("_", " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function getStoredUser() {
  const raw = localStorage.getItem("taskflow:user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function storeUser(user) {
  if (!user) {
    localStorage.removeItem("taskflow:user");
    localStorage.removeItem("taskflow:token");
    return;
  }
  localStorage.setItem("taskflow:user", JSON.stringify(user));
}

function storeToken(token) {
  if (!token) {
    localStorage.removeItem("taskflow:token");
    return;
  }
  localStorage.setItem("taskflow:token", token);
}
