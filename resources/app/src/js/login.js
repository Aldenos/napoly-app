document.addEventListener("DOMContentLoaded", () => {
  const btnLogin = document.querySelector("button");

  btnLogin.addEventListener("click", () => {
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;
    const err = document.getElementById("login-error");

    if (
      (user === "admin" && pass === "alopiolinmadrid") ||
      (user === "usuario" && pass === "12345678")
    ) {
      localStorage.setItem("usuario", user);
      window.location.href = "panel.html";
    } else {
      err.innerText = "Usuario o contraseña incorrectos";
    }
  });
});