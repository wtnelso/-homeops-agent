/**
 * Email Embedding Framework Testing Interface
 * 
 * This component provides a comprehensive UI for testing the email embedding
 * framework, including job initiation, status monitoring, and result visualization.
 */

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Brain,
  BarChart3,
  Settings,
  Eye,
  Download
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ProcessingJob {
  job_id?: string;
  status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
  progress?: {
    percentage: number;
    processed: number;
    total: number;
    remaining: number;
  };
  timing?: {
    started_at: string;
    eta_minutes: number | null;
  };
  cost?: {
    estimated_cents: number;
    actual_cents: number;
    embedding_api_calls: number;
    theme_analysis_calls: number;
  };
  error_info?: {
    message: string;
    can_retry: boolean;
  };
}

interface TestingConfig {
  batch_type: 'full' | 'incremental' | 'refresh';
  email_limit: number;
  processing_options: {
    batch_size: number;
    max_content_length: number;
    min_priority_score: number;
  };
}

const EmailTestingPage: React.FC = () => {
  const { user, session, userData } = useAuth();
  const [job, setJob] = useState<ProcessingJob>({ status: 'idle' });
  const [config, setConfig] = useState<TestingConfig>({
    batch_type: 'full',
    email_limit: 20,
    processing_options: {
      batch_size: 5,
      max_content_length: 8000,
      min_priority_score: 0.2
    }
  });
  const [isPolling, setIsPolling] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [apiResponse, setApiResponse] = useState<any>(null);

  // Auto-polling for job status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPolling && job.job_id) {
      interval = setInterval(async () => {
        await pollJobStatus(job.job_id!);
      }, 3000); // Poll every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPolling, job.job_id]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    setLogs(prev => [...prev, `${timestamp} ${emoji} ${message}`]);
  };

  const startProcessing = async () => {
    if (!userData?.account?.id) {
      addLog('No account ID available. Please ensure you are logged in.', 'error');
      return;
    }

    try {
      addLog('🚀 Starting email embedding processing...');
      setJob({ status: 'pending' });

      const response = await fetch('/api/email-embeddings/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          account_id: userData.account.id,
          ...config
        })
      });

      const data = await response.json();
      setApiResponse(data);

      if (response.ok && data.success) {
        setJob({
          job_id: data.job_id,
          status: 'processing',
          progress: { percentage: 0, processed: 0, total: data.estimated_emails, remaining: data.estimated_emails }
        });
        setIsPolling(true);
        addLog(`✅ Job started successfully: ${data.job_id}`, 'success');
        addLog(`📊 Estimated cost: $${data.estimated_cost_cents / 100}`);
        addLog(`⏱️ Estimated duration: ${data.estimated_duration_minutes} minutes`);
      } else {
        setJob({ status: 'failed', error_info: { message: data.error || 'Unknown error', can_retry: true } });
        addLog(`❌ Failed to start processing: ${data.error}`, 'error');
      }
    } catch (error: any) {
      setJob({ status: 'failed', error_info: { message: 'Network error', can_retry: true } });
      addLog(`❌ Network error: ${error.message}`, 'error');
    }
  };

  const pollJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`/api/email-embeddings/status?job_id=${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setJob(prev => ({
          ...prev,
          status: data.status,
          progress: data.progress,
          timing: data.timing,
          cost: data.cost,
          error_info: data.error_info
        }));

        // Stop polling if job is complete or failed
        if (data.status === 'completed' || data.status === 'failed') {
          setIsPolling(false);
          addLog(
            data.status === 'completed' 
              ? `🎉 Processing completed! Processed ${data.progress.processed} emails.`
              : `💥 Processing failed: ${data.error_info?.message || 'Unknown error'}`,
            data.status === 'completed' ? 'success' : 'error'
          );
        }
      }
    } catch (error: any) {
      addLog(`⚠️ Status polling error: ${error.message}`, 'error');
    }
  };

  const resetJob = () => {
    setJob({ status: 'idle' });
    setIsPolling(false);
    setApiResponse(null);
    addLog('🔄 Job reset');
  };

  const getStatusIcon = () => {
    switch (job.status) {
      case 'processing': return <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      default: return <Play className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case 'processing': return 'border-blue-200 bg-blue-50';
      case 'completed': return 'border-green-200 bg-green-50';
      case 'failed': return 'border-red-200 bg-red-50';
      case 'pending': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Brain className="w-7 h-7 text-blue-600" />
              <span>Email Embedding Testing Framework</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Test the LangChain-powered email processing pipeline with real-time monitoring
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="font-medium text-gray-700 capitalize">{job.status}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Test Configuration</span>
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Batch Type</label>
              <select 
                value={config.batch_type}
                onChange={(e) => setConfig(prev => ({ ...prev, batch_type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={job.status === 'processing'}
              >
                <option value="full">Full Analysis</option>
                <option value="incremental">Incremental</option>
                <option value="refresh">Refresh</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Limit</label>
              <input
                type="number"
                value={config.email_limit}
                onChange={(e) => setConfig(prev => ({ ...prev, email_limit: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="1000"
                disabled={job.status === 'processing'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Batch Size</label>
              <input
                type="number"
                value={config.processing_options.batch_size}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  processing_options: { 
                    ...prev.processing_options, 
                    batch_size: parseInt(e.target.value) || 1 
                  }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="50"
                disabled={job.status === 'processing'}
              />
            </div>

            <div className="pt-4 border-t">
              <button
                onClick={startProcessing}
                disabled={job.status === 'processing' || job.status === 'pending'}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Start Processing</span>
              </button>

              {(job.status === 'completed' || job.status === 'failed') && (
                <button
                  onClick={resetJob}
                  className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Panel */}
        <div className={`rounded-xl shadow-sm border-2 p-6 ${getStatusColor()}`}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Processing Status</span>
          </h2>

          {job.status !== 'idle' && (
            <div className="space-y-4">
              {job.job_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Job ID</label>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{job.job_id}</code>
                </div>
              )}

              {job.progress && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm text-gray-600">{job.progress.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${job.progress.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>Processed: {job.progress.processed}</span>
                    <span>Remaining: {job.progress.remaining}</span>
                    <span>Total: {job.progress.total}</span>
                  </div>
                </div>
              )}

              {job.timing?.eta_minutes && (
                <div className="text-sm text-gray-600">
                  <Clock className="w-4 h-4 inline mr-1" />
                  ETA: {job.timing.eta_minutes} minutes
                </div>
              )}

              {job.cost && (
                <div className="text-sm text-gray-600 space-y-1">
                  <div>💰 Estimated Cost: ${job.cost.estimated_cents / 100}</div>
                  <div>💸 Actual Cost: ${job.cost.actual_cents / 100}</div>
                  <div className="text-xs space-y-1">
                    <div>• Embedding calls: {job.cost.embedding_api_calls}</div>
                    <div>• Theme analysis calls: {job.cost.theme_analysis_calls}</div>
                  </div>
                </div>
              )}

              {job.error_info && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-red-800 font-medium">Error Details:</div>
                  <div className="text-red-700 text-sm mt-1">{job.error_info.message}</div>
                  {job.error_info.can_retry && (
                    <div className="text-red-600 text-xs mt-2">This job can be retried.</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Logs Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>Execution Logs</span>
          </h2>
          <button
            onClick={() => setLogs([])}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Clear Logs
          </button>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto font-mono text-sm">
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          ) : (
            <div className="text-gray-500 italic">No logs yet. Start a processing job to see real-time updates.</div>
          )}
        </div>
      </div>

      {/* API Response Panel */}
      {apiResponse && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Latest API Response</span>
            </h2>
            <button
              onClick={() => navigator.clipboard.writeText(JSON.stringify(apiResponse, null, 2))}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Copy JSON
            </button>
          </div>
          <pre className="bg-gray-50 rounded-lg p-4 text-xs overflow-x-auto">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default EmailTestingPage;