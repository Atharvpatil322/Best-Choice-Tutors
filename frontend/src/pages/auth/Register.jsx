import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { register, googleLogin } from '@/services/authService';
import { User, Mail, Lock, Upload, ArrowRight, Eye, EyeOff } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import logoImage from '../../images/light_logo.png';
import '../../styles/Register.css';

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'learner';

  const [formData, setFormData] = useState({ name: '', email: '', password: '', profilePhoto: null });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) setFormData((prev) => ({ ...prev, profilePhoto: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast.error('Please accept the Terms and Conditions to continue.');
      return;
    }
    setLoading(true);
    try {
      const response = await register({ ...formData, role });
      toast.success('Account created. Welcome to Best Choice Tutors.');
      const target = response?.user?.role?.toLowerCase() === 'tutor' ? '/tutor' : '/dashboard';
      navigate(target);
    } catch (err) {
      toast.error(err.message || 'Could not create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    if (!termsAccepted) {
      toast.error('Please accept the Terms and Conditions to continue.');
      return;
    }
    googleLogin(role);
  };

  return (
    <div className="auth-viewport">
      <div className="auth-split-layout">
        
        {/* Left Side: Minimalist Branding */}
        <div className="auth-visual-side">
          <div className="watermark-container">
            <img src={logoImage} alt="BCT" className="subtle-watermark" />
          </div>
        </div>

        {/* Right Side: Elegant Form */}
        <div className="auth-content-side">
          <div className="auth-form-shell">
            <header className="auth-header-minimal">
              <h1>Sign Up</h1>
              <p>Join our community of expert educators and students.</p>
            </header>

            <form onSubmit={handleSubmit} className="auth-clean-form">
              <div className="form-row">
                <Label>Full Name</Label>
                <div className="minimal-input-group">
                  <User size={16} className="input-icon-left" />
                  <Input name="name" onChange={handleChange} placeholder="Alex Thompson" />
                </div>
              </div>

              <div className="form-row">
                <Label>Email Address</Label>
                <div className="minimal-input-group">
                  <Mail size={16} className="input-icon-left" />
                  <Input name="email" type="email" onChange={handleChange} placeholder="alex@example.com" />
                </div>
              </div>

              <div className="form-row">
                <Label>Password</Label>
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

              <div className="form-row">
                <Label>Profile Identity</Label>
                <label className="custom-file-trigger">
                  <Upload size={16} />
                  <span>{formData.profilePhoto ? formData.profilePhoto.name : 'Upload your photo'}</span>
                  <input type="file" onChange={handlePhotoChange} hidden />
                </label>
              </div>

              <div className="form-row terms-consent-row">
                <label className="terms-consent-label">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="terms-consent-checkbox"
                    aria-describedby="terms-consent-text"
                  />
                  <span id="terms-consent-text" className="terms-consent-text">
                    I accept the{' '}
                    <button
                      type="button"
                      className="terms-learn-more"
                      onClick={(e) => {
                        e.preventDefault();
                        setTermsDialogOpen(true);
                      }}
                    >
                      Terms and Conditions
                    </button>
                    .
                  </span>
                </label>
              </div>

              <div className="auth-action-area">
                <Button type="submit" className="btn-primary-luxury" disabled={loading || !termsAccepted}>
                  {loading ? 'Processing...' : 'Complete Registration'}
                  <ArrowRight size={16} className="ml-2" />
                </Button>

                <div className="separator-text">
                  <span>or use social</span>
                </div>

                <Button
                  type="button"
                  onClick={handleGoogleSignUp}
                  className="btn-google-minimal"
                  disabled={!termsAccepted}
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" />
                  Continue with Google
                </Button>
              </div>

              <footer className="auth-footer-minimal">
                Already a member? <Link to={`/login?role=${role}`}>Sign In</Link>
              </footer>
            </form>
          </div>
        </div>
      </div>

      {/* Terms and Conditions — Learn more popup (same pattern as booking consent) */}
      <AlertDialog open={termsDialogOpen} onOpenChange={setTermsDialogOpen}>
        <AlertDialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle>Terms and Conditions</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left text-sm text-muted-foreground overflow-y-auto pr-2 mt-2 terms-dialog-body">
                <p>
                  Welcome to Best Choice Tutors. By creating an account, you agree to the following terms and conditions.
                </p>
                <p className="font-medium text-foreground">1. Eligibility</p>
                <p>
                  You must be at least 18 years of age to register, or have the consent of a parent or legal guardian if under 18. You must provide accurate and complete information when signing up.
                </p>
                <p className="font-medium text-foreground">2. Account and conduct</p>
                <p>
                  You are responsible for keeping your password secure and for all activity under your account. You agree to use the platform only for lawful purposes and to treat other users (learners, tutors, and staff) with respect. Harassment, fraud, or misuse of the service is prohibited.
                </p>
                <p className="font-medium text-foreground">3. Tutoring and bookings</p>
                <p>
                  Sessions are subject to our booking and cancellation policies. Payments are processed in accordance with our payment terms. As a tutor, you agree to provide accurate qualifications and availability and to conduct sessions professionally.
                </p>
                <p className="font-medium text-foreground">4. Privacy and data</p>
                <p>
                  Your use of Best Choice Tutors is also governed by our Privacy Policy. We collect and use data as described there to provide the service, process payments, and improve the platform.
                </p>
                <p className="font-medium text-foreground">5. Changes and termination</p>
                <p>
                  We may update these terms from time to time. Continued use of the service after changes constitutes acceptance. We may suspend or terminate accounts that breach these terms.
                </p>
                <p>
                  By checking the consent box on the registration form, you confirm that you have read, understood, and agree to these Terms and Conditions.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Register;