import React from 'react';
import { TIMEZONES, TIMEZONE_GROUPS } from '../../config/constants';

interface TimezoneSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

const TimezoneSelect: React.FC<TimezoneSelectProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'Select Timezone'
}) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition-all duration-200 text-sm ${className}`}
    >
      <option value="">{placeholder}</option>
      {TIMEZONE_GROUPS.map(group => (
        <optgroup key={group.value} label={group.label}>
          {TIMEZONES
            .filter(tz => tz.group === group.value)
            .map(tz => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))
          }
        </optgroup>
      ))}
    </select>
  );
};

export default TimezoneSelect;