document.addEventListener("DOMContentLoaded", function () {
  if (typeof Typed !== "undefined") {
    new Typed(".header__write", {
      strings: ["Life", "Perspective"],
      typeSpeed: 150,
      backSpeed: 100,
      loop: true,
    });
  }
  var form = document.getElementById("contact-form");
  var msgStatus = document.querySelector(".contact__msg-status");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var formData = new FormData(this);
      fetch("http://form.dawidolko.pl/mail.php", {
        method: "POST",
        body: formData,
      })
        .then(function (response) {
          if (response.ok) {
            return response.text();
          } else {
            throw new Error("Server responded with " + response.status);
          }
        })
        .then(function (text) {
          msgStatus.textContent = "Message sent!";
          msgStatus.classList.add("success");
          setTimeout(function () {
            msgStatus.classList.remove("success");
          }, 5000);
          form.reset();
        })
        .catch(function (error) {
          msgStatus.textContent = "Error sending message!";
          msgStatus.classList.add("error");
          setTimeout(function () {
            msgStatus.classList.remove("error");
          }, 5000);
        });
    });
  }
  document.querySelector(".footer__date").textContent =
    new Date().getFullYear();
  var modal = document.getElementById("modal");
  var modalImage = document.getElementById("modalImage");
  var modalClose = document.getElementById("modalClose");
  document.querySelectorAll(".img-link").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      modal.classList.add("active");
      modalImage.src = this.getAttribute("data-src");
    });
  });
  modalClose.addEventListener("click", function () {
    modal.classList.remove("active");
  });
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.classList.remove("active");
    }
  });
});
