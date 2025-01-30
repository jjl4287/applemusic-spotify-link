from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_convert_invalid_url():
    response = client.post(
        "/convert",
        json={"apple_music_url": "https://invalid-url.com"}
    )
    assert response.status_code == 400
    assert "Invalid Apple Music URL" in response.json()["detail"]

def test_convert_valid_url():
    # This is a mock test - in real testing, you'd want to mock the external API calls
    response = client.post(
        "/convert",
        json={"apple_music_url": "https://music.apple.com/us/album/test"}
    )
    assert response.status_code in [200, 404]  # Either success or not found is acceptable for this test