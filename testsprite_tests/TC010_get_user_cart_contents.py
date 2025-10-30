import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30
BANNER_ID = "cmhccsa030004hs6klsn4vtqv"

# Add your valid JWT token here
JWT_TOKEN = "YOUR_JWT_TOKEN"

HEADERS = {
    "Authorization": f"Bearer {JWT_TOKEN}"
}

def test_delete_banner_exists_and_route():
    try:
        # Check if banner exists by fetching all banners
        resp_get = requests.get(f"{BASE_URL}/api/settings/get-banners", timeout=TIMEOUT, headers=HEADERS)
        assert resp_get.status_code == 200, f"Failed to fetch banners, status: {resp_get.status_code}"
        banners = resp_get.json()
        banner_ids = [banner.get("id") for banner in banners if banner]
        banner_found = BANNER_ID in banner_ids

        assert banner_found, f"Banner with ID {BANNER_ID} does not exist in banners list."

        # Try to delete the banner
        resp_delete = requests.delete(f"{BASE_URL}/api/settings/banners/{BANNER_ID}", timeout=TIMEOUT, headers=HEADERS)

        # If banner exists, deletion should not return 404
        assert resp_delete.status_code != 404, (
            f"DELETE /api/settings/banners/{BANNER_ID} returned 404, route might be misconfigured or banner not found."
        )
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"


test_delete_banner_exists_and_route()
