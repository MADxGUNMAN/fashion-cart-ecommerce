import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_create_new_product():
    url = f"{BASE_URL}/api/products"
    headers = {
        "Content-Type": "application/json"
    }
    # sample valid product data, minimal example since schema is not detailed
    product_data = {
        "name": "Test Product",
        "description": "A product created for testing purposes",
        "price": 19.99,
        "stock": 100
    }
    try:
        response = requests.post(url, json=product_data, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 201 or response.status_code == 200, f"Expected status code 200 or 201, got {response.status_code}"
        json_resp = response.json()
        # Check that response contains product info including an id
        assert "id" in json_resp, "Response JSON does not contain 'id'"
        assert json_resp.get("name") == product_data["name"], "Product name in response does not match"
        assert json_resp.get("price") == product_data["price"], "Product price in response does not match"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_create_new_product()