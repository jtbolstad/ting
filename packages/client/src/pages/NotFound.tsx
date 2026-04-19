import { useNavigate } from "react-router-dom";

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-12 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🔧</div>
        <div className="text-8xl font-bold text-indigo-600 mb-2">404</div>
        <h1 className="text-3xl font-bold mb-2">Oops!</h1>
        <p className="text-gray-600 mb-8">
          Looks like this tool has wandered off. The page you're looking for doesn't exist.
        </p>
        <button
          onClick={() => navigate("/catalog")}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition"
        >
          Back to Catalog
        </button>
      </div>
    </div>
  );
};
