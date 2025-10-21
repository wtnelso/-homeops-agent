import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../config/routes';

const EmailProcessingStatus: React.FC = () => {
  const [status, setStatus] = useState<string>('starting');
  const [progress, setProgress] = useState(0);
  const { userData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userData?.user?.id) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/profile/status/${userData.user.id}`);
        if (response.ok) {
          const data = await response.json();
          const emailStatus = data.status;

          setStatus(emailStatus);

          if (emailStatus === 'completed') {
            setProgress(100);
            setTimeout(() => navigate(ROUTES.DASHBOARD_HOME), 2000);
          } else if (emailStatus === 'failed') {
            setTimeout(() => navigate(ROUTES.DASHBOARD_HOME), 3000);
          } else if (emailStatus === 'processing') {
            setProgress(prev => Math.min(prev + Math.random() * 10, 90));
          }
        }
      } catch (err) {
        console.error('Failed to poll status:', err);
      }
    };

    const interval = setInterval(pollStatus, 2000);
    pollStatus();

    return () => clearInterval(interval);
  }, [userData, navigate]);

  const getIcon = () => {
    if (status === 'failed') return <AlertCircle className="w-8 h-8 text-red-500" />;
    if (status === 'completed') return <CheckCircle className="w-8 h-8 text-green-500" />;
    return <Loader className="w-8 h-8 text-blue-500 animate-spin" />;
  };

  const getText = () => {
    if (status === 'failed') return 'Processing failed - redirecting to dashboard...';
    if (status === 'completed') return 'Email intelligence ready! Redirecting...';
    if (status === 'processing') return `Analyzing your emails... ${Math.round(progress)}%`;
    return 'Starting email analysis...';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <Mail className="w-16 h-16 mx-auto text-blue-600 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Setting up your email intelligence
        </h1>
        <p className="text-gray-600 mb-8">
          We're analyzing your recent emails to understand your family's needs.
        </p>

        {getIcon()}
        <p className="text-lg font-medium text-gray-900 mt-4 mb-6">
          {getText()}
        </p>

        {status !== 'failed' && status !== 'completed' && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailProcessingStatus;