async function loadDashboard() {
  try {
    const [statsResp, resultsResp, validateResp] = await Promise.all([
      fetch("/stats"),
      fetch("/results"),
      fetch("/chain/validate"),
    ]);
    const stats = await statsResp.json();
    const results = await resultsResp.json();
    const validity = await validateResp.json();

    const statEls = [
      document.getElementById("stat-registered"),
      document.getElementById("stat-cast"),
      document.getElementById("stat-blocks"),
      document.getElementById("stat-integrity"),
    ];
    statEls.forEach(el => VoteSetuAnim.hideSkeleton(el, "skeleton-stat"));

    VoteSetuAnim.animateCount(document.getElementById("stat-registered"), stats.registered_voters);
    VoteSetuAnim.animateCount(document.getElementById("stat-cast"), stats.votes_cast);
    VoteSetuAnim.animateCount(document.getElementById("stat-blocks"), stats.blocks_mined);

    const integrityEl = document.getElementById("stat-integrity");
    integrityEl.textContent = validity.valid ? "Valid" : "Compromised";
    integrityEl.style.color = validity.valid ? "var(--seal-green)" : "var(--seal-red)";

    const entries = Object.entries(results.results).sort((a, b) => b[1] - a[1]);
    const totalVotes = entries.reduce((sum, [, count]) => sum + count, 0) || 1;

    const rows = entries.map(([candidate, count]) => {
      const pct = Math.round((count / totalVotes) * 100);
      const safeCandidate = VoteSetuCrypto.escapeHtml(candidate);
      return `
        <div style="margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:4px;">
            <span>${safeCandidate}</span>
            <span class="mono">${count} vote(s)</span>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:0%;" data-target-pct="${pct}"></div></div>
        </div>
      `;
    }).join("");

    document.getElementById("results-table").innerHTML = rows || '<p class="subtle">No votes cast yet.</p>';

    // CSS transitions only fire on a style change AFTER initial layout, so
    // the bars are inserted at 0% above and grown to their real width here,
    // on the next frame -- that's what makes them animate in.
    requestAnimationFrame(() => {
      document.querySelectorAll(".bar-fill").forEach(el => {
        el.style.width = `${el.dataset.targetPct}%`;
      });
    });
  } catch (err) {
    console.error(err);
    document.getElementById("results-table").innerHTML = '<p class="subtle">Could not load results.</p>';
  }
}

loadDashboard();
setInterval(loadDashboard, 15000);
