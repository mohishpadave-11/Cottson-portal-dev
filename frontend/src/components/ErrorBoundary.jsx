import React from 'react';
import Lottie from 'lottie-react';
// Using a sewing machine / thread animation placeholder
// In production, download this JSON and import it locally
const sewingAnimationUrl = "https://assets9.lottiefiles.com/packages/lf20_suhe7qtm.json";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, animationData: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  async componentDidMount() {
    try {
      const response = await fetch(sewingAnimationUrl);
      const data = await response.json();
      this.setState({ animationData: data });
    } catch (err) {
      console.error("Failed to load Lottie animation", err);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-sans">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">

            {/* Error Image Container */}
            <div className="w-48 h-48 mx-auto mb-6 relative">
              <div className="w-full h-full bg-blue-50 rounded-full flex items-center justify-center overflow-hidden">
                <img
                  src="/Error.png"
                  alt="Error Illustration"
                  className="w-32 h-32 object-contain"
                />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-navy-900 mb-3 text-gray-900">
              A Snag in the Fabric
            </h2>

            <p className="text-gray-600 mb-8 leading-relaxed">
              We seem to have a loose thread in our system. <br />
              Our tailors (developers) are stitching it up.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-8 text-left bg-gray-50 p-4 rounded-lg border border-gray-200">
                <summary className="cursor-pointer text-sm text-gray-700 font-medium mb-2 focus:outline-none">
                  Technical Details (Dev Only)
                </summary>
                <div className="text-xs text-red-600 font-mono overflow-auto max-h-40 whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </div>
              </details>
            )}

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-900 text-white py-3 px-6 rounded-lg hover:bg-blue-800 transition-all transform hover:scale-[1.02] shadow-md font-medium"
              >
                Reload Page
              </button>

              <button
                onClick={() => window.location.href = '/home'}
                className="w-full bg-white text-gray-700 border border-gray-300 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Return to Dashboard
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
