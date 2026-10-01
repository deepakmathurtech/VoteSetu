const fetchBtn = document.getElementById("fetch-btn");
const statusBox = document.getElementById("status");
const receiptCard = document.getElementById("receipt-card");
const verifySeal = document.getElementById("verify-seal");

function setStatus(kind, message) {
  statusBox.className = `status-box show ${kind}`;
  statusBox.innerHTML = message;
}

fetchBtn.addEventListener("click", async () => {
  const voterId = document.getElementById("voter-id-input").value.trim();
  if (!voterId) return setStatus("error", "Enter your Voter ID.");

  fetchBtn.disabled = true;
  receiptCard.style.display = "none";
  verifySeal.style.display = "none";

  try {
    setStatus("info", '<span class="loader"></span> Fetching your receipt...');
    const resp = await fetch(`/votes/receipt/${encodeURIComponent(voterId)}`);
    const receipt = await resp.json();

    if (!resp.ok) {
      setStatus("error", receipt.error || "No receipt found. Has your vote been mined into a block yet?");
      return;
    }

    document.getElementById("r-block-index").textContent = receipt.block_index;
    document.getElementById("r-candidate").textContent = "Hidden in privacy receipt";
    document.getElementById("r-block-hash").textContent = receipt.block_hash;
    document.getElementById("r-merkle-root").textContent = receipt.merkle_root;
    document.getElementById("r-proof-length").textContent = `${receipt.merkle_proof.length} hash(es)`;
    receiptCard.style.display = "block";

    setStatus("info", '<span class="loader"></span> Verifying Merkle proof locally in your browser...');
    const valid = await VoteSetuCrypto.verifyMerkleProof(receipt.vote, receipt.merkle_proof, receipt.merkle_root);

    if (valid) {
      verifySeal.className = "seal";
      verifySeal.style.display = "inline-flex";
      setStatus("ok", "Verified: your vote is mathematically confirmed to be included in this block, computed entirely on your device.");
    } else {
      verifySeal.className = "seal bad";
      verifySeal.style.display = "inline-flex";
      setStatus("error", "Proof did NOT verify. This would indicate tampering — please report this immediately.");
    }
  } catch (err) {
    console.error(err);
    setStatus("error", `Something went wrong: ${err.message}`);
  } finally {
    fetchBtn.disabled = false;
  }
});
