export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-4 text-center">
      <div className="container mx-auto px-4">
        <p className="text-sm">
          © {new Date().getFullYear()} All rights reserved{" "}
          <a 
            href="https://souaibprojects.netlify.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
          >
            Ansari Souaib
          </a>
        </p>
      </div>
    </footer>
  );
}
