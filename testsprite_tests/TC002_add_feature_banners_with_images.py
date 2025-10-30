import requests
from io import BytesIO

BASE_URL = "http://localhost:5000"
TIMEOUT = 30
AUTH_TOKEN = "your_valid_jwt_token_here"

HEADERS = {"Authorization": f"Bearer {AUTH_TOKEN}"}

def test_delete_banner_route_and_existence():
    # The problematic banner ID mentioned
    banner_id = "cmhccsa030004hs6klsn4vtqv"

    try:
        # Step 1: Check if the banner exists in the banners list
        get_banners_url = f"{BASE_URL}/api/settings/get-banners"
        resp_get = requests.get(get_banners_url, headers=HEADERS, timeout=TIMEOUT)
        resp_get.raise_for_status()
        banners = resp_get.json()

        banner_exists = any(b.get("id") == banner_id for b in banners)
        
        if not banner_exists:
            # If banner does not exist, create one as a test banner to later delete it
            # Minimal image payload to create banner
            # Create a small dummy image in-memory
            img_content = BytesIO(b"TestImageContent12345")
            img_content.name = "testimage.jpg"
            post_banner_url = f"{BASE_URL}/api/settings/banners"
            files = [("images", ("testimage.jpg", img_content, "image/jpeg"))]
            resp_post = requests.post(post_banner_url, headers=HEADERS, files=files, timeout=TIMEOUT)
            resp_post.raise_for_status()
            created_banner = resp_post.json()
            
            # Attempt to extract the new banner ID from response
            new_banner_id = created_banner.get("id") or created_banner.get("bannerId") or None
            assert new_banner_id is not None, "Created banner ID not found in response."

            banner_id_to_delete = new_banner_id
        else:
            banner_id_to_delete = banner_id

        # Step 2: Attempt to DELETE the banner by ID
        delete_url = f"{BASE_URL}/api/settings/banners/{banner_id_to_delete}"
        resp_delete = requests.delete(delete_url, headers=HEADERS, timeout=TIMEOUT)

        # If banner existed, deletion should succeed or 204/200 expected
        if banner_exists or banner_id_to_delete != banner_id:
            assert resp_delete.status_code in (200, 204), \
                f"Expected 200 or 204 when deleting banner, got {resp_delete.status_code} with body: {resp_delete.text}"
        else:
            # Banner does not exist, 404 may be expected, but test note reports issue with 404 on existing banner
            # Just assert status code for info
            assert resp_delete.status_code in (200, 204, 404), \
                f"Unexpected status code on delete: {resp_delete.status_code}"

    finally:
        # Cleanup: If we created a banner in this test, try to delete it if still exists
        if 'new_banner_id' in locals():
            try:
                cleanup_url = f"{BASE_URL}/api/settings/banners/{new_banner_id}"
                requests.delete(cleanup_url, headers=HEADERS, timeout=TIMEOUT)
            except Exception:
                pass

test_delete_banner_route_and_existence()