"""
crypto_utils.py
----------------
Handles all public-key cryptography for VoteSetu:
  * RSA keypair generation for each voter
  * Signing of ballots with the voter's private key
  * Signature verification with the voter's public key
  * PEM (de)serialization helpers so keys/signatures can be stored
    as plain text (SQLite / JSON / API payloads).

Every vote in VoteSetu is a digitally signed message. This guarantees:
  1. Authenticity  -> only the real key holder could have cast the vote
  2. Integrity     -> any change to the vote invalidates the signature
  3. Non-repudiation -> the voter cannot credibly deny casting it
"""

from __future__ import annotations

import base64
import hashlib

from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.exceptions import InvalidSignature

RSA_KEY_SIZE = 2048
PUBLIC_EXPONENT = 65537
PSS_SALT_LENGTH = 32  # bytes; must match the browser-side Web Crypto signer
MIN_RSA_KEY_SIZE = 2048  # reject any client-supplied public key weaker than this


def generate_keypair():
    """Generate a new RSA private/public keypair for a voter.

    Returns:
        (private_pem: str, public_pem: str)
    """
    private_key = rsa.generate_private_key(
        public_exponent=PUBLIC_EXPONENT, key_size=RSA_KEY_SIZE
    )
    public_key = private_key.public_key()

    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode("utf-8")

    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode("utf-8")

    return private_pem, public_pem


def load_private_key(private_pem: str):
    return serialization.load_pem_private_key(private_pem.encode("utf-8"), password=None)


def load_public_key(public_pem: str):
    return serialization.load_pem_public_key(public_pem.encode("utf-8"))


def sign_message(private_pem: str, message: str) -> str:
    """Sign `message` with the voter's private key. Returns base64 signature.

    Uses an EXPLICIT salt length (32 bytes, matching SHA-256's digest size)
    rather than PSS.MAX_LENGTH. This is deliberate: browsers' Web Crypto
    SubtleCrypto API requires the caller to specify a concrete saltLength,
    so VoteSetu's client-side JS signer and this server-side verifier must
    agree on one fixed value to interoperate. 32 bytes (= hash length) is
    the conventional choice used by most cross-platform PSS implementations.
    """
    private_key = load_private_key(private_pem)
    signature = private_key.sign(
        message.encode("utf-8"),
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=PSS_SALT_LENGTH,
        ),
        hashes.SHA256(),
    )
    return base64.b64encode(signature).decode("utf-8")


def verify_signature(public_pem: str, message: str, signature_b64: str) -> bool:
    """Verify a base64 signature against `message` using the voter's public key."""
    try:
        public_key = load_public_key(public_pem)
        signature = base64.b64decode(signature_b64)
        public_key.verify(
            signature,
            message.encode("utf-8"),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=PSS_SALT_LENGTH,
            ),
            hashes.SHA256(),
        )
        return True
    except (InvalidSignature, ValueError, TypeError):
        return False


def sha256_hex(data: str) -> str:
    """Convenience helper: hex-encoded SHA-256 digest of a string."""
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def fingerprint_public_key(public_pem: str) -> str:
    """Short, stable identifier derived from a public key (like a voter ID hash)."""
    return sha256_hex(public_pem)[:16]
