import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Building2, Search, Users, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const ROLE_CONFIG = {
  provider: {
    icon: Building2,
    title: "Provider Account",
    color: "blue",
    benefits: [
      "Manage licenses and compliance",
      "Create verified openings",
      "Receive qualified referrals"
    ]
  },
  cm: {
    icon: Search,
    title: "Case Manager Account",
    color: "purple",
    benefits: [
      "Search verified openings",
      "Submit client referrals",
      "Track placement status"
    ]
  },
  family: {
    icon: Users,
    title: "Family/Guardian Account",
    color: "emerald",
    benefits: [
      "Guided care search",
      "View provider details",
      "Connect with services"
    ]
  }
};

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get('role') || 'provider';
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.provider;

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    accept_terms: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  const validatePassword = (pwd) => {
    const rules = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd)
    };
    return rules;
  };

  const passwordRules = validatePassword(formData.password);
  const passwordStrong = Object.values(passwordRules).every(v => v);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.first_name.trim()) newErrors.first_name = "First name is required";
    if (!formData.last_name.trim()) newErrors.last_name = "Last name is required";
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!passwordStrong) {
      newErrors.password = "Password does not meet requirements";
    }
    
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }
    
    if (!formData.accept_terms) {
      newErrors.accept_terms = "You must accept the terms";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      // Create user in Base44 system
      const fullName = `${formData.first_name} ${formData.last_name}`.trim();
      
      // Store registration data temporarily
      localStorage.setItem('pending_registration', JSON.stringify({
        full_name: fullName,
        email: formData.email,
        role: role,
        timestamp: Date.now()
      }));
      
      // Redirect to Base44 login/signup - Base44 handles user creation and email verification
      setShowVerification(true);
      
      // After showing message, redirect to login
      setTimeout(() => {
        base44.auth.redirectToLogin(window.location.origin + createPageUrl('Home'));
      }, 3000);
      
    } catch (error) {
      if (error.message?.includes('exists')) {
        setErrors({ email: 'Account already exists. Please log in instead.' });
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' });
      }
      setIsSubmitting(false);
    }
  };

  if (showVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Almost There!</h2>
            <p className="text-slate-600 mb-6">
              Redirecting you to complete your account setup. You'll receive a verification email at <strong>{formData.email}</strong>.
            </p>
            <p className="text-sm text-slate-500">
              Redirecting in a moment...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Benefits */}
          <div>
            <Link to={createPageUrl('Home')} className="inline-block mb-8">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-600 rounded-lg" />
                <span className="text-xl font-bold">CareLinkMN</span>
              </div>
            </Link>

            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 ${
              config.color === 'blue' ? 'bg-blue-100 text-blue-700' :
              config.color === 'purple' ? 'bg-purple-100 text-purple-700' :
              'bg-emerald-100 text-emerald-700'
            }`}>
              <config.icon className="w-4 h-4" />
              {config.title}
            </div>

            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Create Your Account
            </h1>
            <p className="text-lg text-slate-600 mb-8">
              Join Minnesota's trusted provider network
            </p>

            <ul className="space-y-4">
              {config.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className={`w-6 h-6 flex-shrink-0 ${
                    config.color === 'blue' ? 'text-blue-600' :
                    config.color === 'purple' ? 'text-purple-600' :
                    'text-emerald-600'
                  }`} />
                  <span className="text-slate-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Form */}
          <Card>
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{errors.general}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => updateField('first_name', e.target.value)}
                      className={errors.first_name ? 'border-red-500' : ''}
                    />
                    {errors.first_name && (
                      <p className="text-xs text-red-600 mt-1">{errors.first_name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => updateField('last_name', e.target.value)}
                      className={errors.last_name ? 'border-red-500' : ''}
                    />
                    {errors.last_name && (
                      <p className="text-xs text-red-600 mt-1">{errors.last_name}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  
                  {formData.password && (
                    <div className="mt-2 space-y-1">
                      {Object.entries({
                        length: "At least 8 characters",
                        uppercase: "One uppercase letter",
                        lowercase: "One lowercase letter",
                        number: "One number"
                      }).map(([key, label]) => (
                        <div key={key} className="flex items-center gap-2 text-xs">
                          {passwordRules[key] ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-slate-300" />
                          )}
                          <span className={passwordRules[key] ? 'text-emerald-700' : 'text-slate-500'}>
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirm_password">Confirm Password *</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={formData.confirm_password}
                    onChange={(e) => updateField('confirm_password', e.target.value)}
                    className={errors.confirm_password ? 'border-red-500' : ''}
                  />
                  {errors.confirm_password && (
                    <p className="text-xs text-red-600 mt-1">{errors.confirm_password}</p>
                  )}
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <Checkbox
                    id="terms"
                    checked={formData.accept_terms}
                    onCheckedChange={(checked) => updateField('accept_terms', checked)}
                  />
                  <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                    I accept the <Link to="#" className="text-blue-600 hover:underline">Terms of Service</Link> and{' '}
                    <Link to="#" className="text-blue-600 hover:underline">Privacy Policy</Link>
                  </Label>
                </div>
                {errors.accept_terms && (
                  <p className="text-xs text-red-600">{errors.accept_terms}</p>
                )}

                <Button
                  type="submit"
                  className={`w-full ${
                    config.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                    config.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                    'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>

                <p className="text-center text-sm text-slate-600">
                  Already have an account?{' '}
                  <button 
                    type="button"
                    onClick={() => base44.auth.redirectToLogin()} 
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Log in
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}