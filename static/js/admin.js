const KEY_STORAGE = "votesetu_admin_key";

const gateStatus = document.getElementById("gate-status");
const adminPanels = document.getElementById("admin-panels");
const keyInput = document.getElementById("admin-key-input");

function setBox(el, kind, message) {
  el.className = `status-box show ${kind}`;
  el.innerHTML = message;
}

function getKey() {
  return localStorage.getItem(KEY_STORAGE) || "";
}

async function authedFetch(url, options = {}) {
  const headers = { ...(options.headers || {}), "X-Admin-Key": getKey() };
  return fetch(url, { ...options, headers });
}

async function tryUnlock() {
  const key = getKey();
  if (!key) return;
  keyInput.value = key;

  // Verify the key works with a harmless call (results doesn't need auth,
  // so we probe via close-round's auth path by attempting a lightweight
  // admin-only GET-equivalent: reuse stats endpoint success + a dry
  // check isn't directly available, so we just reveal the panel and let
  // the first real admin action confirm/deny the key).
  adminPanels.style.display = "block";
  setBox(gateStatus, "ok", "Admin key loaded from this device.");
  loadStats();
}

document.getElementById("save-key-btn").addEventListener("click", () => {
  const key = keyInput.value.trim();
  if (!key) {
    setBox(gateStatus, "error", "Enter the admin key printed in the server console.");
    return;
  }
  localStorage.setItem(KEY_STORAGE, key);
  adminPanels.style.display = "block";
  setBox(gateStatus, "ok", "Key saved on this device.");
  loadStats();
});

async function loadStats() {
  try {
    const [statsResp, validateResp] = await Promise.all([fetch("/stats"), fetch("/chain/validate")]);
    const stats = await statsResp.json();
    const validity = await validateResp.json();

    const els = {
      registered: document.getElementById("s-registered"),
      cast: document.getElementById("s-cast"),
      blocks: document.getElementById("s-blocks"),
      pending: document.getElementById("s-pending"),
    };
    Object.values(els).forEach(el => VoteSetuAnim.hideSkeleton(el, "skeleton-line"));

    VoteSetuAnim.animateCount(els.registered, stats.registered_voters);
    VoteSetuAnim.animateCount(els.cast, stats.votes_cast);
    VoteSetuAnim.animateCount(els.blocks, stats.blocks_mined);
    VoteSetuAnim.animateCount(els.pending, stats.pending_votes);

    const integrityEl = document.getElementById("s-integrity");
    integrityEl.textContent = validity.valid ? "Valid" : "Compromised";
    integrityEl.style.color = validity.valid ? "var(--seal-green)" : "var(--seal-red)";
  } catch (err) {
    console.error(err);
  }
}

document.getElementById("close-round-btn").addEventListener("click", async () => {
  const btn = document.getElementById("close-round-btn");
  const status = document.getElementById("close-status");
  btn.disabled = true;
  setBox(status, "info", '<span class="loader"></span> Mining pending votes into a new block...');

  try {
    const resp = await authedFetch("/admin/close-round", { method: "POST" });
    const data = await resp.json();

    if (resp.status === 401) {
      setBox(status, "error", "Admin key rejected. Double-check the key from the server console.");
    } else if (!resp.ok) {
      setBox(status, "error", data.error || "Nothing to mine.");
    } else {
      setBox(status, "ok", `Block #${data.block_index} mined with ${data.votes_in_block} vote(s). Hash: <span class="mono">${data.block_hash.slice(0, 24)}…</span>`);
      showToast("Block mined", "ok");
      loadStats();
    }
  } catch (err) {
    setBox(status, "error", `Error: ${err.message}`);
  } finally {
    btn.disabled = false;
  }
});

document.getElementById("reset-election-btn").addEventListener("click", async () => {
  const btn = document.getElementById("reset-election-btn");
  const status = document.getElementById("reset-status");
  const title = document.getElementById("election-title").value.trim();
  const candidates = document.getElementById("election-candidates").value
    .split("\n").map(c => c.trim()).filter(Boolean);
  const difficulty = parseInt(document.getElementById("election-difficulty").value, 10) || 4;

  if (!title || candidates.length < 2) {
    setBox(status, "error", "Provide a title and at least two candidates.");
    return;
  }

  btn.disabled = true;
  setBox(status, "info", '<span class="loader"></span> Creating election...');

  try {
    const resp = await authedFetch("/election", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, candidates, difficulty }),
    });
    const data = await resp.json();

    if (resp.status === 401) {
      setBox(status, "error", "Admin key rejected. Double-check the key from the server console.");
    } else if (!resp.ok) {
      setBox(status, "error", data.error || "Could not create election.");
    } else {
      setBox(status, "ok", `Election "${data.title}" created with ${data.candidates.length} candidates.`);
      showToast("Election reset", "ok");
      loadStats();
    }
  } catch (err) {
    setBox(status, "error", `Error: ${err.message}`);
  } finally {
    btn.disabled = false;
  }
});

tryUnlock();
