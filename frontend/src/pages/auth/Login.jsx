import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { login, googleLogin } from '@/services/authService';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import logoImage from '../../images/light_logo.png';
import '../../styles/Register.css'; 

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'learner';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  return (
    <div className="auth-viewport">
      <div className="auth-split-layout">
        
        {/* Left Side: Branding Watermark */}
        <div className="auth-visual-side">
          <div className="watermark-container">
            <img src={logoImage} alt="BCT" className="subtle-watermark" />
          </div>
        </div>

        {/* Right Side: Elegant Login Form */}
        <div className="auth-content-side">
          <div className="auth-form-shell">
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
                  <Link to="/forgot-password" className="auth-link-secondary">
                    Forgot Password?
                  </Link>
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
                  onClick={googleLogin} 
                  className="btn-google-minimal"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                  Sign up with Google
                </Button>
              </div>

              <footer className="auth-footer-minimal">
                Don't have an Account? <Link to={`/register?role=${role}`}>Sign Up</Link>
              </footer>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;