const castBtn = document.getElementById("cast-btn");
const statusBox = document.getElementById("status");
const receiptHint = document.getElementById("receipt-hint");
const stateSelect = document.getElementById("state-select");
const citySelect = document.getElementById("city-select");
const areaSelect = document.getElementById("area-select");
const locationSummary = document.getElementById("location-summary");
const candidateList = document.getElementById("candidate-list");
const voterIdInput = document.getElementById("voter-id-input");
voterIdInput.value = localStorage.getItem("votesetu_voter_id") || "";

function credentialStorageId(voterId) {
  const sessionId = sessionStorage.getItem("votesetu_credential_session");
  return sessionId ? `${voterId}:${sessionId}` : null;
}

const locationData = {
  "uttar-pradesh": {
    label: "Uttar Pradesh",
    cities: {
      "greater-noida": ["Alpha", "Beta", "Knowledge Park", "Pari Chowk", "Surajpur", "Yamuna Expressway"],
    },
  },
};

function fillOptions(select, items, placeholder) {
  select.innerHTML = `<option value="">${placeholder}</option>`;
  items.forEach(([value, label]) => {
    select.add(new Option(label, value));
  });
}

function updateLocationState() {
  const state = locationData[stateSelect.value];
  fillOptions(citySelect, state ? [["greater-noida", "Greater Noida"]] : [], "Select city or district");
  citySelect.disabled = !state;
  areaSelect.disabled = true;
  fillOptions(areaSelect, [], "Select area");
  candidateList.classList.add("is-locked");
  castBtn.disabled = true;
  locationSummary.textContent = state ? "Now choose your city or district." : "Select a state, city and area to load the available ballot.";
}

stateSelect.addEventListener("change", updateLocationState);
citySelect.addEventListener("change", () => {
  const state = locationData[stateSelect.value];
  const areas = state?.cities[citySelect.value] || [];
  fillOptions(areaSelect, areas.map((area) => [area.toLowerCase().replaceAll(" ", "-"), area]), "Select area");
  areaSelect.disabled = !areas.length;
  candidateList.classList.add("is-locked");
  castBtn.disabled = true;
  locationSummary.textContent = areas.length ? "Choose your area to load the ballot." : "Select a city or district.";
});

areaSelect.addEventListener("change", () => {
  const selectedArea = areaSelect.options[areaSelect.selectedIndex]?.text;
  const ready = Boolean(stateSelect.value && citySelect.value && areaSelect.value);
  candidateList.classList.toggle("is-locked", !ready);
  castBtn.disabled = !ready;
  locationSummary.textContent = ready
    ? `Ballot loaded for Greater Noida · ${selectedArea}. This is a VoteSetu demonstration ballot.`
    : "Select a state, city and area to load the available ballot.";
});

function setStatus(kind, message) {
  statusBox.className = `status-box show ${kind}`;
  statusBox.innerHTML = message;
}

castBtn.addEventListener("click", async () => {
  const voterId = voterIdInput.value.trim() || localStorage.getItem("votesetu_voter_id") || "";
  voterIdInput.value = voterId;
  const candidateInput = document.querySelector('input[name="candidate"]:checked');

  if (!stateSelect.value || !citySelect.value || !areaSelect.value) return setStatus("error", "Choose your state, city and area first.");
  if (!voterId) return setStatus("error", "Enter your Voter ID.");
  if (!candidateInput) return setStatus("error", "Select a candidate.");

  const candidate = candidateInput.value;

  castBtn.disabled = true;
  try {
    setStatus("info", '<span class="loader"></span> Unlocking your browser-held credential...');
    const storageId = credentialStorageId(voterId);
    const privateKey = storageId ? await VoteSetuCrypto.loadPrivateKey(storageId) : null;
    if (!privateKey) throw new Error("No credential is stored for this voter in this browser.");

    setStatus("info", '<span class="loader"></span> Signing your ballot on this device...');
    const timestamp = Date.now();
    const message = VoteSetuCrypto.buildBallotMessage(voterId, candidate, timestamp);
    const signature = await VoteSetuCrypto.signMessage(privateKey, message);

    setStatus("info", '<span class="loader"></span> Submitting your signed ballot...');
    const resp = await fetch("/votes/cast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voter_id: voterId,
        candidate,
        timestamp,
        signature,
        state: "Uttar Pradesh",
        city: "Greater Noida",
        area: areaSelect.options[areaSelect.selectedIndex].text,
      }),
    });
    const data = await resp.json();

    if (!resp.ok) {
      setStatus("error", `Vote rejected: ${data.error || "unknown error"}`);
      return;
    }

    setStatus("ok", `Vote accepted for <strong>${candidate}</strong> and queued for the next block.`);
    document.getElementById("cast-seal").style.display = "inline-flex";
    receiptHint.style.display = "block";
    receiptHint.textContent = `Once an admin closes the polling round, fetch your receipt on the Verify page using voter ID: ${voterId}`;
    castBtn.disabled = true;
    castBtn.textContent = "Vote cast";
  } catch (err) {
    console.error(err);
    setStatus("error", `Something went wrong: ${err.message}`);
    castBtn.disabled = false;
  }
});
