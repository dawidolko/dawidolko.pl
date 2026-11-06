/*
 * Detail page behaviour: the screenshot lightbox and the demo toggle. The
 * lightbox is a native <dialog>, which already traps focus, closes on Escape
 * and hands focus back to the thumbnail that opened it.
 */
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll(".gallery__link"));
  var dialog = null;
  var image = null;
  var caption = null;
  var current = 0;

  function show(index) {
    current = (index + links.length) % links.length;
    var thumb = links[current].querySelector("img");
    image.src = links[current].getAttribute("href");
    image.alt = thumb.alt;
    image.width = thumb.width;
    image.height = thumb.height;
    caption.textContent = current + 1 + " of " + links.length;
  }

  function control(className, label, text, onClick) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "lightbox__control " + className;
    button.setAttribute("aria-label", label);
    button.innerHTML = '<span aria-hidden="true">' + text + "</span>";
    button.addEventListener("click", onClick);
    return button;
  }

  function buildDialog() {
    dialog = document.createElement("dialog");
    dialog.className = "lightbox";
    dialog.setAttribute("aria-label", "Screenshot viewer");
    image = document.createElement("img");
    image.className = "lightbox__image";
    caption = document.createElement("p");
    caption.className = "lightbox__caption";
    caption.setAttribute("aria-live", "polite");
    var close = control("lightbox__close", "Close viewer", "&times;", function () {
      dialog.close();
    });
    dialog.appendChild(close);
    if (links.length > 1) {
      dialog.appendChild(
        control("lightbox__prev", "Previous screenshot", "&lsaquo;", function () {
          show(current - 1);
        }),
      );
      dialog.appendChild(
        control("lightbox__next", "Next screenshot", "&rsaquo;", function () {
          show(current + 1);
        }),
      );
    }
    dialog.appendChild(image);
    dialog.appendChild(caption);
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("keydown", function (event) {
      var moves = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: links.length - 1 };
      if (Object.prototype.hasOwnProperty.call(moves, event.key)) {
        event.preventDefault();
        show(moves[event.key]);
      }
    });
    document.body.appendChild(dialog);
    close.autofocus = true;
  }

  links.forEach(function (link, index) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      if (!dialog) buildDialog();
      show(index);
      dialog.showModal();
    });
  });

  /*
   * An animated WebP cannot be paused, so Stop swaps the still back in. The
   * demo file is only requested after Play, and nothing moves before that.
   */
  document.querySelectorAll(".demo").forEach(function (demo) {
    var media = demo.querySelector(".demo__media");
    var toggle = demo.querySelector(".demo__toggle");
    var still = media.getAttribute("src") || "";
    var playing = false;
    toggle.addEventListener("click", function () {
      playing = !playing;
      media.hidden = !playing && !still;
      if (playing) media.src = demo.getAttribute("data-demo");
      else if (still) media.src = still;
      else media.removeAttribute("src");
      toggle.textContent = playing ? "Stop demo" : "Play demo";
    });
  });
})();
