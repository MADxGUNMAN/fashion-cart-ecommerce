import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

# Placeholder for a valid JWT token; replace with an actual token for real testing
JWT_TOKEN = "your_valid_jwt_token_here"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {JWT_TOKEN}"
}

def test_update_featured_products_and_check_banner_deletion_issue():
    banner_id_to_test = "cmhccsa030004hs6klsn4vtqv"

    # Step 1: Check if banner with given ID exists by fetching all banners
    try:
        resp_get_banners = requests.get(f"{BASE_URL}/api/settings/get-banners", headers=headers, timeout=TIMEOUT)
        assert resp_get_banners.status_code == 200, f"Getting banners failed with status {resp_get_banners.status_code}"
        banners = resp_get_banners.json()
        banner_exists = any(banner.get('id') == banner_id_to_test for banner in banners)
    except Exception as e:
        raise AssertionError(f"Failed to fetch banners: {str(e)}")

    # Step 2: Attempt to delete banner with given ID to validate route configuration and existence
    try:
        resp_delete = requests.delete(f"{BASE_URL}/api/settings/banners/{banner_id_to_test}", headers=headers, timeout=TIMEOUT)
        if banner_exists:
            assert resp_delete.status_code != 404, (
                f"Banner with ID {banner_id_to_test} exists but delete returned 404, route may be misconfigured"
            )
        else:
            assert resp_delete.status_code in (404, 400), (
                f"Banner with ID {banner_id_to_test} does not exist but delete returned unexpected status {resp_delete.status_code}"
            )
    except Exception as e:
        raise AssertionError(f"Delete request failed: {str(e)}")

    # Step 3: Test the /api/settings/update-feature-products POST endpoint functionality

    # First get products to update with
    try:
        resp_get_products = requests.get(f"{BASE_URL}/api/products", headers=headers, timeout=TIMEOUT)
        assert resp_get_products.status_code == 200, f"Failed to fetch products, status {resp_get_products.status_code}"
        products = resp_get_products.json()
        if not products:
            raise AssertionError("No products available to update featured products")
        product_ids = [str(product.get('id')) for product in products if product.get('id')]
        if not product_ids:
            raise AssertionError("No valid product IDs found in products list")
    except Exception as e:
        raise AssertionError(f"Failed to fetch products or prepare product IDs: {str(e)}")

    update_payload = {
        "productIds": product_ids[:5]  # Update with first 5 product IDs
    }

    try:
        resp_update = requests.post(
            f"{BASE_URL}/api/settings/update-feature-products",
            json=update_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert resp_update.status_code == 200, f"Update featured products failed with status {resp_update.status_code}"
        resp_json = resp_update.json()
        # Accept either a success field or rely on HTTP response OK
        assert resp_update.ok or ("success" in resp_json and resp_json["success"] is True), "Update response missing success confirmation"
    except Exception as e:
        raise AssertionError(f"Updating featured products failed: {str(e)}")


test_update_featured_products_and_check_banner_deletion_issue()
