import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LifeBuoy, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center">
            <LifeBuoy className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">Sign in to Resolvify</h2>
          <p className="mt-2 text-sm text-gray-600">E-Commerce Support Portal</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 text-sm"
                placeholder="customer@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-2 text-center">Demo accounts (click to fill):</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => { setEmail('customer@example.com'); setPassword('password123'); }}
                className="px-2.5 py-1.5 rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium text-left transition-colors"
              >
                👤 Customer
              </button>
              <button
                type="button"
                onClick={() => { setEmail('agent@example.com'); setPassword('password123'); }}
                className="px-2.5 py-1.5 rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium text-left transition-colors"
              >
                🎧 Support Agent
              </button>
              <button
                type="button"
                onClick={() => { setEmail('lead@example.com'); setPassword('password123'); }}
                className="px-2.5 py-1.5 rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium text-left transition-colors"
              >
                👥 Team Lead
              </button>
              <button
                type="button"
                onClick={() => { setEmail('admin@example.com'); setPassword('password123'); }}
                className="px-2.5 py-1.5 rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium text-left transition-colors"
              >
                🛡️ Admin
              </button>
            </div>
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-500">Don't have an account? </span>
            <Link to="/register" className="font-medium text-brand-600 hover:text-brand-500">
              Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
