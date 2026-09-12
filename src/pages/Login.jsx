import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import logo from '../assets/HELLO PROPERTIES LOGO.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, isLoadingAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in both fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const res = await login(username.trim(), password.trim());
    setIsSubmitting(false);

    if (res && res.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(res?.error || 'Invalid username or password.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo Icon */}
        <img src={logo} alt="HelloProperties Logo" className="mx-auto h-16 w-auto object-contain mb-4" />
        <h2 className="mt-2 text-3xl font-extrabold text-[#111111] tracking-tight">
          HelloProperties
        </h2>
        <p className="mt-2 text-sm text-[#6B6B6B]">
          Internal Administration & Staff Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm rounded-xl sm:px-10 border border-[#E8E8E8]">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 font-medium">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-[#111111]">
                Username or Email
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username or email"
                  className="appearance-none block w-full px-3.5 py-2.5 border border-[#E8E8E8] rounded-lg bg-white text-[#111111] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F] transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#111111]">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  disabled={isSubmitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="appearance-none block w-full px-3.5 py-2.5 border border-[#E8E8E8] rounded-lg bg-white text-[#111111] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F] transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#B0004F] hover:bg-[#C4005A] active:bg-[#80003C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-[#B0004F] transition-all duration-150 cursor-pointer disabled:opacity-75"
              >
                {isSubmitting ? (
                  <span className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
