import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { forgotPassword, login, googleLogin } from '@/services/authService';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { localImageUrl } from '@/utils/s3Assets';
import { DecodedImage } from '@/components/DecodedImage';
import '../../styles/Register.css'; 

const logoImage = localImageUrl('images/light_logo.png');

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'learner';
  const from = searchParams.get('from');
  const preserveFrom =
    from === 'explore-location' || from === 'landing-subject-search' ? from : null;
  const showLocationExplorePrompt = from === 'explore-location';
  const showLandingSubjectSearchPrompt = from === 'landing-subject-search';
  const registerHref = `/register?role=${role}${preserveFrom ? `&from=${preserveFrom}` : ''}`;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.email || !formData.password) {
      toast.error('Please enter your email and password.');
      setLoading(false);
      return;
    }

    try {
      const response = await login({
        email: formData.email,
        password: formData.password,
      });

      toast.success('You have been signed in.');
      const userRole = response?.user?.role;
      const normalizedRole = typeof userRole === 'string' ? userRole.toLowerCase() : null;
      
      if (normalizedRole === 'admin') {
        navigate('/admin');
      } else if (normalizedRole === 'tutor') {
        navigate('/tutor');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Could not sign you in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotOpenChange = (open) => {
    setForgotOpen(open);
    if (!open) {
      setForgotError('');
      setForgotSuccess(false);
      setForgotLoading(false);
      setForgotEmail('');
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);

    if (!forgotEmail) {
      setForgotError('Please enter your email address.');
      setForgotLoading(false);
      return;
    }

    try {
      await forgotPassword(forgotEmail);
      setForgotSuccess(true);
    } catch {
      // Keep this generic for account-enumeration safety.
      setForgotSuccess(true);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-viewport">
      <div className="auth-split-layout">
        
        {/* Left Side: Branding Watermark */}
        <div className="auth-visual-side">
          <div className="watermark-container">
            <DecodedImage src={logoImage} alt="BCT" className="subtle-watermark" />
          </div>
        </div>

        {/* Right Side: Elegant Login Form */}
        <div className="auth-content-side">
          <div className="auth-form-shell">
            {showLocationExplorePrompt && (
              <div
                className="mb-5 rounded-lg border border-primary/25 bg-primary/10 p-4 text-sm text-foreground"
                role="status"
              >
                <p className="m-0 leading-relaxed">
                  To browse and book tutors by location, sign in below or{' '}
                  <Link to={registerHref} className="font-medium text-primary underline underline-offset-2">
                    create an account
                  </Link>
                  .
                </p>
              </div>
            )}
            {showLandingSubjectSearchPrompt && (
              <div
                className="mb-5 rounded-lg border border-primary/25 bg-primary/10 p-4 text-sm text-foreground"
                role="status"
              >
                <p className="m-0 leading-relaxed">
                  To view full tutor profiles and book sessions from your search, sign in below or{' '}
                  <Link to={registerHref} className="font-medium text-primary underline underline-offset-2">
                    create an account
                  </Link>
                  .
                </p>
              </div>
            )}
            <header className="auth-header-minimal">
              <h1>Sign In</h1>
              <p>Welcome back! Please enter your details.</p>
            </header>

            <form onSubmit={handleSubmit} className="auth-clean-form">
              {/* Email Field */}
              <div className="form-row">
                <Label>Email Address</Label>
                <div className="minimal-input-group">
                  <Mail size={16} className="input-icon-left" />
                  <Input 
                    name="email" 
                    type="email" 
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@gmail.com" 
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="form-row">
                <div className="flex justify-between items-center">
                  <Label>Password</Label>
                  <button
                    type="button"
                    className="auth-link-secondary"
                    onClick={() => handleForgotOpenChange(true)}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="minimal-input-group password-input-group">
                  <Lock size={16} className="input-icon-left" />
                  <Input 
                    name="password" 
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="password-toggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="auth-terms">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Remember Me</label>
              </div>

              <div className="auth-action-area">
                <Button type="submit" className="btn-primary-luxury" disabled={loading}>
                  {loading ? 'Authenticating...' : 'Continue'}
                  <ArrowRight size={16} className="ml-2" />
                </Button>

                <div className="separator-text">
                  <span>Or continue with</span>
                </div>

                <Button 
                  type="button" 
                  onClick={() => googleLogin(role)} 
                  className="btn-google-minimal"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                  Sign in with Google
                </Button>
              </div>

              <footer className="auth-footer-minimal">
                Don't have an Account? <Link to={registerHref}>Sign Up</Link>
              </footer>
            </form>
          </div>
        </div>
      </div>

      <AlertDialog open={forgotOpen} onOpenChange={handleForgotOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Forgot Password</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your email and we&apos;ll send a reset link.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            {forgotSuccess ? (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
                If an account exists with this email, a password reset link has been sent.
              </div>
            ) : (
              <>
                {forgotError ? (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {forgotError}
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </>
            )}

            <AlertDialogFooter>
              <Button type="button" variant="outline" onClick={() => handleForgotOpenChange(false)}>
                Close
              </Button>
              {!forgotSuccess ? (
                <Button
                  type="submit"
                  disabled={forgotLoading}
                  className="bg-[#1a365d] text-white hover:bg-[#0f172a]"
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              ) : null}
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Login;

