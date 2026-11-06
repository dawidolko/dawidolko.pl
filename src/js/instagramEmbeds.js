/*
 * embed.js pulls in several megabytes, so it waits until a post is close to
 * the viewport instead of slowing down every visit.
 */
var loadInstagram = function () {
  var script = document.createElement("script");
  script.src = "https://www.instagram.com/embed.js";
  script.async = true;
  script.onload = function () {
    instgrm.Embeds.process();
  };
  document.body.appendChild(script);
  /*
   * embed.js injects its iframes without a title, which leaves them unnamed
   * for screen readers (WCAG 4.1.2). Each one takes its name from the heading
   * that already describes the post in the same box.
   */
  var nameEmbeds = function () {
    document.querySelectorAll(".hobby-box iframe:not([title])").forEach(function (frame) {
      var box = frame.closest(".hobby-box");
      var heading = box && box.querySelector(".overlay h2");
      frame.setAttribute("title", heading ? heading.textContent.trim() : "Embedded Instagram post");
    });
  };
  nameEmbeds();
  /* The iframes appear asynchronously, so watch until they are all named. */
  new MutationObserver(nameEmbeds).observe(document.body, {
    childList: true,
    subtree: true,
  });
};
var firstPost = document.querySelector(".instagram-media");
new IntersectionObserver(
  function (entries, observer) {
    if (entries[0].isIntersecting) {
      observer.disconnect();
      loadInstagram();
    }
  },
  { rootMargin: "300px" },
).observe(firstPost);
