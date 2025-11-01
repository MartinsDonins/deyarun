import { logger } from '../../lib/productionLogger'
/**
 * GitHub Issues Widget for Admin Dashboard
 * Displays repository issues with real-time updates and filtering
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  AlertCircle, 
  Bug, 
  Clock, 
  ExternalLink, 
  RefreshCw, 
  Smartphone, 
  Globe, 
  Server,
  HelpCircle,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { githubAPI, GitHubIssue, formatIssueDate, getIssueSeverityBadge, getPlatformBadge } from '@/lib/github';

interface GitHubIssuesWidgetProps {
  className?: string;
  maxItems?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export const GitHubIssuesWidget: React.FC<GitHubIssuesWidgetProps> = ({
  className = '',
  maxItems = 10,
  autoRefresh = true,
  refreshInterval = 5 * 60 * 1000 // 5 minutes
}) => {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'open' | 'closed'>('open');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchIssues = async () => {
    try {
      setError(null);
      const data = await githubAPI.getIssues(filter === 'closed' ? 'closed' : 'open');
      
      let filteredData = data;
      
      // Apply priority filters
      if (filter === 'critical') {
        filteredData = data.filter(issue => 
          githubAPI.classifyIssuePriority(issue).level === 'critical'
        );
      } else if (filter === 'high') {
        filteredData = data.filter(issue => {
          const priority = githubAPI.classifyIssuePriority(issue).level;
          return priority === 'critical' || priority === 'high';
        });
      }
      
      setIssues(filteredData.slice(0, maxItems));
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch issues');
      logger.error('ERROR', 'Failed to fetch GitHub issues:', { error: err });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchIssues, refreshInterval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [filter, maxItems, autoRefresh, refreshInterval]);

  const getSeverityIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Bug className="h-4 w-4 text-blue-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'web':
        return <Globe className="h-4 w-4" />;
      case 'backend':
        return <Server className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getStateCounts = () => {
    const openIssues = issues.filter(issue => issue.state === 'open').length;
    const criticalIssues = issues.filter(issue => 
      githubAPI.classifyIssuePriority(issue).level === 'critical'
    ).length;
    
    return { openIssues, criticalIssues };
  };

  const { openIssues, criticalIssues } = getStateCounts();

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            GitHub Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
          <Button 
            onClick={fetchIssues} 
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
              <Bug className="h-5 w-5" />
              GitHub Issues
            </CardTitle>
            <CardDescription>
              Repository issue tracking and monitoring
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={fetchIssues}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span>{openIssues} Open</span>
          </div>
          {criticalIssues > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-600 font-medium">{criticalIssues} Critical</span>
            </div>
          )}
          {lastUpdated && (
            <div className="flex items-center gap-2 text-xs text-gray-500 ml-auto">
              <Clock className="h-3 w-3" />
              <span>Updated {formatIssueDate(lastUpdated.toISOString())}</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
            <p>No issues found</p>
            <p className="text-sm">
              {filter === 'open' ? 'All issues are resolved!' : 'No issues match the current filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {issues.map((issue) => {
              const priority = githubAPI.classifyIssuePriority(issue);
              const platform = githubAPI.detectIssuePlatform(issue);
              const severityBadge = getIssueSeverityBadge(issue);
              const platformBadge = getPlatformBadge(issue);
              
              return (
                <div
                  key={issue.id}
                  className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                    priority.level === 'critical' ? 'border-red-200 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getSeverityIcon(priority.level)}
                        <h4 className="font-medium text-sm leading-tight">
                          #{issue.number}: {issue.title}
                        </h4>
                        <a
                          href={issue.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{ backgroundColor: `${severityBadge.color}20`, color: severityBadge.color }}
                        >
                          {severityBadge.text}
                        </Badge>
                        
                        <Badge
                          variant="outline"
                          className="text-xs flex items-center gap-1"
                          style={{ borderColor: platformBadge.color, color: platformBadge.color }}
                        >
                          {getPlatformIcon(platform.type)}
                          {platformBadge.text}
                        </Badge>
                        
                        <Badge
                          variant={issue.state === 'open' ? 'destructive' : 'default'}
                          className="text-xs"
                        >
                          {issue.state.toUpperCase()}
                        </Badge>
                        
                        {issue.labels.slice(0, 2).map((label) => (
                          <Badge
                            key={label.id}
                            variant="outline"
                            className="text-xs"
                            style={{ borderColor: `#${label.color}`, color: `#${label.color}` }}
                          >
                            {label.name}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>by {issue.user.login}</span>
                        <span>{formatIssueDate(issue.created_at)}</span>
                        {issue.comments > 0 && (
                          <span>{issue.comments} comments</span>
                        )}
                      </div>
                      
                      {issue.body && (
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                          {issue.body.substring(0, 150)}
                          {issue.body.length > 150 && '...'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {issues.length === maxItems && (
              <div className="text-center pt-4 border-t">
                <Button variant="ghost" size="sm" asChild>
                  <a
                    href={`https://github.com/MartinsDonins/runacademy_full_project/issues`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    View all issues on GitHub
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GitHubIssuesWidget;