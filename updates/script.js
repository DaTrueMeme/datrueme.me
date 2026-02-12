fetch("updates.json")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("updates");

      data.forEach(update => {
        const updateDiv = document.createElement("div");
        updateDiv.classList.add("update");

        updateDiv.innerHTML = `
          <h2>v${update.version}</h2>
          <small>( ${update.date} )</small>
          <ul>
            ${update.changes.map(change => `<li>> ${change}</li>`).join("")}
          </ul>
        `;

        container.appendChild(updateDiv);
      });
    });
