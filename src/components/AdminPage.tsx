import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminService, BetaUser } from '../services/adminService';
import { useToast } from '../contexts/ToastContext';
import {
  Shield,
  Users,
  Mail,
  RefreshCw,
  Plus,
  X,
  UserPlus,
  Activity,
  BarChart3,
  Zap,
  Play,
  Square,
  TrendingUp,
  Clock,
  AlertTriangle
} from 'lucide-react';
import UserDropdown from './ui/UserDropdown';
import { PageLoader, InlineLoader } from './ui/Loader';
import ToolHealthDashboard from './ui/ToolHealthDashboard';

type AdminTab = 'beta' | 'health' | 'analytics' | 'load-testing';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>('beta');
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [betaUsers, setBetaUsers] = useState<BetaUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [betaLoading, setBetaLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newBetaEmail, setNewBetaEmail] = useState('');

  // Load testing state
  const [loadTestStatus, setLoadTestStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [selectedScenario, setSelectedScenario] = useState('single_user');
  const [testResults, setTestResults] = useState<any>(null);
  const [testProgress, setTestProgress] = useState({ completed: 0, total: 0, rate: 0 });
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [currentTestId, setCurrentTestId] = useState<string | null>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load both admin emails and beta users
      const [adminResult, betaResult] = await Promise.all([
        AdminService.listAdminEmails(),
        AdminService.listBetaUsers()
      ]);

      if (adminResult.success && adminResult.emails) {
        setAdminEmails(adminResult.emails);
      } else {
        setError(adminResult.error || 'Failed to load admin data');
      }

      if (betaResult.success && betaResult.betaUsers) {
        setBetaUsers(betaResult.betaUsers);
      } else if (!betaResult.success) {
        console.error('Failed to load beta users:', betaResult.error);
      }
    } catch (err) {
      setError('Failed to load admin data');
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAdminData();
  };

  const handleAddBetaUser = async () => {
    if (!newBetaEmail.trim()) {
      showToast('Please enter an email address', 'error');
      return;
    }

    setBetaLoading(true);
    try {
      const result = await AdminService.addBetaUser(newBetaEmail.trim());
      if (result.success) {
        showToast('Beta user added successfully', 'success');
        setNewBetaEmail('');
        // Refresh beta users list
        const betaResult = await AdminService.listBetaUsers();
        if (betaResult.success && betaResult.betaUsers) {
          setBetaUsers(betaResult.betaUsers);
        }
      } else {
        showToast(result.error || 'Failed to add beta user', 'error');
      }
    } catch (error) {
      console.error('Error adding beta user:', error);
      showToast('Failed to add beta user', 'error');
    } finally {
      setBetaLoading(false);
    }
  };

  const handleRemoveBetaUser = async (betaUserId: string, email: string) => {
    if (!confirm(`Remove ${email} from beta users?`)) {
      return;
    }

    setBetaLoading(true);
    try {
      const result = await AdminService.removeBetaUser(betaUserId);
      if (result.success) {
        showToast('Beta user removed successfully', 'success');
        // Refresh beta users list
        const betaResult = await AdminService.listBetaUsers();
        if (betaResult.success && betaResult.betaUsers) {
          setBetaUsers(betaResult.betaUsers);
        }
      } else {
        showToast(result.error || 'Failed to remove beta user', 'error');
      }
    } catch (error) {
      console.error('Error removing beta user:', error);
      showToast('Failed to remove beta user', 'error');
    } finally {
      setBetaLoading(false);
    }
  };

  // Load testing scenarios - updated to match backend implementation
  const loadTestScenarios = {
    single_user: {
      name: 'Single User',
      description: '1 user processing 10 emails with full pipeline',
      users: 1,
      emails: 10,
      estimatedTime: '1-2 minutes'
    },
    light_load: {
      name: 'Light Load',
      description: '3 users processing 10 emails each',
      users: 3,
      emails: 10,
      estimatedTime: '2-3 minutes'
    },
    heavy_load: {
      name: 'Heavy Load',
      description: '5 users processing 10 emails each',
      users: 5,
      emails: 10,
      estimatedTime: '3-5 minutes'
    },
    stress_test: {
      name: 'Stress Test',
      description: '10 users processing 5 emails each',
      users: 10,
      emails: 5,
      estimatedTime: '3-4 minutes'
    }
  };

  const startLoadTest = async () => {
    const scenario = loadTestScenarios[selectedScenario as keyof typeof loadTestScenarios];
    setLoadTestStatus('running');
    setTestResults(null);
    setTestProgress({ completed: 0, total: scenario.users * scenario.emails * 2, rate: 0 });
    setTestLogs([]);

    const testId = `test_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    setCurrentTestId(testId);

    try {
      console.log(`🚀 Starting real load test: ${scenario.name}`);
      setTestLogs(prev => [...prev, `🚀 Starting ${scenario.name} load test with real infrastructure...`]);
      setTestLogs(prev => [...prev, `📊 Configuration: ${scenario.users} users × ${scenario.emails} emails = ${scenario.users * scenario.emails * 2} API calls`]);
      setTestLogs(prev => [...prev, `🔧 Test ID: ${testId}`]);

      // Start the real load test via API
      const serverUrl = import.meta.env.VITE_RENDER_SERVER_URL || 'http://localhost:10000';
      const response = await fetch(`${serverUrl}/testing/start-load-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scenario: selectedScenario,
          testId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to start load test: ${response.statusText}`);
      }

      await response.json();
      setTestLogs(prev => [...prev, `✅ Load test started successfully`]);
      setTestLogs(prev => [...prev, `🔄 Using Redis queues and real OpenAI rate limiter`]);

      // Poll for test status updates
      let statusInterval: NodeJS.Timeout;
      let lastLogCount = 0;

      statusInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${serverUrl}/testing/test-status/${testId}`);
          if (statusResponse.ok) {
            const status = await statusResponse.json();

            // Update progress
            setTestProgress({
              completed: status.metrics.completedCalls,
              total: status.metrics.totalCalls,
              rate: parseFloat(status.metrics.callsPerSecond)
            });

            // Add new logs (only new ones)
            if (status.recentLogs && status.recentLogs.length > lastLogCount) {
              const newLogs = status.recentLogs.slice(lastLogCount).map((log: any) =>
                `${new Date(log.timestamp).toLocaleTimeString()} - ${log.message}`
              );
              setTestLogs(prev => [...prev, ...newLogs]);
              lastLogCount = status.recentLogs.length;
            }

            // Check if test completed
            if (status.status === 'completed' || status.status === 'failed' || status.status === 'stopped') {
              clearInterval(statusInterval);

              const results = {
                scenario: scenario.name,
                totalCalls: status.metrics.totalCalls,
                successfulCalls: status.metrics.successfulCalls,
                rateLimitedCalls: status.metrics.rateLimitedCalls,
                totalTime: status.metrics.elapsedTime,
                averageRate: parseFloat(status.metrics.callsPerSecond),
                estimatedCost: (status.metrics.totalCalls * 0.002).toFixed(4),
                rateLimit: {
                  frequency: status.metrics.rateLimitedCalls > 0 ?
                    Math.round(status.metrics.successfulCalls / status.metrics.rateLimitedCalls) : 0,
                  percentage: status.metrics.rateLimitedCalls > 0 ?
                    ((status.metrics.rateLimitedCalls / status.metrics.totalCalls) * 100).toFixed(1) : '0'
                },
                rateLimitStatus: status.rateLimitStatus,
                queueStats: status.queueStats
              };

              setTestResults(results);
              setLoadTestStatus(status.status === 'failed' ? 'failed' : 'completed');
              setCurrentTestId(null);

              if (status.status === 'completed') {
                setTestLogs(prev => [...prev, `✅ Load test completed successfully!`]);
                setTestLogs(prev => [...prev, `📊 Success rate: ${status.metrics.successRate}%`]);
                setTestLogs(prev => [...prev, `🔄 Redis queue: ${status.queueStats?.queueLength || 0} pending`]);
                setTestLogs(prev => [...prev, `⚡ Rate limiter: ${status.rateLimitStatus?.currentRPM || 0} RPM`]);
                showToast('Load test completed successfully!', 'success');
              } else {
                setTestLogs(prev => [...prev, `❌ Load test ${status.status}`]);
                showToast(`Load test ${status.status}`, 'error');
              }
            }
          }
        } catch (error) {
          console.error('Error polling test status:', error);
        }
      }, 1000); // Poll every second

    } catch (error) {
      console.error('Load test failed:', error);
      setLoadTestStatus('failed');
      setCurrentTestId(null);
      setTestLogs(prev => [...prev, `❌ Load test failed: ${error}`]);
      showToast('Load test failed', 'error');
    }
  };

  const stopLoadTest = async () => {
    if (!currentTestId) {
      setLoadTestStatus('idle');
      setTestProgress({ completed: 0, total: 0, rate: 0 });
      setTestLogs(prev => [...prev, `⏹️ Load test stopped`]);
      return;
    }

    try {
      const serverUrl = import.meta.env.VITE_RENDER_SERVER_URL || 'http://localhost:10000';
      const response = await fetch(`${serverUrl}/testing/stop-test/${currentTestId}`, {
        method: 'POST'
      });

      if (response.ok) {
        setTestLogs(prev => [...prev, `⏹️ Load test stopped by user`]);
        showToast('Load test stopped', 'info');
      } else {
        setTestLogs(prev => [...prev, `❌ Failed to stop test gracefully`]);
      }
    } catch (error) {
      console.error('Error stopping test:', error);
      setTestLogs(prev => [...prev, `❌ Error stopping test: ${error}`]);
    }

    setLoadTestStatus('idle');
    setTestProgress({ completed: 0, total: 0, rate: 0 });
    setCurrentTestId(null);
  };

  const getTabs = () => [
    {
      id: 'beta' as AdminTab,
      name: 'Beta Users',
      icon: UserPlus,
      count: betaUsers.length
    },
    {
      id: 'health' as AdminTab,
      name: 'Health Monitor',
      icon: Activity,
      count: null
    },
    {
      id: 'load-testing' as AdminTab,
      name: 'Load Testing',
      icon: Zap,
      count: null
    },
    {
      id: 'analytics' as AdminTab,
      name: 'Analytics',
      icon: BarChart3,
      count: null,
      disabled: true
    }
  ];

  const renderBetaUsersTab = () => (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Admin Users Count */}
        <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Admin Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{adminEmails.length}</p>
            </div>
          </div>
        </div>

        {/* Beta Users Count */}
        <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Beta Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{betaUsers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Admin Users */}
        <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Admin Users
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Users with administrative access to the platform
            </p>
          </div>

          <div className="p-6">
            {error ? (
              <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : adminEmails.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No admin users found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {adminEmails.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{email}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {email === user?.email ? 'You' : 'Admin User'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                        Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Beta Users Management */}
        <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Beta Users
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Email addresses with beta access to the platform
            </p>
          </div>

          <div className="p-6">
            {/* Add Beta User Form */}
            <div className="mb-6">
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="email"
                    value={newBetaEmail}
                    onChange={(e) => setNewBetaEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddBetaUser();
                      }
                    }}
                  />
                </div>
                <button
                  onClick={handleAddBetaUser}
                  disabled={betaLoading || !newBetaEmail.trim()}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </button>
              </div>
            </div>

            {/* Beta Users List */}
            {betaUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No beta users added yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add email addresses above to grant beta access</p>
              </div>
            ) : (
              <div className="space-y-3">
                {betaUsers.map((betaUser) => (
                  <div
                    key={betaUser.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {betaUser.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{betaUser.email}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Added {new Date(betaUser.added_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleRemoveBetaUser(betaUser.id, betaUser.email)}
                        disabled={betaLoading}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                        title="Remove beta user"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderHealthTab = () => (
    <div className="space-y-8">
      <ToolHealthDashboard onRefresh={handleRefresh} />
    </div>
  );

  const renderLoadTestingTab = () => (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">API Calls</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {testProgress.completed.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {testProgress.rate.toFixed(1)}/s
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                {loadTestStatus}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {testProgress.total > 0 ? Math.round((testProgress.completed / testProgress.total) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Testing Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Test Configuration */}
        <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Load Test Configuration
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configure and run email processing load tests
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Scenario Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Test Scenario
              </label>
              <div className="space-y-3">
                {Object.entries(loadTestScenarios).map(([key, scenario]) => (
                  <div
                    key={key}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedScenario === key
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedScenario(key)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{scenario.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{scenario.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Est. time: {scenario.estimatedTime}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {(scenario.users * scenario.emails * 2).toLocaleString()} calls
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {scenario.users} users
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex space-x-3">
              {loadTestStatus === 'idle' || loadTestStatus === 'completed' || loadTestStatus === 'failed' ? (
                <button
                  onClick={startLoadTest}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Load Test
                </button>
              ) : (
                <button
                  onClick={stopLoadTest}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop Test
                </button>
              )}
            </div>

            {/* Progress Bar */}
            {loadTestStatus === 'running' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {testProgress.completed.toLocaleString()} / {testProgress.total.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${testProgress.total > 0 ? (testProgress.completed / testProgress.total) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Results & Logs */}
        <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Test Results & Logs
            </h3>
          </div>

          <div className="p-6">
            {/* Test Results */}
            {testResults && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-3">
                  ✅ {testResults.scenario} Completed
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-green-700 dark:text-green-300">Total Calls</p>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      {testResults.totalCalls.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-green-700 dark:text-green-300">Success Rate</p>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      {((testResults.successfulCalls / testResults.totalCalls) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-green-700 dark:text-green-300">Average Rate</p>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      {testResults.averageRate.toFixed(1)} calls/sec
                    </p>
                  </div>
                  <div>
                    <p className="text-green-700 dark:text-green-300">Total Time</p>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      {(testResults.totalTime / 1000).toFixed(1)}s
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Live Logs */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Live Logs</h4>
              <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
                {testLogs.length === 0 ? (
                  <p className="text-gray-500">No logs yet. Start a load test to see real-time output.</p>
                ) : (
                  testLogs.map((log, index) => (
                    <div key={index} className="text-green-400 mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
      <div className="text-center">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Analytics Coming Soon</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Advanced analytics and reporting features will be available in a future update.
        </p>
      </div>
    </div>
  );

  if (loading) {
    return <PageLoader text="Loading admin panel..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-xl dark:bg-gray-800/95 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
                <p className="text-gray-600 dark:text-gray-400">HomeOps Administration</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? <InlineLoader size="xs" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Refresh
              </button>
              <UserDropdown />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Welcome, {user?.email}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage platform administration including beta user access, system health monitoring, and analytics.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 mb-8 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {getTabs().map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isDisabled = tab.disabled;

                return (
                  <button
                    key={tab.id}
                    onClick={() => !isDisabled && setActiveTab(tab.id)}
                    disabled={isDisabled}
                    className={`
                      group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200
                      ${isActive
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : isDisabled
                        ? 'border-transparent text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 cursor-pointer'
                      }
                    `}
                  >
                    <Icon className={`
                      mr-2 h-5 w-5
                      ${isActive
                        ? 'text-blue-500 dark:text-blue-400'
                        : isDisabled
                        ? 'text-gray-400 dark:text-gray-500'
                        : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400'
                      }
                    `} />
                    {tab.name}
                    {tab.count !== null && (
                      <span className={`
                        ml-3 inline-block px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${isActive
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }
                      `}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'beta' && renderBetaUsersTab()}
            {activeTab === 'health' && renderHealthTab()}
            {activeTab === 'load-testing' && renderLoadTestingTab()}
            {activeTab === 'analytics' && renderAnalyticsTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;