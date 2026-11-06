document.querySelector(".footer__date").textContent =
  new Date().getFullYear();
document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("modal");
  const modalImage = document.getElementById("modalImage");
  const modalClose = document.getElementById("modalClose");
  document.querySelectorAll(".img-link").forEach((link) => {
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
    
