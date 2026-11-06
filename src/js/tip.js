/*
 * Project tooltips. Hover, keyboard focus and tap all open the same element,
 * and WCAG 1.4.13 decides the rest: Escape dismisses without moving focus, the
 * pointer can travel onto the tooltip, and it stays until it is dismissed or
 * the pointer and focus have both left.
 *
 * The tooltip moves to <body> when it opens because the cards are transformed
 * and clip their content, which would trap a fixed element inside the card.
 */
(function () {
  var GAP = 10;
  var EDGE = 8;
  var ARROW_INSET = 14;
  var LEAVE_DELAY = 180;
  var FADE = 160;
  var active = null;
  var tip = null;
  var pinned = false;
  var overTip = false;
  var leaveTimer = 0;
  var frame = 0;

  function place() {
    var box = active.getBoundingClientRect();
    var width = tip.offsetWidth;
    var height = tip.offsetHeight;
    var viewWidth = document.documentElement.clientWidth;
    var viewHeight = window.innerHeight;
    if (box.bottom < 0 || box.top > viewHeight) {
      close();
      return;
    }
    var center = box.left + box.width / 2;
    var above = box.top - GAP - height >= EDGE || box.bottom + GAP + height > viewHeight - EDGE;
    var left = Math.max(EDGE, Math.min(center - width / 2, viewWidth - width - EDGE));
    var top = above ? box.top - GAP - height : box.bottom + GAP;
    top = Math.max(EDGE, Math.min(top, viewHeight - height - EDGE));
    tip.style.transform = "translate(" + Math.round(left) + "px," + Math.round(top) + "px)";
    tip.style.setProperty("--tip-arrow", Math.max(ARROW_INSET, Math.min(center - left, width - ARROW_INSET)) + "px");
    tip.setAttribute("data-placement", above ? "top" : "bottom");
    frame = requestAnimationFrame(place);
  }

  function close() {
    clearTimeout(leaveTimer);
    cancelAnimationFrame(frame);
    if (!tip) return;
    var closing = tip;
    closing.classList.remove("tip--open");
    setTimeout(function () {
      if (!closing.classList.contains("tip--open")) closing.hidden = true;
    }, FADE);
    active = null;
    tip = null;
    pinned = false;
    overTip = false;
  }

  function open(button) {
    clearTimeout(leaveTimer);
    if (active === button) return;
    close();
    active = button;
    tip = document.getElementById(button.getAttribute("aria-describedby"));
    document.body.appendChild(tip);
    tip.hidden = false;
    place();
    tip.getBoundingClientRect();
    tip.classList.add("tip--open");
  }

  function leaveSoon() {
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(function () {
      if (!pinned && !overTip) close();
    }, LEAVE_DELAY);
  }

  document.querySelectorAll(".tip-btn").forEach(function (button) {
    var content = document.getElementById(button.getAttribute("aria-describedby"));
    button.addEventListener("pointerenter", function (event) {
      if (event.pointerType === "mouse") open(button);
    });
    button.addEventListener("pointerleave", function (event) {
      if (event.pointerType === "mouse" && active === button) leaveSoon();
    });
    button.addEventListener("focus", function () {
      if (button.matches(":focus-visible")) open(button);
    });
    button.addEventListener("blur", function () {
      if (active === button && !overTip) {
        pinned = false;
        leaveSoon();
      }
    });
    button.addEventListener("click", function (event) {
      var fromKeyboard = event.detail === 0;
      if (active !== button) {
        open(button);
        pinned = true;
      } else if (pinned || fromKeyboard) {
        close();
      } else {
        pinned = true;
      }
    });
    content.addEventListener("pointerenter", function () {
      overTip = true;
      clearTimeout(leaveTimer);
    });
    content.addEventListener("pointerleave", function () {
      overTip = false;
      leaveSoon();
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && active) close();
  });

  document.addEventListener("pointerdown", function (event) {
    if (active && !active.contains(event.target) && !tip.contains(event.target)) close();
  });
})();
