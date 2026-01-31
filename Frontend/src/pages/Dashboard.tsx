import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Clock, 
  Hash,
  CheckCircle,
  AlertCircle,
  Zap,
  Trophy,
  Users,
  MessageSquare,
  Activity,
  ArrowLeft,
  RefreshCw,
  Sun,
  Moon
} from 'lucide-react';
import { ProviderBadge } from '@/components/ProviderBadge';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { getDashboardData } from '@/lib/api';
import { 
  DashboardData, 
  ProviderStats, 
  OverallStats, 
  ConversationTurn,
  PROVIDERS
} from '@/types';

// Fetch real dashboard data from MongoDB
const fetchDashboardData = async (userId: string): Promise<DashboardData> => {
  try {
    const data = await getDashboardData(userId);
    return data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Return empty data structure on error
    return {
      overallStats: {
        totalConversations: 0,
        totalPrompts: 0,
        totalResponses: 0,
        successfulResponses: 0,
        errorResponses: 0,
        avgLatency: 0,
        avgTokens: 0,
        avgResponseLength: 0,
        mostSelectedProvider: 'gpt',
        fastestProvider: 'gpt',
        mostReliableProvider: 'gpt',
        totalTokensGenerated: 0,
        avgTokensPerSecond: 0,
        totalRetries: 0
      },
      providerStats: [],
      recentConversations: [],
      performanceTrends: []
    };
  }
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Load profile data from localStorage
  useEffect(() => {
    const storedUsername = localStorage.getItem('username') || 'User';
    const storedEmail = localStorage.getItem('userEmail') || 'user@example.com';
    const storedJoinDate = localStorage.getItem('userJoinDate') || new Date().toISOString();
    
    setUsername(storedUsername);
    setEmail(storedEmail);
    setJoinDate(new Date(storedJoinDate).toLocaleDateString());
  }, []);

  useEffect(() => {
    // Fetch real data from MongoDB
    const loadData = async () => {
      const userId = localStorage.getItem('userId') || 'default-user';
      console.log('Dashboard: Using userId from localStorage:', userId);
      const data = await fetchDashboardData(userId);
      console.log('Dashboard: Received data:', data);
      setDashboardData(data);
    };
    
    loadData();
  }, []);

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const { overallStats, providerStats, performanceTrends } = dashboardData;

  // Colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="min-h-screen bg-background">
      {/* Custom Header for Profile Page */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted"
                aria-label="Back to main screen"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-border"></div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  <span className="gradient-text">ResponseRally</span>
                  <span className="text-foreground"> Profile</span>
                </h1>
                <p className="text-xs text-muted-foreground">
                  User Analytics & Performance Metrics
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.location.reload()}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Refresh dashboard"
              >
                <RefreshCw className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                ) : (
                  <Moon className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Profile Content Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">{username.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text mb-1">{username}'s Profile</h1>
              <p className="text-sm text-muted-foreground">Member since {joinDate} • {email}</p>
            </div>
          </div>
          <p className="text-muted-foreground mt-4">
            Comprehensive metrics and analytics across all AI providers
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex justify-end mb-6">
          <div className="flex bg-muted rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  timeRange === range
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Overall Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<MessageSquare className="w-5 h-5" />}
            title="Total Conversations"
            value={overallStats.totalConversations.toString()}
            description={`${overallStats.totalPrompts} prompts`}
            color="text-blue-500"
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5" />}
            title="Success Rate"
            value={`${((overallStats.successfulResponses / overallStats.totalResponses) * 100).toFixed(1)}%`}
            description={`${overallStats.successfulResponses}/${overallStats.totalResponses} successful`}
            color="text-green-500"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            title="Avg Latency"
            value={`${Math.round(overallStats.avgLatency)}ms`}
            description="Response time"
            color="text-amber-500"
          />
          <StatCard
            icon={<Hash className="w-5 h-5" />}
            title="Tokens Generated"
            value={overallStats.totalTokensGenerated.toLocaleString()}
            description="Total tokens across all responses"
            color="text-purple-500"
          />
        </div>

        {/* Provider Performance Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Metrics Chart */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-primary" />
              Provider Performance Comparison
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={providerStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="provider" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.5rem'
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'avgLatency') return [`${Math.round(value)}ms`, 'Avg Latency'];
                      if (name === 'successRate') return [`${(value * 100).toFixed(1)}%`, 'Success Rate'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="avgLatency" name="Avg Latency (ms)" fill="#3b82f6" />
                  <Bar dataKey="successRate" name="Success Rate" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Provider Selection Distribution */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <Users className="w-5 h-5 mr-2 text-primary" />
              Provider Selection Distribution
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={providerStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ provider, selectionRate }) => 
                      `${provider.toUpperCase()}: ${(selectionRate * 100).toFixed(1)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="selectionRate"
                    nameKey="provider"
                  >
                    {providerStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: string) => [`${(value * 100).toFixed(1)}%`, 'Selection Rate']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.5rem'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Provider Metrics Table */}
        <div className="glass-card rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary" />
            Detailed Provider Metrics
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="p-3 text-left text-muted-foreground font-medium">Provider</th>
                  <th className="p-3 text-left text-muted-foreground font-medium">Responses</th>
                  <th className="p-3 text-left text-muted-foreground font-medium">Success Rate</th>
                  <th className="p-3 text-left text-muted-foreground font-medium">Avg Latency</th>
                  <th className="p-3 text-left text-muted-foreground font-medium">Avg Tokens</th>
                  <th className="p-3 text-left text-muted-foreground font-medium">First Token</th>
                  <th className="p-3 text-left text-muted-foreground font-medium">Tokens/sec</th>
                  <th className="p-3 text-left text-muted-foreground font-medium">Retries</th>
                </tr>
              </thead>
              <tbody>
                {providerStats.map((stats, index) => (
                  <tr 
                    key={stats.provider} 
                    className="border-b border-border/20 last:border-b-0 hover:bg-muted/10 transition-colors"
                  >
                    <td className="p-3">
                      <ProviderBadge provider={stats.provider} size="sm" />
                    </td>
                    <td className="p-3 font-mono">
                      {stats.totalResponses} ({stats.successfulResponses}✓)
                    </td>
                    <td className="p-3">
                      <div className="flex items-center">
                        <div className="w-16 bg-muted rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${stats.successRate * 100}%` }}
                          ></div>
                        </div>
                        <span className="font-mono text-sm">
                          {(stats.successRate * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3 font-mono">{Math.round(stats.avgLatency)}ms</td>
                    <td className="p-3 font-mono">{Math.round(stats.avgTokens)}</td>
                    <td className="p-3 font-mono">{Math.round(stats.avgFirstTokenLatency)}ms</td>
                    <td className="p-3 font-mono">{stats.avgTokensPerSecond.toFixed(1)}/s</td>
                    <td className="p-3 font-mono">{stats.totalRetries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Trends */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-primary" />
            Performance Trends (Last 7 Days)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                />
                <YAxis 
                  yAxisId="left" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0.5rem'
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'avgLatency') return [`${Math.round(value)}ms`, 'Avg Latency'];
                    if (name === 'successRate') return [`${(value * 100).toFixed(1)}%`, 'Success Rate'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar 
                  yAxisId="left" 
                  dataKey="avgLatency" 
                  name="Avg Latency (ms)" 
                  fill="#3b82f6" 
                />
                <Bar 
                  yAxisId="right" 
                  dataKey="successRate" 
                  name="Success Rate" 
                  fill="#10b981" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, description, color }) => (
  <div className="glass-card rounded-xl p-6 hover:glow-primary transition-all duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className={cn("text-2xl font-bold", color)}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      <div className={cn("p-3 rounded-lg bg-muted", color.replace('text-', 'text-').replace('-500', '-500/10'))}>
        {icon}
      </div>
    </div>
  </div>
);

export default Dashboard;