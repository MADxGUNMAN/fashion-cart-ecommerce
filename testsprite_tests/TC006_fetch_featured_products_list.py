import requests

BASE_URL = "http://localhost:5000"
BANNER_ID_TO_TEST = "cmhccsa030004hs6klsn4vtqv"
TIMEOUT = 30

# Placeholder token; replace with a valid JWT token for actual tests
AUTH_TOKEN = "your_valid_jwt_token"

HEADERS = {
    "Authorization": f"Bearer {AUTH_TOKEN}"
}

def test_banner_deletion_and_fetch_featured_products():
    try:
        # Step 1: Check if banner with the given ID exists by fetching all banners
        get_banners_resp = requests.get(f"{BASE_URL}/api/settings/get-banners", headers=HEADERS, timeout=TIMEOUT)
        assert get_banners_resp.status_code == 200, f"Failed to fetch banners, status code {get_banners_resp.status_code}"
        banners = get_banners_resp.json()
        assert isinstance(banners, list), "Banners response is not a list"

        banner_ids = [banner.get("id") for banner in banners if "id" in banner]
        banner_exists = BANNER_ID_TO_TEST in banner_ids

        # Step 2: Attempt to delete the banner with the given ID if it exists
        if banner_exists:
            delete_resp = requests.delete(f"{BASE_URL}/api/settings/banners/{BANNER_ID_TO_TEST}", headers=HEADERS, timeout=TIMEOUT)
            # Expecting not 404 if banner exists; it should succeed or fail with relevant code
            assert delete_resp.status_code != 404, (
                f"DELETE returned 404 for existing banner ID {BANNER_ID_TO_TEST}. "
                "Route may not be properly configured."
            )
            # Also check if successful deletion (204 or 200)
            assert delete_resp.status_code in (200, 204), (
                f"Unexpected status code on delete: {delete_resp.status_code}"
            )
        else:
            # If banner does not exist, deletion should return 404
            delete_resp = requests.delete(f"{BASE_URL}/api/settings/banners/{BANNER_ID_TO_TEST}", headers=HEADERS, timeout=TIMEOUT)
            assert delete_resp.status_code == 404, (
                f"DELETE did not return 404 for non-existent banner ID {BANNER_ID_TO_TEST}."
            )

        # Step 3: Test /api/settings/fetch-feature-products GET endpoint
        feature_products_resp = requests.get(f"{BASE_URL}/api/settings/fetch-feature-products", headers=HEADERS, timeout=TIMEOUT)
        assert feature_products_resp.status_code == 200, f"Fetching featured products failed with status {feature_products_resp.status_code}"
        feature_products = feature_products_resp.json()
        # Check that response is a list or dict according to expected schema (no schema detail given, so check general)
        assert isinstance(feature_products, (list, dict)), "Featured products response is not a list or dict"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"


test_banner_deletion_and_fetch_featured_products()