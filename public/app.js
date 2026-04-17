const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");

const registerMessage = document.getElementById("registerMessage");
const loginMessage = document.getElementById("loginMessage");

function setMessage(element, text, type) {
  element.textContent = text;
  element.className = `message ${type}`;
}

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.getElementById("regUsername").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(registerMessage, data.message || "Registration failed.", "error");
      return;
    }

    setMessage(registerMessage, data.message, "success");
    registerForm.reset();
  } catch (error) {
    setMessage(registerMessage, "Unable to reach server.", "error");
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(loginMessage, data.message || "Login failed.", "error");
      return;
    }

    setMessage(loginMessage, data.message, "success");
    loginForm.reset();
  } catch (error) {
    setMessage(loginMessage, "Unable to reach server.", "error");
  }
});
