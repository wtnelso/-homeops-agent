import React from 'react';

interface BirthdayPickerProps {
  label: string;
  value: string; // Expected format: "MM/DD" or "03/15"
  onChange: (value: string) => void;
  placeholder?: string;
  source?: any;
}

const BirthdayPicker: React.FC<BirthdayPickerProps> = ({
  label,
  value,
  onChange,
  source
}) => {
  // Parse the current value to get month and day
  const [month, day] = value ? value.split('/') : ['', ''];

  // Generate month options (1-12)
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Generate day options (1-31)
  const days = Array.from({ length: 31 }, (_, i) => {
    const dayNum = i + 1;
    const dayStr = dayNum.toString().padStart(2, '0');
    return { value: dayStr, label: dayNum.toString() };
  });

  const handleMonthChange = (newMonth: string) => {
    const newValue = newMonth && day ? `${newMonth}/${day}` : newMonth ? `${newMonth}/` : '';
    onChange(newValue);
  };

  const handleDayChange = (newDay: string) => {
    const newValue = month && newDay ? `${month}/${newDay}` : newDay ? `/${newDay}` : '';
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {source && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-gray-500">
              {source.type === 'email' ? '📧' : source.type === 'chat' ? '💬' : '✏️'}
            </span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {/* Month Selector */}
        <select
          value={month || ''}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="">Month</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        {/* Day Selector */}
        <select
          value={day || ''}
          onChange={(e) => handleDayChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="">Day</option>
          {days.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default BirthdayPicker;