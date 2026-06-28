#!/usr/bin/env python3
"""
Run once to generate VAPID keys for Web Push.
Output the two lines into your .env file.

Usage:
    python generate_vapid.py
"""
import base64
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend

private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
public_key  = private_key.public_key()

# Private key: raw 32-byte big-endian integer, base64url-encoded (no padding)
priv_int = private_key.private_numbers().private_value
private_b64 = base64.urlsafe_b64encode(priv_int.to_bytes(32, "big")).decode().rstrip("=")

# Public key: uncompressed EC point (0x04 || x || y), base64url-encoded (no padding)
pub = public_key.public_numbers()
raw_pub = b"\x04" + pub.x.to_bytes(32, "big") + pub.y.to_bytes(32, "big")
public_b64 = base64.urlsafe_b64encode(raw_pub).decode().rstrip("=")

print("Add these lines to your .env file:")
print()
print(f"VAPID_PRIVATE_KEY={private_b64}")
print(f"VAPID_PUBLIC_KEY={public_b64}")
print(f"VAPID_EMAIL=pawzopetcare@gmail.com")
