(function () {
  const originalWarn = console.warn;
  console.warn = function (...args) {
    if (
      args[0] &&
      typeof args[0] === "string" &&
      args[0].includes("Chrome is moving towards a new experience")
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
})();

document.addEventListener("DOMContentLoaded", function () {
  if (document.querySelector(".header__write")) {
    let typed = new Typed(".header__write", {
      strings: ["Youtube", "Instagram"],
      typeSpeed: 150,
      backSpeed: 100,
      loop: true,
    });
  }
  const form = document.getElementById("contact-form");
  if (!form) return;
  const msgStatus = document.querySelector(".contact__msg-status");
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData(this);
    fetch("http://form.dawidolko.pl/mail.php", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (response.ok) {
          return response.text();
        } else {
          throw new Error("Server responded with " + response.status);
        }
      })
      .then((text) => {
        msgStatus.textContent = "Message sent!";
        msgStatus.classList.add("success");
        setTimeout(() => msgStatus.classList.remove("success"), 5000);
        form.reset();
      })
      .catch((error) => {
        console.error("Error:", error);
        msgStatus.textContent = "Error sending message!";
        msgStatus.classList.add("error");
        setTimeout(() => msgStatus.classList.remove("error"), 5000);
      });
  });
});
