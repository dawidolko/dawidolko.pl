//**********NAV**********
const nav = document.querySelector(".nav");
const navLinks = document.querySelector(".nav__links");
const navBtn = document.querySelector(".nav__button");
const navOpen = document.querySelector(".nav__open");
const navAll = document.querySelectorAll(".nav__link");

navBtn.addEventListener("click", () => {
	navLinks.classList.toggle("nav__links--active");
	navOpen.classList.toggle("nav__hide");
});

navAll.forEach((el) => {
	el.addEventListener("click", () => {
		navLinks.classList.remove("nav__links--active");
		navOpen.classList.toggle("nav__hide");
	});
});

window.addEventListener("scroll", () => {
	if (window.scrollY > 80) {
		nav.classList.add("nav__bgc");
	} else {
		nav.classList.remove("nav__bgc");
	}
});

//**********REVEAL**********
const reveal = () => {
	const elements = document.querySelectorAll(".move, .moves");
	const windowHeight = window.innerHeight;
	const revealPoint = 50;
	const revealPointSmall = 20;

	elements.forEach((element) => {
		const revealTop = element.getBoundingClientRect().top;

		if (revealTop < windowHeight - revealPoint) {
			element.classList.add("active");
		}

		if (
			(element.classList.contains("move") &&
				revealTop < windowHeight - revealPointSmall) ||
			(element.classList.contains("moves") &&
				revealTop < windowHeight - revealPoint)
		) {
			element.style.opacity = "1";
			element.style.transform = "translateY(0)";
		}
	});
};
window.addEventListener("scroll", reveal);

//**********COPY EMAIL**********
const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
const contactMessage = document.querySelector(".info__message");
const aboutMessage = document.querySelector(".about__message");

emailLinks.forEach((link) => {
	link.addEventListener("click", async (event) => {
		event.preventDefault();
		const email = link.getAttribute("href").replace("mailto:", "");

		try {
			if (window.innerWidth >= 768) {
				await navigator.clipboard.writeText(email);
				if (link.closest(".contact")) {
					contactMessage.style.display = "block";
					setTimeout(() => {
						contactMessage.style.display = "none";
					}, 2000);
				} else if (link.closest(".about")) {
					aboutMessage.style.display = "block";
					setTimeout(() => {
						aboutMessage.style.display = "none";
					}, 2000);
				}
			} else {
				window.location.href = `mailto:${email}`;
			}
		} catch (err) {}
	});
});

//**********FOOTER DATE **********
const currentYear = document.querySelector(".footer__date");
currentYear.innerText = new Date().getFullYear();