import React, { useState, useMemo } from 'react';
import { useI18n } from '../contexts/I18nContext';

interface DateRangeCalendarProps {
  checkIn: string;
  checkOut: string;
  onSelectCheckIn: (date: string) => void;
  onSelectCheckOut: (date: string) => void;
  onClear: () => void;
}

const DateRangeCalendar: React.FC<DateRangeCalendarProps> = ({
  checkIn,
  checkOut,
  onSelectCheckIn,
  onSelectCheckOut,
  onClear,
}) => {
  const { lang, t } = useI18n();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingCheckIn, setSelectingCheckIn] = useState(true);

  const monthNames = {
    en: [t('january'), t('february'), t('march'), t('april'), t('may'), t('june'), t('july'), t('august'), t('september'), t('october'), t('november'), t('december')],
    ar: [t('january'), t('february'), t('march'), t('april'), t('may'), t('june'), t('july'), t('august'), t('september'), t('october'), t('november'), t('december')],
  };

  const dayNames = {
    en: [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')],
    ar: [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')],
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = useMemo(
    () => getDaysInMonth(currentMonth),
    [currentMonth]
  );

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(year, month, day);
    const dateStr = selectedDate.toISOString().split('T')[0];

    if (selectingCheckIn || !checkIn) {
      onSelectCheckIn(dateStr);
      setSelectingCheckIn(false);
      // Clear checkout if it's before the new check-in
      if (checkOut && new Date(checkOut) < selectedDate) {
        onSelectCheckOut('');
      }
    } else {
      // Selecting check-out
      const checkInDate = new Date(checkIn);
      if (selectedDate < checkInDate) {
        // If selected date is before check-in, set it as new check-in
        onSelectCheckIn(dateStr);
        onSelectCheckOut('');
        setSelectingCheckIn(false);
      } else {
        onSelectCheckOut(dateStr);
      }
    }
  };

  const isDateInRange = (day: number) => {
    if (!checkIn || !checkOut) return false;
    const date = new Date(year, month, day);
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    return date > checkInDate && date < checkOutDate;
  };

  const isCheckInDate = (day: number) => {
    if (!checkIn) return false;
    const date = new Date(year, month, day);
    return date.toISOString().split('T')[0] === checkIn;
  };

  const isCheckOutDate = (day: number) => {
    if (!checkOut) return false;
    const date = new Date(year, month, day);
    return date.toISOString().split('T')[0] === checkOut;
  };

  const isPastDate = (day: number) => {
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const nights = calculateNights();

  const today = new Date();
  const isPreviousMonthDisabled = year === today.getFullYear() && month <= today.getMonth();

  return (
    <div className="bg-white rounded-xl p-3 max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={goToPreviousMonth}
          disabled={isPreviousMonthDisabled}
          className={`p-1 rounded-full transition-all duration-200 ${isPreviousMonthDisabled
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-brand-orange hover:bg-brand-sand'
            }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h3 className="text-sm font-black text-brand-brown-dark">
          {monthNames[lang][month]} {year}
        </h3>

        <button
          onClick={goToNextMonth}
          className="p-1 rounded-full text-brand-orange hover:bg-brand-sand transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {dayNames[lang].map((day, index) => (
          <div key={index} className="text-center text-[10px] font-bold text-brand-brown-medium py-0.5">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}

        {/* Actual days */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const inRange = isDateInRange(day);
          const isCheckIn = isCheckInDate(day);
          const isCheckOut = isCheckOutDate(day);
          const isPast = isPastDate(day);

          return (
            <button
              key={day}
              onClick={() => !isPast && handleDateClick(day)}
              disabled={isPast}
              className={`
                aspect-square rounded-full flex items-center justify-center text-xs font-bold
                transition-all duration-200 relative
                ${isPast ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer'}
                ${isCheckIn || isCheckOut ? 'bg-gradient-brown text-white shadow-md scale-105' : ''}
                ${inRange ? 'bg-brand-sand text-brand-brown-dark' : ''}
                ${!isPast && !isCheckIn && !isCheckOut && !inRange ? 'text-brand-brown-dark hover:bg-brand-sand-light' : ''}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Selected dates summary - Only show if both dates selected */}
      {checkIn && checkOut && nights > 0 && (
        <div className="mt-2 pt-2 border-t border-brand-sand-light">
          <div className="flex items-center justify-between gap-1 text-[10px]">
            <span className="font-bold text-brand-brown-dark">
              {new Date(checkIn).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-SA', { month: 'short', day: 'numeric' })}
            </span>
            <svg className="w-3 h-3 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <span className="font-bold text-brand-brown-dark">
              {new Date(checkOut).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-SA', { month: 'short', day: 'numeric' })}
            </span>
            <span className="bg-gradient-brown text-white px-2 py-0.5 rounded text-[10px] font-bold ml-auto">
              {nights} {lang === 'en' ? (nights === 1 ? t('night') : t('nights')) : t('nights')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeCalendar;
