import { logger } from '../../lib/productionLogger'
/**
 * Repository Status Component for Admin Dashboard
 * Displays overall repository health and metrics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  GitBranch, 
  Star, 
  Eye, 
  GitFork, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  ExternalLink,
  Activity,
  Calendar,
  Code,
  Users,
  Globe
} from 'lucide-react';
import { githubAPI, GitHubRepository } from '@/lib/github';

interface RepositoryStatusProps {
  className?: string;
  showDetailedMetrics?: boolean;
}

interface HealthMetrics {
  totalIssues: number;
  openIssues: number;
  closedIssues: number;
  criticalIssues: number;
  recentActivity: number;
  healthScore: number;
}

export const RepositoryStatus: React.FC<RepositoryStatusProps> = ({
  className = '',
  showDetailedMetrics = true
}) => {
  const [repository, setRepository] = useState<GitHubRepository | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRepositoryData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const [repoData, healthData] = await Promise.all([
        githubAPI.getRepository(),
        githubAPI.getRepositoryHealth()
      ]);
      
      setRepository(repoData);
      setHealthMetrics(healthData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch repository data');
      logger.error('ERROR', 'Failed to fetch repository data:', { error: err });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositoryData();
  }, []);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthStatus = (score: number) => {
    if (score >= 80) return 'Healthy';
    if (score >= 60) return 'Warning';
    return 'Critical';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Repository Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
          <Button 
            onClick={fetchRepositoryData} 
            variant="outline" 
            size="sm" 
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Repository Status
            </CardTitle>
            <CardDescription>
              {repository?.full_name || 'runacademy_full_project'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchRepositoryData}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {repository && (
              <Button variant="ghost" size="sm" asChild>
                <a
                  href={repository.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-2 bg-gray-200 rounded w-full mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        ) : repository && healthMetrics ? (
          <div className="space-y-6">
            {/* Repository Health Score */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Repository Health</span>
                <span className={`text-sm font-semibold ${getHealthColor(healthMetrics.healthScore)}`}>
                  {getHealthStatus(healthMetrics.healthScore)} ({healthMetrics.healthScore}%)
                </span>
              </div>
              <Progress 
                value={healthMetrics.healthScore} 
                className="h-2"
              />
              <div className="text-xs text-gray-500">
                Based on open issues, critical problems, and recent activity
              </div>
            </div>

            {/* Critical Issues Alert */}
            {healthMetrics.criticalIssues > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">
                    {healthMetrics.criticalIssues} Critical Issue{healthMetrics.criticalIssues > 1 ? 's' : ''} Require Attention
                  </span>
                </div>
              </div>
            )}

            {/* Repository Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Code className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Language:</span>
                  <Badge variant="secondary">{repository.language}</Badge>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Visibility:</span>
                  <Badge variant={repository.private ? "destructive" : "default"}>
                    {repository.private ? 'Private' : 'Public'}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Updated:</span>
                  <span>{formatDate(repository.updated_at)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <GitBranch className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Branch:</span>
                  <span>{repository.default_branch}</span>
                </div>
              </div>
            </div>

            {/* Repository Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
                  <Star className="h-3 w-3" />
                  Stars
                </div>
                <div className="text-lg font-semibold">{formatNumber(repository.stargazers_count)}</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
                  <GitFork className="h-3 w-3" />
                  Forks
                </div>
                <div className="text-lg font-semibold">{formatNumber(repository.forks_count)}</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
                  <Eye className="h-3 w-3" />
                  Watchers
                </div>
                <div className="text-lg font-semibold">{formatNumber(repository.watchers_count)}</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
                  <AlertCircle className="h-3 w-3" />
                  Issues
                </div>
                <div className="text-lg font-semibold">{repository.open_issues_count}</div>
              </div>
            </div>

            {/* Issue Breakdown */}
            {showDetailedMetrics && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Issue Breakdown</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Open Issues</span>
                      <span className="font-medium text-red-600">{healthMetrics.openIssues}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Closed Issues</span>
                      <span className="font-medium text-green-600">{healthMetrics.closedIssues}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Critical Issues</span>
                      <span className="font-medium text-red-600">{healthMetrics.criticalIssues}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Recent Activity</span>
                      <span className="font-medium">{healthMetrics.recentActivity}</span>
                    </div>
                  </div>
                </div>
                
                {/* Resolution Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Resolution Rate</span>
                    <span className="font-medium">
                      {healthMetrics.totalIssues > 0 
                        ? Math.round((healthMetrics.closedIssues / healthMetrics.totalIssues) * 100)
                        : 100
                      }%
                    </span>
                  </div>
                  <Progress 
                    value={healthMetrics.totalIssues > 0 
                      ? (healthMetrics.closedIssues / healthMetrics.totalIssues) * 100
                      : 100
                    } 
                    className="h-1"
                  />
                </div>
              </div>
            )}

            {/* Homepage Link */}
            {repository.homepage && (
              <div className="pt-4 border-t">
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a
                    href={repository.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    Visit Homepage
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            )}

            {/* Last Updated */}
            {lastUpdated && (
              <div className="text-xs text-gray-500 text-center pt-2 border-t">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default RepositoryStatus;