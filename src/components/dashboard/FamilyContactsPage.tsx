import React from 'react';
import FamilyProfileSection from './settings/FamilyProfileSection';

const FamilyContactsPage: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Pass a prop to show only the contacts tab */}
      <FamilyProfileSection defaultTab="contacts" />
    </div>
  );
};

export default FamilyContactsPage;