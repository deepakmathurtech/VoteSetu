/*
 * crypto-helpers.js
 * -----------------
 * Browser-side cryptography for VoteSetu, using the native Web Crypto
 * (SubtleCrypto) API. This is the client-side mirror of
 * votesetu_core/crypto_utils.py -- same algorithm (RSA-PSS, SHA-256),
 * same explicit salt length (32 bytes), so signatures created here
 * verify correctly on the server, and vice versa.
 *
 * IMPORTANT: private keys generated here never leave the browser. The
 * non-extractable private CryptoKey is stored in IndexedDB; only the public
 * key and ballot signatures are sent over the network.
 */

const VoteSetuCrypto = (() => {
  const RSA_PSS_PARAMS = { name: "RSA-PSS", hash: "SHA-256" };
  const SALT_LENGTH = 32; // must match crypto_utils.PSS_SALT_LENGTH

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  function arrayBufferToPem(buffer, label) {
    const b64 = arrayBufferToBase64(buffer);
    const lines = b64.match(/.{1,64}/g).join("\n");
    return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----\n`;
  }

  function pemToArrayBuffer(pem) {
    const b64 = pem
      .replace(/-----BEGIN [^-]+-----/, "")
      .replace(/-----END [^-]+-----/, "")
      .replace(/\s+/g, "");
    return base64ToArrayBuffer(b64);
  }

  async function generateKeyPair() {
    const keyPair = await crypto.subtle.generateKey(
      { ...RSA_PSS_PARAMS, name: "RSA-PSS", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) },
      false,
      ["sign", "verify"]
    );
    return keyPair; // { publicKey, privateKey } as CryptoKey objects
  }

  async function exportPublicKeyPem(publicKey) {
    const spki = await crypto.subtle.exportKey("spki", publicKey);
    return arrayBufferToPem(spki, "PUBLIC KEY");
  }

  async function importPublicKeyFromPem(pem) {
    const der = pemToArrayBuffer(pem);
    return crypto.subtle.importKey("spki", der, RSA_PSS_PARAMS, false, ["verify"]);
  }

  /**
   * Canonical ballot message -- MUST exactly match
   * Election.build_ballot_message() in election.py:
   *   f"{voter_id}|{candidate}|{int(timestamp_ms)}"
   */
  function buildBallotMessage(voterId, candidate, timestampMs) {
    return `${voterId}|${candidate}|${Math.trunc(timestampMs)}`;
  }

  async function signMessage(privateKey, message) {
    const encoded = new TextEncoder().encode(message);
    const signature = await crypto.subtle.sign(
      { name: "RSA-PSS", saltLength: SALT_LENGTH },
      privateKey,
      encoded
    );
    return arrayBufferToBase64(signature);
  }

  async function fingerprintPublicKeyPem(publicKeyPem) {
    // Matches crypto_utils.fingerprint_public_key: first 16 hex chars of
    // SHA-256 over the exact PEM string.
    const encoded = new TextEncoder().encode(publicKeyPem);
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
    return hex.slice(0, 16);
  }

  function openCredentialDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("votesetu_credentials", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("private_keys");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error("Browser credential storage is unavailable."));
    });
  }

  async function storePrivateKey(credentialId, privateKey) {
    const db = await openCredentialDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("private_keys", "readwrite");
      transaction.objectStore("private_keys").put(privateKey, credentialId);
      transaction.oncomplete = () => { db.close(); resolve(); };
      transaction.onerror = () => { db.close(); reject(new Error("Could not store the private key in this browser.")); };
    });
  }

  async function loadPrivateKey(credentialId) {
    const db = await openCredentialDb();
    return new Promise((resolve, reject) => {
      const request = db.transaction("private_keys", "readonly").objectStore("private_keys").get(credentialId);
      request.onsuccess = () => { db.close(); resolve(request.result || null); };
      request.onerror = () => { db.close(); reject(new Error("Could not read the browser credential.")); };
    });
  }

  /**
   * Mirrors Python's json.dumps(obj, sort_keys=True) default formatting
   * (", " / ": " separators) for the simple {string: string|number} vote
   * shape used throughout VoteSetu. Needed so leaf hashes computed here
   * match votesetu_core/merkle.py::leaf_hash exactly.
   */
  function canonicalJsonStringify(obj) {
    const keys = Object.keys(obj).sort();
    const parts = keys.map(k => `${JSON.stringify(k)}: ${JSON.stringify(obj[k])}`);
    return `{${parts.join(", ")}}`;
  }

  async function sha256Hex(text) {
    const encoded = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  async function leafHash(vote) {
    return sha256Hex(canonicalJsonStringify(vote));
  }

  async function hashPair(left, right) {
    return sha256Hex(left + right);
  }

  /**
   * Client-side Merkle proof verification -- the browser-native mirror
   * of votesetu_core/merkle.py::verify_proof. Runs entirely locally;
   * the server is not trusted, only mathematically checked.
   */
  async function verifyMerkleProof(vote, proof, expectedRoot) {
    let current = await leafHash(vote);
    for (const step of proof) {
      current = step.position === "left"
        ? await hashPair(step.hash, current)
        : await hashPair(current, step.hash);
    }
    return current === expectedRoot;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }

  return {
    generateKeyPair,
    exportPublicKeyPem,
    importPublicKeyFromPem,
    buildBallotMessage,
    signMessage,
    fingerprintPublicKeyPem,
    storePrivateKey,
    loadPrivateKey,
    canonicalJsonStringify,
    sha256Hex,
    leafHash,
    verifyMerkleProof,
    escapeHtml,
  };
})();
