document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("darkmode") === "active") {
        document.body.classList.add("darkmode");
    }
})