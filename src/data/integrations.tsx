import { Calendar } from 'lucide-react';

// Simplified integration interface for display purposes
export interface IntegrationDisplay {
  id: string;
  name: string;
  description: string;
  long_description?: string;
  platform_url?: string;
  how_it_works?: string;
  image_url: string | null;
  category: string;
  required_scopes?: string[];
  isConnected?: boolean;
}

// Integration data - will eventually come from database
export const INTEGRATIONS_DATA: IntegrationDisplay[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Connect Gmail to manage emails, send messages, and access your inbox directly from HomeOps.',
    image_url: null,
    category: 'email',
    isConnected: false
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sync your Google Calendar to manage events, schedule meetings, and view your schedule.',
    image_url: null,
    category: 'calendar',
    isConnected: false
  }
];

// Helper function to get icon component by name
export const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, any> = {
    Calendar
  };
  return iconMap[iconName] || Calendar;
};

// Custom SVG icons for integrations
export const customIcons: Record<string, React.ReactNode> = {
  gmail: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
    </svg>
  ),
  google_calendar: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
    </svg>
  )
};