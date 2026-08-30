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
  /*
     The element that opened the viewer, so focus can be handed back to it on
     close. Without this a keyboard user is dropped at the top of the document
     and has to tab all the way back to where they were.
  */
  var lastTrigger = null;

  function openViewer(trigger) {
    lastTrigger = trigger;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    modalImage.src = trigger.getAttribute("data-src");
    modalImage.alt = trigger.getAttribute("data-alt") || "";
    modalClose.focus();
  }

  function closeViewer() {
    if (!modal.classList.contains("active")) return;
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    if (lastTrigger) {
      lastTrigger.focus();
      lastTrigger = null;
    }
  }

  document.querySelectorAll(".img-link").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      openViewer(this);
    });
  });

  modalClose.addEventListener("click", closeViewer);

  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeViewer();
  });

  // Escape is the expected way out of a dialog; without it the viewer could
  // only be dismissed with the mouse.
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeViewer();
  });

  /*
     Keep Tab inside the dialog while it is open. A focus ring that wanders
     behind the overlay leaves the user operating controls they cannot see.
  */
  modal.addEventListener("keydown", function (e) {
    if (e.key !== "Tab" || !modal.classList.contains("active")) return;
    var focusable = modal.querySelectorAll(
      'a[href], button, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
});
