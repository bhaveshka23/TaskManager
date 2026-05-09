const authMessage = document.getElementById("authMessage");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

async function handleSessionRedirect() {
  const token = localStorage.getItem("taskflow:token");
  if (!token) return;
  try {
    await apiFetch("/api/analytics");
    window.location.href = "dashboard.html";
  } catch (error) {
    if (error.status === 401) {
      storeUser(null);
    } else if (error.status) {
      setStatus(authMessage, "Unable to check session.", true);
    }
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(authMessage, "");
  const submitButton = loginForm.querySelector("button[type='submit']");
  submitButton.classList.add("is-loading");
  submitButton.disabled = true;

  const payload = {
    email: loginForm.email.value.trim(),
    password: loginForm.password.value,
  };

  try {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    storeUser(data.user);
    storeToken(data.token);
    window.location.href = "dashboard.html";
  } catch (error) {
    const serverMessage = error.data?.error || "Login failed.";
    setStatus(authMessage, serverMessage, true);
  } finally {
    submitButton.classList.remove("is-loading");
    submitButton.disabled = false;
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(authMessage, "");
  const submitButton = registerForm.querySelector("button[type='submit']");
  submitButton.classList.add("is-loading");
  submitButton.disabled = true;

  const payload = {
    username: registerForm.username.value.trim(),
    email: registerForm.email.value.trim(),
    password: registerForm.password.value,
  };

  try {
    await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setStatus(authMessage, "Account created. Please log in.");
    document.querySelector('[data-tab="login"]').click();
  } catch (error) {
    const serverMessage = error.data?.error || error.data?.errors?.join(", ");
    setStatus(authMessage, serverMessage || "Registration failed.", true);
  } finally {
    submitButton.classList.remove("is-loading");
    submitButton.disabled = false;
  }
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((btn) => btn.classList.remove("active"));
    tab.classList.add("active");
    const isLogin = tab.dataset.tab === "login";
    loginForm.classList.toggle("hidden", !isLogin);
    registerForm.classList.toggle("hidden", isLogin);
    setStatus(authMessage, "");
  });
});

document.querySelectorAll(".toggle-password").forEach((button) => {
  button.addEventListener("click", () => {
    const field = button.closest(".password-field");
    const input = field?.querySelector("input");
    if (!input) return;
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    button.textContent = isHidden ? "Hide" : "Show";
    button.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
  });
});

handleSessionRedirect();
