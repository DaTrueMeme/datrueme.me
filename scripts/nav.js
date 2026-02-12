fetch("/components/nav.html")
    .then(res => res.text())
    .then(data => {
        document.getElementById("nav-container").innerHTML = data;

        initializeNav();
    });

function initializeNav() {
    const themeSwitch = document.getElementById("theme-switch");

    if (themeSwitch) {
        if (localStorage.getItem("darkmode") === "active") {
            document.body.classList.add("darkmode");
        }

        themeSwitch.addEventListener("click", () => {
            document.body.classList.toggle("darkmode");

            if (document.body.classList.contains("darkmode")) {
                localStorage.setItem("darkmode", "active");
            } else {
                localStorage.setItem("darkmode", null);
            }
        });
    }
}

