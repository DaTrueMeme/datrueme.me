fetch("/components/nav.html")
    .then(res => res.text())
    .then(data => {
        document.getElementById("nav-container").innerHTML = data;

        initializeNav();
    });

function initializeNav() {
    const themeSwitch = document.getElementById("theme-switch");

    if (themeSwitch) {
        themeSwitch.addEventListener("click", () => {
            document.body.classList.toggle("darkmode");
        });
    }
}

