import { useNavigate } from 'react-router-dom';

const Error = ({ 
  code = '404', 
  title = 'Oops! That page can\'t be found', 
  message = 'The page you are looking for might have been removed or is temporarily unavailable.',
  showHomeButton = true 
}) => {
  const navigate = useNavigate();

  return (
    <section className="relative z-10 bg-white py-32 min-h-screen flex items-center">
      <div className="container mx-auto px-4">
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <div className="mx-auto max-w-[500px] text-center">
              {/* Error Code */}
              <h2 className="mb-4 text-[80px] font-bold leading-none text-gray-900 sm:text-[120px] md:text-[140px]">
                {code}
              </h2>
              
              {/* Error Title */}
              <h4 className="mb-4 text-2xl sm:text-3xl font-semibold leading-tight text-gray-900">
                {title}
              </h4>
              
              {/* Error Message */}
              <p className="mb-8 text-lg text-gray-600 max-w-md mx-auto">
                {message}
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {showHomeButton && (
                  <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center justify-center space-x-2 rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white transition hover:bg-blue-700 hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>Go To Home</span>
                  </button>
                )}
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center justify-center space-x-2 rounded-lg border-2 border-gray-300 px-8 py-3 text-base font-semibold text-gray-700 transition hover:bg-gray-50 hover:border-gray-400"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Go Back</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Background */}
      <div className="absolute left-0 top-0 -z-10 flex h-full w-full items-center justify-between space-x-5 md:space-x-8 lg:space-x-14 opacity-10">
        <div className="h-full w-1/3 bg-gradient-to-t from-gray-200 to-transparent"></div>
        <div className="flex h-full w-1/3">
          <div className="h-full w-1/2 bg-gradient-to-b from-gray-200 to-transparent"></div>
          <div className="h-full w-1/2 bg-gradient-to-t from-gray-200 to-transparent"></div>
        </div>
        <div className="h-full w-1/3 bg-gradient-to-b from-gray-200 to-transparent"></div>
      </div>
    </section>
  );
};

export default Error;
