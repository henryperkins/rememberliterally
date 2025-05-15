import os
from app import app  # noqa: F401

if __name__ == "__main__":
    # Use environment variable for port if available, otherwise try port 8080
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=True)
