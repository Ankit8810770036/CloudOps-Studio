import io
import zipfile
import pytest
from state import state

def test_upload_valid_zip_package(client):
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w") as z:
        z.writestr("test_page.html", "<h1>Custom Unit Test App</h1>")
    zip_buffer.seek(0)

    res = client.post(
        "/api/upload/code",
        data={"target_tier": "frontend", "framework": "html"},
        files={"files": ("app.zip", zip_buffer, "application/zip")}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["target_tier"] == "frontend"
    assert "test_page.html" in data["files"]

    # Clean up test file
    client.delete("/api/upload/code/frontend")

def test_upload_path_traversal_protection(client):
    # Craft a zip with malicious directory traversal paths
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w") as z:
        z.writestr("../../malicious.txt", "attack content")
    zip_buffer.seek(0)

    res = client.post(
        "/api/upload/code",
        data={"target_tier": "frontend", "framework": "html"},
        files={"files": ("attack.zip", zip_buffer, "application/zip")}
    )
    assert res.status_code == 200
    data = res.json()
    # Malicious traversal file was skipped
    assert "../../malicious.txt" not in data["files"]
    assert "malicious.txt" not in data["files"]

def test_clear_uploaded_code(client):
    res = client.delete("/api/upload/code/frontend")
    assert res.status_code == 200
    assert state.custom_code["frontend"] is None

def test_auto_route_react_spa_from_backend_tier(client):
    from pathlib import Path
    webapp_dir = Path("ansible/roles/webapp/files/app")
    orig_index = (webapp_dir / "index.html").read_text(encoding="utf-8") if (webapp_dir / "index.html").exists() else None
    try:
        # If user uploads React SPA build (index.html + assets) with target_tier=backend
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w") as z:
            z.writestr("index.html", "<div id='root'></div><script src='/assets/bundle.js'></script>")
            z.writestr("assets/bundle.js", "console.log('React Portfolio');")
        zip_buffer.seek(0)

        res = client.post(
            "/api/upload/code",
            data={"target_tier": "backend", "framework": "python"},
            files={"files": ("dist.zip", zip_buffer, "application/zip")}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert data["target_tier"] == "frontend"
        assert data["framework"] == "react"
        assert state.custom_code["frontend"] is not None
    finally:
        if orig_index is not None:
            (webapp_dir / "index.html").write_text(orig_index, encoding="utf-8")
        if (webapp_dir / "bundle.js").exists():
            (webapp_dir / "bundle.js").unlink(missing_ok=True)
