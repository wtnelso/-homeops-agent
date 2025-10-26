import React from 'react';
import FamilyProfileSection from './settings/FamilyProfileSection';

const FamilyKeywordsPage: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Pass a prop to show only the keywords tab */}
      <FamilyProfileSection defaultTab="keywords" />
    </div>
  );
};

export default FamilyKeywordsPage;