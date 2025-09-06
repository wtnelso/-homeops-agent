import { Link } from 'react-router-dom';
import { 
  Download,
  Briefcase,
  Monitor,
  Database,
  Bot,
  Search,
  Users
} from 'lucide-react';
import { ROUTES } from '../config/routes';
import { IS_LIVE } from '../config/vars';
import Layout from './Layout';

const Landing: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4">
      {/* Hero Section */}
      <main className="grid lg:grid-cols-2 place-items-center pt-16 pb-8 md:pt-12 md:pb-24">
        <div className="py-6 md:order-1 hidden md:block">
          <img
            src="/api/placeholder/620/400"
            alt="HomeOps Dashboard"
            className="w-full max-w-lg mx-auto"
            width={620}
            height={400}
          />
        </div>
        <div>
          <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold lg:tracking-tight xl:tracking-tighter">
            AI-Powered Family Operations Platform
          </h1>
          <p className="text-lg mt-4 text-slate-600 max-w-xl">
            HomeOps is your intelligent family operations center. Transform email chaos into organized insights with AI-powered email categorization, task extraction, and family coordination.
          </p>
          {IS_LIVE && (
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              to={ROUTES.LOGIN}
              className="flex gap-1 items-center justify-center bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Download className="text-white w-5 h-5" />
              Launch HomeOps
            </Link>
          </div>
          )}
        </div>
      </main>

      {/* Features Section */}
      <div className="mt-16 md:mt-0">
        <h2 className="text-4xl lg:text-5xl font-bold lg:tracking-tight">
          Everything you need for family operations
        </h2>
        <p className="text-lg mt-4 text-slate-600">
          HomeOps comes with intelligent email processing, family task coordination, and privacy-first design for modern families.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 mt-16 gap-16">
        <div className="flex gap-4 items-start">
          <div className="mt-1 bg-black rounded-full p-2 w-8 h-8 shrink-0">
            <Briefcase className="text-white w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">AI Email Intelligence</h3>
            <p className="text-slate-500 mt-2 leading-relaxed">
              Automatically categorize emails into Family, Work, Commerce, and Priority with advanced AI processing.
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="mt-1 bg-black rounded-full p-2 w-8 h-8 shrink-0">
            <Monitor className="text-white w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Real-time Family Dashboard</h3>
            <p className="text-slate-500 mt-2 leading-relaxed">
              Track emotional load, family events, and household tasks in one unified dashboard interface.
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="mt-1 bg-black rounded-full p-2 w-8 h-8 shrink-0">
            <Database className="text-white w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Task Extraction</h3>
            <p className="text-slate-500 mt-2 leading-relaxed">
              Automatically extract and organize family tasks from emails with intelligent priority scoring.
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="mt-1 bg-black rounded-full p-2 w-8 h-8 shrink-0">
            <Bot className="text-white w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Privacy-First AI</h3>
            <p className="text-slate-500 mt-2 leading-relaxed">
              Enterprise-grade privacy protection with local processing and encrypted data handling for family security.
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="mt-1 bg-black rounded-full p-2 w-8 h-8 shrink-0">
            <Search className="text-white w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Smart Insights</h3>
            <p className="text-slate-500 mt-2 leading-relaxed">
              Get actionable insights about family schedules, task patterns, and emotional load forecasting.
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="mt-1 bg-black rounded-full p-2 w-8 h-8 shrink-0">
            <Users className="text-white w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Family Coordination</h3>
            <p className="text-slate-500 mt-2 leading-relaxed">
              Coordinate multiple family members with shared calendars, task assignments, and progress tracking.
            </p>
          </div>
        </div>
      </div>
      </div>
    </Layout>
  );
};

export default Landing;