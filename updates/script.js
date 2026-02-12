fetch("updates.json")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("updates");
      latest_update = 1;

      data.forEach(update => {
        const updateDiv = document.createElement("div");
        updateDiv.classList.add("update");
        if (latest_update === 1) {
            updateDiv.classList.add("latest");
            latest_update = 0;
        }

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
