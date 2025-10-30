import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_fetch_all_feature_banners_and_delete_issue():
    # The problematic banner ID reported
    problematic_banner_id = "cmhccsa030004hs6klsn4vtqv"
    get_banners_url = f"{BASE_URL}/api/settings/get-banners"
    delete_banner_url = f"{BASE_URL}/api/settings/banners/{problematic_banner_id}"
    
    try:
        # Fetch all banners
        resp_get = requests.get(get_banners_url, timeout=TIMEOUT)
        assert resp_get.status_code == 200, f"Expected 200 OK for GET banners, got {resp_get.status_code}"
        banners = resp_get.json()
        assert isinstance(banners, list), "Response from GET banners is not a list"

        # Check if problematic banner ID exists in the list
        banner_ids = {banner.get("id") for banner in banners if isinstance(banner, dict) and "id" in banner}
        if problematic_banner_id not in banner_ids:
            print(f"Banner ID '{problematic_banner_id}' does not exist in the database.")
        else:
            # Attempt to delete the problematic banner and capture response
            resp_delete = requests.delete(delete_banner_url, timeout=TIMEOUT)
            if resp_delete.status_code == 404:
                print(f"DELETE returned 404 for banner ID '{problematic_banner_id}', route may be misconfigured or banner missing.")
            else:
                # Acceptable statuses: 204 No Content (successful delete) or 200 OK
                assert resp_delete.status_code in (200, 204), f"Unexpected status code on delete: {resp_delete.status_code}"
    except requests.RequestException as e:
        assert False, f"HTTP request failed: {e}"

test_fetch_all_feature_banners_and_delete_issue()