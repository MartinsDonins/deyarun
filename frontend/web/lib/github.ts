import { logger } from '../lib/productionLogger'
/**
 * GitHub API Integration Library
 * Provides functionality for repository management and issue tracking
 */

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  author_association: string;
  user: {
    login: string;
    id: number;
    avatar_url: string;
    type: string;
  };
  labels: Array<{
    id: number;
    name: string;
    color: string;
    description: string;
  }>;
  comments: number;
  html_url: string;
  body: string;
  reactions?: {
    total_count: number;
    '+1': number;
    '-1': number;
    laugh: number;
    hooray: number;
    confused: number;
    heart: number;
    rocket: number;
    eyes: number;
  };
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string;
  language: string;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string;
  html_url: string;
  size: number;
  default_branch: string;
  visibility: 'public' | 'private';
  permissions?: {
    admin: boolean;
    maintain: boolean;
    push: boolean;
    triage: boolean;
    pull: boolean;
  };
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
  company: string;
  blog: string;
  location: string;
  email: string | null;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface IssuePriority {
  level: 'critical' | 'high' | 'medium' | 'low';
  color: string;
  description: string;
}

export interface IssuePlatform {
  type: 'mobile' | 'web' | 'backend' | 'unknown';
  confidence: number;
}

export class GitHubAPI {
  private baseURL = 'https://api.github.com';
  private token: string;
  private owner = 'MartinsDonins';
  private repo = 'runacademy_full_project';

  constructor() {
    this.token = process.env.NEXT_PUBLIC_GITHUB_TOKEN || '';
    if (!this.token) {
      logger.warn('WARNING', 'GitHub token not found. Some functionality may be limited.');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Authorization': `token ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'RunAcademy-Admin-Dashboard',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('ERROR', 'GitHub API request failed for ${endpoint}:', { error: error });
      throw error;
    }
  }

  /**
   * Get all issues for the repository
   */
  async getIssues(
    state: 'open' | 'closed' | 'all' = 'open',
    labels?: string,
    sort: 'created' | 'updated' | 'comments' = 'updated',
    direction: 'asc' | 'desc' = 'desc'
  ): Promise<GitHubIssue[]> {
    const params = new URLSearchParams({
      state,
      sort,
      direction,
      per_page: '100',
    });

    if (labels) {
      params.append('labels', labels);
    }

    return this.request<GitHubIssue[]>(`/repos/${this.owner}/${this.repo}/issues?${params}`);
  }

  /**
   * Get a specific issue by number
   */
  async getIssue(issueNumber: number): Promise<GitHubIssue> {
    return this.request<GitHubIssue>(`/repos/${this.owner}/${this.repo}/issues/${issueNumber}`);
  }

  /**
   * Get repository information
   */
  async getRepository(): Promise<GitHubRepository> {
    return this.request<GitHubRepository>(`/repos/${this.owner}/${this.repo}`);
  }

  /**
   * Get authenticated user information
   */
  async getUser(): Promise<GitHubUser> {
    return this.request<GitHubUser>('/user');
  }

  /**
   * Get issue comments
   */
  async getIssueComments(issueNumber: number): Promise<any[]> {
    return this.request<any[]>(`/repos/${this.owner}/${this.repo}/issues/${issueNumber}/comments`);
  }

  /**
   * Get repository commits
   */
  async getCommits(since?: string, until?: string, per_page = 30): Promise<any[]> {
    const params = new URLSearchParams({ per_page: per_page.toString() });
    
    if (since) params.append('since', since);
    if (until) params.append('until', until);

    return this.request<any[]>(`/repos/${this.owner}/${this.repo}/commits?${params}`);
  }

  /**
   * Classify issue priority based on title and content
   */
  classifyIssuePriority(issue: GitHubIssue): IssuePriority {
    const title = issue.title.toLowerCase();
    const body = issue.body?.toLowerCase() || '';
    
    // Critical: crashes, TypeErrors, security issues
    if (
      title.includes('crash') ||
      title.includes('typeerror') ||
      title.includes('cannot read property') ||
      title.includes('security') ||
      title.includes('vulnerability') ||
      body.includes('production down') ||
      body.includes('cannot access')
    ) {
      return {
        level: 'critical',
        color: '#dc2626', // red-600
        description: 'Requires immediate attention - affects core functionality'
      };
    }

    // High: errors, bugs, performance issues
    if (
      title.includes('error') ||
      title.includes('bug') ||
      title.includes('broken') ||
      title.includes('performance') ||
      title.includes('slow') ||
      body.includes('error') ||
      issue.labels.some(label => ['bug', 'error', 'critical'].includes(label.name.toLowerCase()))
    ) {
      return {
        level: 'high',
        color: '#ea580c', // orange-600
        description: 'Important issue that should be resolved soon'
      };
    }

    // Medium: improvements, enhancements, questions
    if (
      title.includes('improvement') ||
      title.includes('enhancement') ||
      title.includes('feature') ||
      title.includes('question') ||
      issue.labels.some(label => ['enhancement', 'feature', 'question'].includes(label.name.toLowerCase()))
    ) {
      return {
        level: 'medium',
        color: '#2563eb', // blue-600
        description: 'Enhancement or question - moderate priority'
      };
    }

    // Low: documentation, cleanup, minor issues
    return {
      level: 'low',
      color: '#16a34a', // green-600
      description: 'Low priority - documentation or minor improvements'
    };
  }

  /**
   * Detect issue platform based on content
   */
  detectIssuePlatform(issue: GitHubIssue): IssuePlatform {
    const title = issue.title.toLowerCase();
    const body = issue.body?.toLowerCase() || '';
    
    // Mobile indicators
    const mobileIndicators = [
      'android.bundle',
      'ios.bundle',
      'expo',
      'react native',
      'mobile',
      'app',
      'android',
      'ios'
    ];
    
    // Web indicators
    const webIndicators = [
      'browser',
      'web',
      'next.js',
      'nextjs',
      'vercel',
      'frontend',
      'client'
    ];
    
    // Backend indicators
    const backendIndicators = [
      'server',
      'api',
      'backend',
      'database',
      'mongodb',
      'coolify',
      'express'
    ];

    let mobileScore = 0;
    let webScore = 0;
    let backendScore = 0;

    // Check title and body for indicators
    const checkText = (text: string, indicators: string[], score: number) => {
      return indicators.reduce((acc, indicator) => {
        if (text.includes(indicator)) acc += score;
        return acc;
      }, 0);
    };

    mobileScore += checkText(title, mobileIndicators, 2);
    mobileScore += checkText(body, mobileIndicators, 1);

    webScore += checkText(title, webIndicators, 2);
    webScore += checkText(body, webIndicators, 1);

    backendScore += checkText(title, backendIndicators, 2);
    backendScore += checkText(body, backendIndicators, 1);

    // Check labels
    issue.labels.forEach(label => {
      const labelName = label.name.toLowerCase();
      if (mobileIndicators.some(indicator => labelName.includes(indicator))) {
        mobileScore += 3;
      }
      if (webIndicators.some(indicator => labelName.includes(indicator))) {
        webScore += 3;
      }
      if (backendIndicators.some(indicator => labelName.includes(indicator))) {
        backendScore += 3;
      }
    });

    // Determine platform with highest score
    const maxScore = Math.max(mobileScore, webScore, backendScore);
    
    if (maxScore === 0) {
      return { type: 'unknown', confidence: 0 };
    }

    if (mobileScore === maxScore) {
      return { type: 'mobile', confidence: Math.min(mobileScore / 5, 1) };
    }
    if (webScore === maxScore) {
      return { type: 'web', confidence: Math.min(webScore / 5, 1) };
    }
    if (backendScore === maxScore) {
      return { type: 'backend', confidence: Math.min(backendScore / 5, 1) };
    }

    return { type: 'unknown', confidence: 0 };
  }

  /**
   * Get repository health metrics
   */
  async getRepositoryHealth(): Promise<{
    totalIssues: number;
    openIssues: number;
    closedIssues: number;
    criticalIssues: number;
    recentActivity: number;
    healthScore: number;
  }> {
    try {
      const [openIssues, closedIssues, repository] = await Promise.all([
        this.getIssues('open'),
        this.getIssues('closed'),
        this.getRepository()
      ]);

      const totalIssues = openIssues.length + closedIssues.length;
      const criticalIssues = openIssues.filter(issue => 
        this.classifyIssuePriority(issue).level === 'critical'
      ).length;

      // Calculate recent activity (issues created in last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentActivity = openIssues.filter(issue => 
        new Date(issue.created_at) > weekAgo
      ).length;

      // Calculate health score (0-100)
      let healthScore = 100;
      healthScore -= Math.min(openIssues.length * 5, 50); // Reduce for open issues
      healthScore -= criticalIssues * 20; // Heavily penalize critical issues
      healthScore = Math.max(healthScore, 0);

      return {
        totalIssues,
        openIssues: openIssues.length,
        closedIssues: closedIssues.length,
        criticalIssues,
        recentActivity,
        healthScore
      };
    } catch (error) {
      logger.error('ERROR', 'Failed to get repository health:', { error: error });
      throw error;
    }
  }

  /**
   * Check if GitHub API is accessible
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.getUser();
      return true;
    } catch (error) {
      logger.error('ERROR', 'GitHub API connection failed:', { error: error });
      return false;
    }
  }
}

// Export singleton instance
export const githubAPI = new GitHubAPI();

// Export helper functions
export const formatIssueDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
};

export const getIssueSeverityBadge = (issue: GitHubIssue) => {
  const priority = githubAPI.classifyIssuePriority(issue);
  return {
    text: priority.level.toUpperCase(),
    color: priority.color,
    description: priority.description
  };
};

export const getPlatformBadge = (issue: GitHubIssue) => {
  const platform = githubAPI.detectIssuePlatform(issue);
  const platformColors = {
    mobile: '#10b981', // green-500
    web: '#3b82f6',    // blue-500
    backend: '#8b5cf6', // violet-500
    unknown: '#6b7280'  // gray-500
  };
  
  return {
    text: platform.type.toUpperCase(),
    color: platformColors[platform.type],
    confidence: platform.confidence
  };
};