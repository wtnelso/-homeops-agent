import React, { useState } from 'react';
import { Calendar, FileText, FolderOpen, BarChart3 } from 'lucide-react';
import EmailIntelligence from './EmailIntelligence';
import FamilyHub from './FamilyHub';
import Chatbot from './Chatbot';

const Dashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<string>('chat');

  const renderContent = () => {
    switch (activeView) {
      case 'email':
        return <EmailIntelligence />
      case 'family':
        return <FamilyHub />
      case 'chat':
        return <Chatbot />
      case 'calendar':
        return (
          <div className="flex flex-col items-center justify-center min-h-64 text-center">
            <Calendar size={48} className="text-gray-400 mb-4" />
            <div className="font-semibold mb-2 text-gray-800">Calendar Integration</div>
            <div className="text-sm text-gray-600 max-w-md">
              Calendar management and scheduling features coming soon.
            </div>
          </div>
        )
      case 'projects':
        return (
          <div className="flex flex-col items-center justify-center min-h-64 text-center">
            <FolderOpen size={48} className="text-gray-400 mb-4" />
            <div className="font-semibold mb-2 text-gray-800">Projects</div>
            <div className="text-sm text-gray-600 max-w-md">
              Project management and tracking features coming soon.
            </div>
          </div>
        )
      case 'documents':
        return (
          <div className="flex flex-col items-center justify-center min-h-64 text-center">
            <FileText size={48} className="text-gray-400 mb-4" />
            <div className="font-semibold mb-2 text-gray-800">Documents</div>
            <div className="text-sm text-gray-600 max-w-md">
              Document management and organization features coming soon.
            </div>
          </div>
        )
      case 'reports':
        return (
          <div className="flex flex-col items-center justify-center min-h-64 text-center">
            <BarChart3 size={48} className="text-gray-400 mb-4" />
            <div className="font-semibold mb-2 text-gray-800">Reports</div>
            <div className="text-sm text-gray-600 max-w-md">
              Analytics and reporting features coming soon.
            </div>
          </div>
        )
      default:
        return <Chatbot />
    }
  };

  const getPageTitle = () => {
    switch (activeView) {
      case 'chat': return 'Chat Assistant'
      case 'email': return 'Email Intelligence'
      case 'calendar': return 'Calendar'
      case 'family': return 'Family Hub'
      case 'projects': return 'Projects'
      case 'documents': return 'Documents'
      case 'reports': return 'Reports'
      default: return 'Dashboard'
    }
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="sticky top-0 inset-x-0 z-20 bg-white border-y border-gray-200 px-4 sm:px-6 lg:px-8 lg:hidden dark:bg-neutral-800 dark:border-neutral-700">
        <div className="flex items-center py-2">
          <button 
            type="button" 
            className="size-8 flex justify-center items-center gap-x-2 border border-gray-200 text-gray-800 hover:text-gray-500 rounded-lg focus:outline-hidden focus:text-gray-500 disabled:opacity-50 disabled:pointer-events-none dark:border-neutral-700 dark:text-neutral-200 dark:hover:text-neutral-500 dark:focus:text-neutral-500" 
            aria-haspopup="dialog" 
            aria-expanded="false" 
            aria-controls="hs-application-sidebar" 
            aria-label="Toggle navigation" 
            data-hs-overlay="#hs-application-sidebar"
          >
            <span className="sr-only">Toggle Navigation</span>
            <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/><path d="m8 9 3 3-3 3"/></svg>
          </button>
          <ol className="ms-3 flex items-center whitespace-nowrap">
            <li className="flex items-center text-sm text-gray-800 dark:text-neutral-400">
              HomeOps Agent
              <svg className="shrink-0 mx-3 overflow-visible size-2.5 text-gray-400 dark:text-neutral-500" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 1L10.6869 7.16086C10.8637 7.35239 10.8637 7.64761 10.6869 7.83914L5 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </li>
            <li className="text-sm font-semibold text-gray-800 truncate dark:text-neutral-400" aria-current="page">
              {getPageTitle()}
            </li>
          </ol>
        </div>
      </div>

      {/* Sidebar */}
      <div id="hs-application-sidebar" className="hs-overlay [--auto-close:lg] hs-overlay-open:translate-x-0 -translate-x-full transition-all duration-300 transform w-65 h-full hidden fixed inset-y-0 start-0 z-60 bg-white border-e border-gray-200 lg:block lg:translate-x-0 lg:end-auto lg:bottom-0 dark:bg-neutral-800 dark:border-neutral-700" role="dialog" tabIndex={-1} aria-label="Sidebar">
        <div className="relative flex flex-col h-full max-h-full">
          <div className="px-6 pt-4 flex items-center">
            <a className="flex-none rounded-xl text-xl inline-block font-semibold focus:outline-hidden focus:opacity-80" href="#" aria-label="HomeOps">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path>
                </svg>
              </div>
              <span className="text-blue-600 dark:text-white font-bold">HomeOps Agent</span>
            </a>
          </div>

          <div className="h-full overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-track]:bg-neutral-700 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
            <nav className="hs-accordion-group p-3 w-full flex flex-col flex-wrap" data-hs-accordion-always-open>
              <ul className="flex flex-col space-y-1">
                <li>
                  <button 
                    className={`w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm rounded-lg focus:outline-hidden ${
                      activeView === 'chat' 
                        ? 'bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-white' 
                        : 'text-gray-800 hover:bg-gray-100 focus:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700'
                    }`}
                    onClick={() => setActiveView('chat')}
                  >
                    <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    Chat Assistant
                  </button>
                </li>

                <li>
                  <button 
                    className={`w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm rounded-lg focus:outline-hidden ${
                      activeView === 'email' 
                        ? 'bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-white' 
                        : 'text-gray-800 hover:bg-gray-100 focus:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700'
                    }`}
                    onClick={() => setActiveView('email')}
                  >
                    <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    Email Intelligence
                  </button>
                </li>

                <li>
                  <button 
                    className={`w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm rounded-lg focus:outline-hidden ${
                      activeView === 'family' 
                        ? 'bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-white' 
                        : 'text-gray-800 hover:bg-gray-100 focus:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700'
                    }`}
                    onClick={() => setActiveView('family')}
                  >
                    <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    Family Hub
                  </button>
                </li>

                <li>
                  <button 
                    className={`w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm rounded-lg focus:outline-hidden ${
                      activeView === 'calendar' 
                        ? 'bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-white' 
                        : 'text-gray-800 hover:bg-gray-100 focus:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700'
                    }`}
                    onClick={() => setActiveView('calendar')}
                  >
                    <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                    Calendar
                  </button>
                </li>

                <li>
                  <button 
                    className={`w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm rounded-lg focus:outline-hidden ${
                      activeView === 'projects' 
                        ? 'bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-white' 
                        : 'text-gray-800 hover:bg-gray-100 focus:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700'
                    }`}
                    onClick={() => setActiveView('projects')}
                  >
                    <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    Projects
                  </button>
                </li>

                <li>
                  <button 
                    className={`w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm rounded-lg focus:outline-hidden ${
                      activeView === 'documents' 
                        ? 'bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-white' 
                        : 'text-gray-800 hover:bg-gray-100 focus:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700'
                    }`}
                    onClick={() => setActiveView('documents')}
                  >
                    <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    Documentation
                  </button>
                </li>

                <li>
                  <button 
                    className={`w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm rounded-lg focus:outline-hidden ${
                      activeView === 'reports' 
                        ? 'bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-white' 
                        : 'text-gray-800 hover:bg-gray-100 focus:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700'
                    }`}
                    onClick={() => setActiveView('reports')}
                  >
                    <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>
                    Reports
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full pt-10 px-4 sm:px-6 md:px-8 lg:ps-72">
        <div className="max-w-full">
          {renderContent()}
        </div>
      </div>
    </>
  );
};

export default Dashboard;