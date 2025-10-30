import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

# Helper function to authenticate and get token

def get_auth_token(email, password):
    login_payload = {
        "email": email,
        "password": password
    }
    resp = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Login failed with status {resp.status_code} and message {resp.text}"
    data = resp.json()
    token = data.get('token') or data.get('accessToken') or data.get('access_token')
    assert token, "Login response does not contain token"
    return token


def test_delete_feature_banner_by_id():
    # Authenticate first
    # Use valid test credentials; change accordingly if needed
    email = "testuser@example.com"
    password = "TestPassword123"
    token = get_auth_token(email, password)
    headers = {"Authorization": f"Bearer {token}"}

    try:
        get_resp = requests.get(f"{BASE_URL}/api/settings/get-banners", headers=headers, timeout=TIMEOUT)
        assert get_resp.status_code == 200, f"Expected 200 OK from get-banners, got {get_resp.status_code}"
        banners = get_resp.json()
        assert isinstance(banners, list), "Expected list of banners"

        target_id = "cmhccsa030004hs6klsn4vtqv"
        banner_ids = [banner.get('id') for banner in banners if banner.get('id')]
        banner_exists = target_id in banner_ids

        if not banner_exists:
            files = {
                'images': ('test_image.jpg', b'\xff\xd8\xff\xe0' + b'0' * 1024, 'image/jpeg')
            }
            post_resp = requests.post(f"{BASE_URL}/api/settings/banners", files=files, headers=headers, timeout=TIMEOUT)
            assert post_resp.status_code in (200, 201), f"Failed to create banner, status {post_resp.status_code}"
            created_banners = post_resp.json()
            assert isinstance(created_banners, list), "Expected list response on banner creation"
            assert len(created_banners) > 0, "No banners created"
            target_id = created_banners[0].get('id')
            assert target_id, "Created banner has no id"

            try:
                del_resp = requests.delete(f"{BASE_URL}/api/settings/banners/{target_id}", headers=headers, timeout=TIMEOUT)
                assert del_resp.status_code in (200, 204), f"Expected successful deletion status for banner id {target_id}, got {del_resp.status_code}"
            finally:
                requests.delete(f"{BASE_URL}/api/settings/banners/{target_id}", headers=headers, timeout=TIMEOUT)
        else:
            del_resp = requests.delete(f"{BASE_URL}/api/settings/banners/{target_id}", headers=headers, timeout=TIMEOUT)
            assert del_resp.status_code in (200, 204), f"Expected successful deletion status for banner id {target_id}, got {del_resp.status_code}"

            get_after_del = requests.get(f"{BASE_URL}/api/settings/get-banners", headers=headers, timeout=TIMEOUT)
            assert get_after_del.status_code == 200, f"Expected 200 OK from get-banners after delete, got {get_after_del.status_code}"
            banners_after = get_after_del.json()
            assert target_id not in [b.get('id') for b in banners_after], "Banner ID still present after deletion"

    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"


test_delete_feature_banner_by_id()
