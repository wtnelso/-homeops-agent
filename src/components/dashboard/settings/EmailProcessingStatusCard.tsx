import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, AlertCircle, Loader, Clock } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

const EmailProcessingStatusCard: React.FC = () => {
  const [status, setStatus] = useState<string>('loading');
  const [jobId, setJobId] = useState<string | null>(null);
  const { userData } = useAuth();

  useEffect(() => {
    if (!userData?.user?.id) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/profile/status/${userData.user.id}`);
        if (response.ok) {
          const data = await response.json();
          setStatus(data.status || 'not_started');
          setJobId(data.job_id || null);
        }
      } catch (error) {
        console.error('Failed to fetch email processing status:', error);
        setStatus('error');
      }
    };

    fetchStatus();

    // Poll status if processing
    const interval = setInterval(() => {
      if (status === 'processing' || status === 'starting') {
        fetchStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [userData, status]);

  const getStatusDisplay = () => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          text: 'Email intelligence ready',
          description: 'Your emails have been analyzed and are available for search',
          color: 'text-green-700'
        };
      case 'processing':
        return {
          icon: <Loader className="w-5 h-5 text-blue-500 animate-spin" />,
          text: 'Processing emails...',
          description: 'Analyzing your emails to build intelligence',
          color: 'text-blue-700'
        };
      case 'starting':
        return {
          icon: <Clock className="w-5 h-5 text-yellow-500" />,
          text: 'Starting analysis...',
          description: 'Preparing to process your emails',
          color: 'text-yellow-700'
        };
      case 'failed':
        return {
          icon: <AlertCircle className="w-5 h-5 text-red-500" />,
          text: 'Processing failed',
          description: 'Email analysis encountered an error. Please contact support.',
          color: 'text-red-700'
        };
      case 'not_started':
        return {
          icon: <Mail className="w-5 h-5 text-gray-500" />,
          text: 'Not started',
          description: 'Email processing has not been initiated',
          color: 'text-gray-700'
        };
      default:
        return {
          icon: <Loader className="w-5 h-5 text-gray-500 animate-spin" />,
          text: 'Loading...',
          description: 'Checking email processing status',
          color: 'text-gray-700'
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {statusDisplay.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Email Intelligence Status
          </h3>
          <p className={`text-sm font-medium ${statusDisplay.color} mb-2`}>
            {statusDisplay.text}
          </p>
          <p className="text-sm text-gray-600">
            {statusDisplay.description}
          </p>
          {jobId && (
            <p className="text-xs text-gray-500 mt-2">
              Job ID: {jobId}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailProcessingStatusCard;