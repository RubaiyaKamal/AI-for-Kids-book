import sys
import os

# Add the current directory to path
sys.path.append(os.getcwd())

import auth_utils
from jose import jwt, JWTError
from datetime import timedelta

print("Testing JWT implementation...")

try:
    # Test Token Creation
    data = {"sub": "test@example.com"}
    expires = timedelta(minutes=30)
    token = auth_utils.create_access_token(data, expires)
    print(f"Token created successfully: {token[:20]}...")

    # Test Token Validation
    payload = jwt.decode(token, auth_utils.SECRET_KEY, algorithms=[auth_utils.ALGORITHM])
    print(f"Token decoded successfully. Email: {payload.get('sub')}")

    if payload.get("sub") == "test@example.com":
        print("✅ JWT Implementation is working correctly")
    else:
        print("❌ Email mismatch")

except Exception as e:
    print(f"❌ JWT Error: {str(e)}")
    import traceback
    traceback.print_exc()
