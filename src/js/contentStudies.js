let typed = new Typed(".header__write", {
  strings: ["of Rzeszów", "of Rzeszów"],
  typeSpeed: 150,
  backSpeed: 100,
  loop: true,
});

document.addEventListener("DOMContentLoaded", function () {
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
