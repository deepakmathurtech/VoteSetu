const generateBtn = document.getElementById("generate-btn");
const statusBox = document.getElementById("status");
const credentialPanel = document.getElementById("credential-panel");
const voterIdBox = document.getElementById("voter-id-box");
const registeredSeal = document.getElementById("registered-seal");
const loginBtn = document.getElementById("login-btn");
const loginStatus = document.getElementById("login-status");
const loginForm = document.getElementById("login-form");
const authBadge = document.getElementById("auth-badge");
const fullNameInput = document.getElementById("full-name");
const credentialLocked = document.getElementById("credential-locked");

let authenticatedProfile = null;

function newCredentialSession() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const sessionId = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
  sessionStorage.setItem("votesetu_credential_session", sessionId);
  return sessionId;
}

function credentialStorageId(voterId) {
  const sessionId = sessionStorage.getItem("votesetu_credential_session");
  return sessionId ? `${voterId}:${sessionId}` : null;
}

function setStatus(kind, message) {
  statusBox.className = `status-box show ${kind}`;
  statusBox.innerHTML = message;
}

function setLoginStatus(kind, message) {
  loginStatus.className = `status-box show ${kind}`;
  loginStatus.textContent = message;
}

function translatedStatus(english, hindi) {
  return document.documentElement.lang === "hi" ? hindi : english;
}

const verifiedLabels = {
  as: "সত্যাপিত", bn: "যাচাই করা হয়েছে", brx: "सुद्रायगोनां", doi: "सत्यापित",
  gu: "ચકાસાયેલ", hi: "सत्यापित", kn: "ಪರಿಶೀಲಿಸಲಾಗಿದೆ", ks: "تصدیق شدہ",
  kok: "तपासलें", mai: "सत्यापित", ml: "പരിശോധിച്ചു", mni: "শেমদোকপা",
  mr: "सत्यापित", ne: "प्रमाणित", or: "ଯାଞ୍ଚ ହୋଇଛି", pa: "ਪੜਤਾਲ ਕੀਤੀ",
  sa: "प्रमाणितम्", sat: "ᱧᱮᱞ ᱪᱟᱵᱟᱣᱟ", sd: "تصديق ٿيل", ta: "சரிபார்க்கப்பட்டது",
  te: "ధృవీకరించబడింది", ur: "تصدیق شدہ",
};

function unlockRegistration(profile) {
  authenticatedProfile = profile;
  if (!sessionStorage.getItem("votesetu_credential_session")) newCredentialSession();
  const displayName = profile.displayName || profile.name || profile.username || "verified identity";
  authBadge.dataset.displayName = displayName;
  const verifiedLabel = verifiedLabels[document.documentElement.lang] || "Verified";
  authBadge.textContent = `${verifiedLabel}: ${displayName}`;
  authBadge.classList.add("verified-badge");
  loginForm.style.display = "none";
  fullNameInput.disabled = false;
  fullNameInput.value = displayName;
  fullNameInput.readOnly = true;
  generateBtn.disabled = false;
  credentialLocked.style.display = "none";
  setLoginStatus("ok", translatedStatus(
    "RIDTP identity verified. You can now generate your VoteSetu key.",
    "RIDTP पहचान सत्यापित है। अब आप अपनी VoteSetu कुंजी बना सकते हैं।"
  ));
}

async function restoreLogin() {
  const response = await fetch("/auth/me");
  if (!response.ok) return;
  const data = await response.json();
  if (data.authenticated) unlockRegistration(data.profile);
}

loginBtn.addEventListener("click", async () => {
  const identifier = document.getElementById("login-identifier").value.trim();
  const password = document.getElementById("login-password").value;
  if (!identifier || !password) return setLoginStatus("error", "Enter your RIDTP identifier and password.");

  loginBtn.disabled = true;
  setLoginStatus("info", "Checking your identity with RIDTP...");
  try {
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      setLoginStatus("error", data.error || "RIDTP authentication failed.");
      return;
    }
    newCredentialSession();
    unlockRegistration(data.profile);
  } catch (error) {
    setLoginStatus("error", `RIDTP Auth is unavailable: ${error.message}`);
  } finally {
    loginBtn.disabled = false;
  }
});

restoreLogin().catch(() => {});

generateBtn.addEventListener("click", async () => {
  if (!authenticatedProfile) return setStatus("error", "Sign in with RIDTP before generating a key.");
  const fullName = document.getElementById("full-name").value.trim();
  if (!fullName) {
    setStatus("error", "Please enter your full name.");
    return;
  }

  generateBtn.disabled = true;
  setStatus("info", '<span class="loader"></span> Generating a 2048-bit RSA-PSS keypair in your browser...');

  try {
    const { publicKey, privateKey } = await VoteSetuCrypto.generateKeyPair();
    const publicPem = await VoteSetuCrypto.exportPublicKeyPem(publicKey);
    const voterId = await VoteSetuCrypto.fingerprintPublicKeyPem(publicPem);

    setStatus("info", '<span class="loader"></span> Sending your public key to VoteSetu for registration...');

    const resp = await fetch("/voters/credential", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_key_pem: publicPem }),
    });
    const data = await resp.json();

    if (!resp.ok) {
      setStatus("error", `Registration failed: ${data.error || "unknown error"}`);
      generateBtn.disabled = false;
      return;
    }

    await VoteSetuCrypto.storePrivateKey(credentialStorageId(data.voter_id), privateKey);
    localStorage.setItem("votesetu_voter_id", data.voter_id);
    voterIdBox.textContent = data.voter_id;
    credentialPanel.style.display = "block";
    registeredSeal.style.display = "inline-flex";
    setStatus("ok", "Public key registered. Your private key is sealed in this browser and was never transmitted.");
  } catch (err) {
    console.error(err);
    setStatus("error", `Something went wrong: ${err.message}`);
  } finally {
    generateBtn.disabled = false;
  }
});
