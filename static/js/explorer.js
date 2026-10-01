const blockChainEl = document.getElementById("block-chain");
const chainStatusEl = document.getElementById("chain-status");
const refreshBtn = document.getElementById("refresh-btn");

function escapeHtml(str) {
  return VoteSetuCrypto.escapeHtml(str);
}

async function computeBlockHash(block) {
  // Mirrors Block.compute_hash() in blockchain.py: sha256 over the
  // sorted-key JSON body {index, timestamp, votes, previous_hash,
  // merkle_root, nonce}.
  const body = {
    index: block.index,
    timestamp: block.timestamp,
    votes: block.votes,
    previous_hash: block.previous_hash,
    merkle_root: block.merkle_root,
    nonce: block.nonce,
  };
  const json = canonicalJsonStringifyDeep(body);
  return VoteSetuCrypto.sha256Hex(json);
}

// Deep version of canonical json stringify (handles the nested votes array).
function canonicalJsonStringifyDeep(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJsonStringifyDeep).join(", ")}]`;
  }
  if (value !== null && typeof value === "object") {
    const keys = Object.keys(value).sort();
    const parts = keys.map(k => `${JSON.stringify(k)}: ${canonicalJsonStringifyDeep(value[k])}`);
    return `{${parts.join(", ")}}`;
  }
  return JSON.stringify(value);
}

async function computeMerkleRoot(votes) {
  if (votes.length === 0) {
    return VoteSetuCrypto.sha256Hex("");
  }
  let level = await Promise.all(votes.map(v => VoteSetuCrypto.leafHash(v)));
  while (level.length > 1) {
    if (level.length % 2 === 1) level.push(level[level.length - 1]);
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(await VoteSetuCrypto.sha256Hex(level[i] + level[i + 1]));
    }
    level = next;
  }
  return level[0];
}

function renderBlock(block, verified, index) {
  const seal = verified
    ? `<span class="seal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>Verified</span>`
    : `<span class="seal bad">Hash mismatch</span>`;

  const voteRows = block.votes.length
    ? block.votes.map(v => `<div class="vote-row"><span>Encrypted ballot</span><span class="mono">${escapeHtml(v.ballot_id || "anonymous")}</span></div>`).join("")
    : `<div class="subtle" style="padding:6px 0;">No votes in this block.</div>`;

  return `
    <div class="block-card" style="--reveal-index:${index};">
      <div class="block-header">
        <span class="block-index">Block #${block.index}</span>
        ${seal}
      </div>
      <div class="block-meta">${new Date(block.timestamp * 1000).toLocaleString()} &middot; ${block.votes.length} vote(s) &middot; nonce ${block.nonce}</div>
      <div class="divider"></div>
      <div class="copy-row">
        <div class="block-hash-row" style="margin:0;"><span class="label">hash</span>${block.hash}</div>
        <button class="copy-btn" type="button" data-copy-value="${block.hash}">Copy</button>
      </div>
      <div class="block-hash-row"><span class="label">prev</span>${block.previous_hash}</div>
      <div class="copy-row">
        <div class="block-hash-row" style="margin:0;"><span class="label">merkle root</span>${block.merkle_root}</div>
        <button class="copy-btn" type="button" data-copy-value="${block.merkle_root}">Copy</button>
      </div>
      <div class="vote-list">${voteRows}</div>
    </div>
  `;
}

async function loadChain() {
  chainStatusEl.textContent = "checking integrity…";
  blockChainEl.innerHTML = '<p class="subtle"><span class="loader"></span> Loading ledger...</p>';

  const resp = await fetch("/chain");
  const blocks = await resp.json();

  let allValid = true;
  const parts = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const recomputedHash = await computeBlockHash(block);
    const recomputedRoot = await computeMerkleRoot(block.votes);
    const linkOk = i === 0 || block.previous_hash === blocks[i - 1].hash;
    const verified = recomputedHash === block.hash && recomputedRoot === block.merkle_root && linkOk;
    if (!verified) allValid = false;

    parts.push(renderBlock(block, verified, i));
    if (i < blocks.length - 1) parts.push('<div class="block-link"></div>');
  }

  blockChainEl.innerHTML = parts.join("");
  chainStatusEl.textContent = allValid
    ? `Chain re-verified locally — ${blocks.length} block(s), all links + hashes + Merkle roots check out.`
    : `Integrity check FAILED — tampering detected in the ledger.`;
  chainStatusEl.style.borderColor = allValid ? "var(--seal-green)" : "var(--seal-red)";
  chainStatusEl.style.color = allValid ? "#1f4a37" : "#6e2626";
}

refreshBtn.addEventListener("click", loadChain);
loadChain();
