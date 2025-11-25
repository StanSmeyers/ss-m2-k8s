async function fetchData() {
  try {
    const [nameRes, containerRes] = await Promise.all([
      fetch("/api/name"),
      fetch("/api/container")
    ]);

    const nameData = await nameRes.json();
    const containerData = await containerRes.json();

    document.getElementById("name").textContent =
      nameData.name || "(geen naam)";
    document.getElementById("container").textContent =
      containerData.containerId || "(geen id)";
  } catch (err) {
    console.error("Error fetching data", err);
    document.getElementById("status").textContent = "Error fetching data";
  }
}

async function saveName() {
  const newName = document.getElementById("newName").value;
  if (!newName) {
    alert("Vul een naam in");
    return;
  }

  try {
    const res = await fetch("/api/name", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName })
    });

    if (!res.ok) {
      throw new Error("API error");
    }

    const data = await res.json();
    document.getElementById("status").textContent =
      "Naam opgeslagen: " + data.name;
    await fetchData(); // refresh
  } catch (err) {
    console.error("Error updating name", err);
    document.getElementById("status").textContent = "Error updating name";
  }
}

document.getElementById("saveBtn").addEventListener("click", saveName);

// init + elke 5s refresh
fetchData();
setInterval(fetchData, 5000);
