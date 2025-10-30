import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_user_login_valid_credentials():
    login_url = f"{BASE_URL}/api/auth/login"
    payload = {
        "email": "validuser@example.com",
        "password": "validpassword123"
    }
    headers = {
        "Content-Type": "application/json"
    }

    # Perform login
    response = requests.post(login_url, json=payload, headers=headers, timeout=TIMEOUT)
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    data = response.json()
    assert "token" in data, "JWT token not found in response"
    token = data["token"]
    assert isinstance(token, str) and len(token) > 0, "Invalid JWT token"

    # Check banner existence and route properly configured by attempting to delete specified banner ID
    banner_id = "cmhccsa030004hs6klsn4vtqv"
    delete_banner_url = f"{BASE_URL}/api/settings/banners/{banner_id}"
    # Use Authorization header if token is a Bearer token
    auth_headers = {
        "Authorization": f"Bearer {token}"
    }

    delete_response = requests.delete(delete_banner_url, headers=auth_headers, timeout=TIMEOUT)

    # Check if banner exists by fetching the banners
    get_banners_url = f"{BASE_URL}/api/settings/get-banners"
    get_banners_response = requests.get(get_banners_url, headers=auth_headers, timeout=TIMEOUT)

    assert get_banners_response.status_code == 200, f"Fetching banners failed with status {get_banners_response.status_code}"
    banners = get_banners_response.json()
    # Check if banner ID exists in the fetched list (assuming list of dicts with 'id' field)
    banner_exists = any(banner.get("id") == banner_id for banner in banners)

    if banner_exists:
        # Since banner exists but delete returns 404, assert fail for route or implementation issue
        assert delete_response.status_code != 404, (
            f"Delete endpoint returned 404 but banner with ID {banner_id} exists, route may not be properly configured"
        )
        # If not 404, ensure deletion is successful or handled
        assert delete_response.status_code in (200,204), (
            f"Unexpected delete status code {delete_response.status_code} for existing banner"
        )
    else:
        # Banner does not exist, so 404 on delete is expected
        assert delete_response.status_code == 404, (
            f"Delete returned {delete_response.status_code} but banner does not exist as expected 404"
        )

test_user_login_valid_credentials()