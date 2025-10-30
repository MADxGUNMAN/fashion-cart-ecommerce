import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_add_item_to_user_cart():
    # First, fetch products to get a valid product ID to add to cart
    try:
        products_resp = requests.get(f"{BASE_URL}/api/products", timeout=TIMEOUT)
        assert products_resp.status_code == 200, f"Failed to fetch products: {products_resp.text}"
        products = products_resp.json()
        assert isinstance(products, list) and len(products) > 0, "No products available to add to cart"
        product_id = products[0].get("id") or products[0].get("_id")
        assert product_id is not None, "Product ID not found in product data"

        # Prepare cart add item payload
        payload = {
            "productId": product_id,
            "quantity": 1
        }

        headers = {
            "Content-Type": "application/json"
        }

        # Add item to cart
        add_cart_resp = requests.post(f"{BASE_URL}/api/cart", json=payload, headers=headers, timeout=TIMEOUT)
        assert add_cart_resp.status_code == 200 or add_cart_resp.status_code == 201, \
            f"Failed to add item to cart: {add_cart_resp.status_code} {add_cart_resp.text}"
        
        resp_json = add_cart_resp.json()
        # Validate response structure contains info about the item added
        assert "cart" in resp_json or "item" in resp_json, "Response does not contain cart or item info"

        # Optionally check if added item is in the response cart items
        if "cart" in resp_json:
            cart = resp_json["cart"]
            found = any(
                (item.get("productId") == product_id or item.get("product") == product_id)
                for item in (cart if isinstance(cart, list) else cart.get("items", []))
            )
            assert found, "Added product not found in the cart response"
        elif "item" in resp_json:
            item = resp_json["item"]
            assert item.get("productId") == product_id or item.get("product") == product_id, \
                "Added product ID does not match in item response"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_add_item_to_user_cart()