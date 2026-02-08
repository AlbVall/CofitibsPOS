import React, { useState } from 'react';
import { 
  auth, 
  User,
  logOut
} from '../services/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification,
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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
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
      // Optional: Force account selection
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message.replace('Firebase:', ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (user) {
      setLoading(true);
      try {
        await sendEmailVerification(user);
        alert('Verification email resent!');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // If user is logged in but not verified
  if (user && !user.emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfcfd] p-6">
        <div className="bg-white w-full max-w-md p-10 rounded-[3rem] border border-slate-100 shadow-2xl text-center">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
            <i className="fas fa-envelope-open-text text-3xl"></i>
          </div>
          <h2 className="text-2xl font-black text-emerald-900 brand-font mb-4">Check your email</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            We've sent a verification link to <span className="font-bold text-slate-800">{user.email}</span>. 
            Please verify your account to access the POS terminal.
          </p>
          
          <div className="space-y-4">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-100 active:scale-95 transition-all"
            >
              I've Verified My Email
            </button>
            <button 
              onClick={resendVerification}
              disabled={loading}
              className="w-full py-3 text-emerald-600 font-bold text-xs uppercase tracking-widest hover:bg-emerald-50 rounded-xl transition-all"
            >
              {loading ? 'Sending...' : 'Resend Link'}
            </button>
            <button 
              onClick={() => logOut()}
              className="w-full py-3 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-rose-500 transition-all"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3">
                <i className="fas fa-circle-exclamation text-rose-500 text-sm"></i>
                <p className="text-[10px] font-bold text-rose-600 uppercase leading-tight">{error}</p>
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

          {/* Social Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
            <div className="relative flex justify-center text-[9px] uppercase font-black tracking-[0.2em] text-slate-300">
              <span className="bg-white px-4">Or continue with</span>
            </div>
          </div>

          {/* Google Sign In Button */}
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