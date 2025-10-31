"use client";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import CheckoutSuspense from "./checkoutSkeleton";

function CheckoutPage() {
  const options = {
    clientId:
      "AU0gBSY59do5jZuQ87pfZKaRe-pH8Vp8dteV4c4UMBNF2rPsArl6AaEhb3csfAXwSKzaY6swhcMBSiFk",
  };

  return (
    <PayPalScriptProvider options={options}>
      <CheckoutSuspense />
    </PayPalScriptProvider>
  );
}

export default CheckoutPage;
