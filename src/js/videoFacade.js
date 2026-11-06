/*
 * Click-to-load YouTube player, used on the hobbies and project pages. The
 * poster is a local file, so the page contacts YouTube only after the click.
 */
document.querySelectorAll(".video-facade[data-video]").forEach(function (button) {
  button.addEventListener("click", function () {
    var frame = document.createElement("iframe");
    frame.title = button.dataset.title;
    frame.src = "https://www.youtube-nocookie.com/embed/" + button.dataset.video + "?autoplay=1";
    frame.allow = "autoplay; encrypted-media; picture-in-picture";
    frame.allowFullscreen = true;
    button.replaceWith(frame);
    frame.focus();
  });
});
