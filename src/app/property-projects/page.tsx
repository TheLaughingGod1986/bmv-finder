'use client';

import { useState } from 'react';
import { Plus, FolderOpen, Users, Calendar, FileText, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  category: 'buy' | 'sell' | 'develop' | 'invest';
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  progress: number;
  startDate: string;
  endDate: string;
  teamMembers: number;
  tasks: {
    total: number;
    completed: number;
    overdue: number;
  };
}

const mockProjects: Project[] = [
  {
    id: '1',
    title: 'London Buy-to-Let Investment',
    description: 'Two-bedroom flat in Canary Wharf for rental income',
    category: 'buy',
    status: 'active',
    progress: 65,
    startDate: '2024-01-15',
    endDate: '2024-03-15',
    teamMembers: 3,
    tasks: { total: 12, completed: 8, overdue: 1 }
  },
  {
    id: '2',
    title: 'Manchester Property Flip',
    description: 'Three-bedroom house renovation and resale',
    category: 'develop',
    status: 'active',
    progress: 35,
    startDate: '2024-02-01',
    endDate: '2024-05-01',
    teamMembers: 5,
    tasks: { total: 18, completed: 6, overdue: 2 }
  },
  {
    id: '3',
    title: 'Birmingham Portfolio Sale',
    description: 'Selling portfolio of 5 rental properties',
    category: 'sell',
    status: 'on-hold',
    progress: 20,
    startDate: '2024-01-01',
    endDate: '2024-06-01',
    teamMembers: 2,
    tasks: { total: 15, completed: 3, overdue: 0 }
  }
];

const categoryColors = {
  buy: 'bg-blue-100 text-blue-800',
  sell: 'bg-green-100 text-green-800',
  develop: 'bg-purple-100 text-purple-800',
  invest: 'bg-orange-100 text-orange-800'
};

const statusColors = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  'on-hold': 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800'
};

export default function PropertyProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredProjects = projects.filter(project => {
    const categoryMatch = selectedCategory === 'all' || project.category === selectedCategory;
    const statusMatch = selectedStatus === 'all' || project.status === selectedStatus;
    return categoryMatch && statusMatch;
  });

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Property Projects</h1>
              <p className="mt-1 text-gray-600">Manage your property business workflows and processes</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <Plus className="h-5 w-5" />
              New Project
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FolderOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.filter(p => p.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.reduce((sum, p) => sum + p.tasks.overdue, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
                <option value="develop">Develop</option>
                <option value="invest">Invest</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Project Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                  </div>
                </div>

                {/* Project Meta */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${categoryColors[project.category]}`}>
                    {project.category.charAt(0).toUpperCase() + project.category.slice(1)}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[project.status]}`}>
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(project.progress)}`}
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Project Stats */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{project.teamMembers}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{project.tasks.completed}/{project.tasks.total}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {new Date(project.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Overdue Tasks Warning */}
                {project.tasks.overdue > 0 && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{project.tasks.overdue} overdue tasks</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex gap-2">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium">
                    View Details
                  </button>
                  <button className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new property project.
            </p>
            <div className="mt-6">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto">
                <Plus className="h-5 w-5" />
                New Project
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 