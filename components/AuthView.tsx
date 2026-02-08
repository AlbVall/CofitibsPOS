import React, { useState } from 'react';
import { 
  auth, 
  User,
  logOut
} from '../services/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider,
  signInWithPopup
} from '@firebase/auth';

interface AuthViewProps {
  user: User | null;
}

const AuthView: React.FC<AuthViewProps> = ({ user }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        // Email verification requirement removed as per request
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message.replace('Firebase:', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('DOMAIN NOT AUTHORIZED: You must add this URL to your Firebase Console > Authentication > Settings > Authorized Domains list.');
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message.replace('Firebase:', ''));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfcfd] p-6">
      <div className="bg-white w-full max-w-md overflow-hidden rounded-[3rem] border border-slate-100 shadow-2xl flex flex-col">
        <div className="bg-emerald-900 p-10 text-center relative overflow-hidden shrink-0">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
              <i className="fas fa-dog text-white text-3xl"></i>
            </div>
            <h1 className="text-3xl font-black text-white brand-font tracking-tight">Cofitibs<span className="text-emerald-400">.</span></h1>
            <p className="text-emerald-300/60 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Life happens. Coffee helps.</p>
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-800 rounded-full opacity-20"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-800 rounded-full opacity-20"></div>
        </div>

        <div className="p-10">
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
            <button 
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${isLogin ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${!isLogin ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Email Address</label>
              <div className="relative group">
                <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors"></i>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@cofitibs.com"
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Password</label>
              <div className="relative group">
                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors"></i>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <i className="fas fa-circle-exclamation text-rose-500 text-sm"></i>
                  <p className="text-[10px] font-black text-rose-600 uppercase leading-tight">{error.includes('DOMAIN') ? 'Config Required' : 'Error'}</p>
                </div>
                <p className="text-[10px] text-rose-500/80 font-bold leading-normal">{error}</p>
                {error.includes('DOMAIN') && (
                  <a 
                    href="https://firebase.google.com/docs/auth/web/google-signin#before_you_begin" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[9px] font-black text-emerald-600 underline uppercase tracking-widest mt-1"
                  >
                    View Setup Guide
                  </a>
                )}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {isLogin ? 'Sign in' : 'Create Account'}
                  <i className="fas fa-arrow-right-long text-xs"></i>
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
            <div className="relative flex justify-center text-[9px] uppercase font-black tracking-[0.2em] text-slate-300">
              <span className="bg-white px-4">Or continue with</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-3xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
          >
            <i className="fab fa-google text-rose-500"></i>
            Google Account
          </button>
          
          {!isLogin && (
            <p className="mt-6 text-[9px] text-center font-bold text-slate-400 uppercase tracking-widest px-4 leading-relaxed">
              By creating an account, you agree to our Internal Staff Policy.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthView;