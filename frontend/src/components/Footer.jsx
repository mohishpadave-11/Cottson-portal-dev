const Footer = ({ variant = 'admin' }) => {
  const linkColor = variant === 'admin' ? 'text-blue-600 hover:text-blue-700' : 'text-purple-600 hover:text-purple-700';
  
  return (
    <footer className="bg-white border-t border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
      <div className="text-center">
        <p className="text-sm text-gray-600">
          CRM made and hosted by{' '}
          <a 
            href="https://datacircles.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`font-semibold ${linkColor} transition-colors`}
          >
            Datacircles
          </a>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          © {new Date().getFullYear()} All rights reserved
        </p>
      </div>
    </footer>
  );
};

export default Footer;
