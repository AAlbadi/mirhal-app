import React, { useMemo, useState } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { addDays, differenceInDays, format } from 'date-fns';
import 'react-day-picker/dist/style.css';
import { useI18n } from '../contexts/I18nContext';

interface DateRangePickerProps {
  onDateChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  bookedDates?: Array<{ start: Date; end: Date }>;
  minNights?: number;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  onDateChange,
  bookedDates = [],
  minNights = 1,
}) => {
  const { t } = useI18n();
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();

  const disabledRanges = useMemo(
    () =>
      bookedDates.map((booking) => ({
        from: new Date(booking.start),
        to: new Date(booking.end),
      })),
    [bookedDates]
  );

  const handleSelect = (range: DateRange | undefined) => {
    let adjusted = range;
    if (range?.from && !range?.to) {
      adjusted = { from: range.from, to: addDays(range.from, minNights) };
    }
    setSelectedRange(adjusted);
    onDateChange({
      from: adjusted?.from,
      to: adjusted?.to,
    });
  };

  const handleClear = () => {
    setSelectedRange(undefined);
    onDateChange({ from: undefined, to: undefined });
  };

  const numberOfNights =
    selectedRange?.from && selectedRange?.to
      ? differenceInDays(selectedRange.to, selectedRange.from)
      : 0;

  const formatDate = (date?: Date) =>
    date ? format(date, 'MMM d') : '—';

  return (
    <div className="space-y-4 rounded-3xl border-2 border-brand-sand-dark bg-white p-5 shadow-depth-md">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-brand-orange font-bold">{t('pickDates')}</p>
          <h4 className="text-xl font-black text-brand-brown-dark">{t('tapCheckIn')}</h4>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="text-sm font-bold text-brand-orange hover:text-brand-brown-dark transition-colors px-3 py-1.5 rounded-lg hover:bg-brand-sand"
        >
          {t('clear')}
        </button>
      </header>

      <DayPicker
        mode="range"
        numberOfMonths={2}
        selected={selectedRange}
        onSelect={handleSelect}
        disabled={[{ before: new Date() }, ...disabledRanges]}
        weekStartsOn={1}
        className="text-brand-brown-dark"
      />

      <footer className="flex items-center justify-between rounded-2xl bg-brand-orange px-6 py-4 text-sm font-semibold shadow-depth-lg">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-white/80 font-bold">{t('checkIn')}</span>
          <p className="text-lg font-black text-white">{formatDate(selectedRange?.from)}</p>
        </div>
        {numberOfNights > 0 ? (
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/80 font-bold">{t('totalNights')}</p>
            <p className="text-2xl font-black text-white">{numberOfNights}</p>
          </div>
        ) : (
          <p className="text-white/80 text-xs uppercase tracking-[0.3em] font-bold">{t('tapEndDate')}</p>
        )}
        <div className="text-right">
          <span className="text-xs uppercase tracking-[0.3em] text-white/80 font-bold">{t('checkOut')}</span>
          <p className="text-lg font-black text-white">{formatDate(selectedRange?.to)}</p>
        </div>
      </footer>
    </div>
  );
};

export default DateRangePicker;
