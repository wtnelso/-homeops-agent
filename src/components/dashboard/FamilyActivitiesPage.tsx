import React from 'react';
import FamilyProfileSection from './settings/FamilyProfileSection';

const FamilyActivitiesPage: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Pass a prop to show only the activities tab */}
      <FamilyProfileSection defaultTab="activities" />
    </div>
  );
};

export default FamilyActivitiesPage;