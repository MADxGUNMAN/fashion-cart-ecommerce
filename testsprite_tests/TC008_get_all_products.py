import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_get_all_products_and_banner_deletion_issue():
    # Step 1: Test the /api/products GET endpoint to get all products
    try:
        products_response = requests.get(f"{BASE_URL}/api/products", timeout=TIMEOUT)
        products_response.raise_for_status()
        products_data = products_response.json()
    except requests.RequestException as e:
        assert False, f"Failed to get products list: {e}"
    
    assert isinstance(products_data, list) or isinstance(products_data, dict), "Products response should be a list or dict"
    
    # Step 2: Check if banner with the problematic id exists in /api/settings/get-banners
    banner_id = "cmhccsa030004hs6klsn4vtqv"
    try:
        banners_response = requests.get(f"{BASE_URL}/api/settings/get-banners", timeout=TIMEOUT)
        banners_response.raise_for_status()
        banners_data = banners_response.json()
    except requests.RequestException as e:
        assert False, f"Failed to get banners list: {e}"
    
    assert isinstance(banners_data, list) or isinstance(banners_data, dict), "Banners response should be a list or dict"

    banner_exists = False
    if isinstance(banners_data, list):
        banner_exists = any(b.get("id") == banner_id for b in banners_data)
    elif isinstance(banners_data, dict) and "banners" in banners_data:
        banner_exists = any(b.get("id") == banner_id for b in banners_data["banners"])
    
    # Step 3: If banner exists, test DELETE /api/settings/banners/{id}
    if banner_exists:
        try:
            delete_response = requests.delete(f"{BASE_URL}/api/settings/banners/{banner_id}", timeout=TIMEOUT)
            # Delete may or may not succeed, but it should not 404 if correct
            if delete_response.status_code == 404:
                assert False, f"DELETE endpoint returns 404 for existing banner id {banner_id} - possible route/configuration issue"
            # Accept 200/204 as success, others maybe error but not 404
            assert delete_response.status_code in (200, 204), f"Unexpected status on delete: {delete_response.status_code}"
        except requests.RequestException as e:
            assert False, f"Error occurred while deleting banner: {e}"
    else:
        # If banner does not exist, no route misconfiguration for this banner id can be ascertained here
        pass

test_get_all_products_and_banner_deletion_issue()