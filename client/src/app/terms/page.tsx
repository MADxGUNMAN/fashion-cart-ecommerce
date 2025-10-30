export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      
      <div className="prose max-w-none">
        <p className="text-gray-600 mb-6">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing and using this website, you accept and agree to be bound by the terms 
            and provision of this agreement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Use License</h2>
          <p className="mb-4">
            Permission is granted to temporarily download one copy of the materials on our website 
            for personal, non-commercial transitory viewing only.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Orders and Payment</h2>
          <ul className="list-disc pl-6 mb-4">
            <li>All orders are subject to availability and confirmation</li>
            <li>Prices are subject to change without notice</li>
            <li>We accept various payment methods including PayPal and Cash on Delivery</li>
            <li>Payment must be received before order processing</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Shipping and Delivery</h2>
          <p className="mb-4">
            We aim to process and ship orders within 1-2 business days. Delivery times may vary 
            based on location and shipping method selected.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Returns and Refunds</h2>
          <p className="mb-4">
            Items may be returned within 30 days of purchase in original condition. 
            Refunds will be processed within 5-7 business days.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
          <p>
            For questions about these Terms of Service, please contact us at 
            support@ecommerce.com
          </p>
        </section>
      </div>
    </div>
  );
}
