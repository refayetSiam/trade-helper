'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Move RangeInput outside to prevent recreation on every render
const RangeInput: React.FC<{
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  step?: string;
  min?: string;
  max?: string;
}> = ({ placeholder, value, onChange, error = false, step = '0.01', min, max }) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <Input
      type="number"
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      className={cn(
        'w-28 h-8 text-xs text-center bg-background border-input',
        error && 'border-destructive bg-destructive/10'
      )}
      step={step}
      min={min}
      max={max}
      autoComplete="off"
    />
  );
};

// Move QuickButton outside as well to prevent recreation
const QuickButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ active, onClick, children, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'text-xs font-semibold px-2 py-1 rounded transition-all duration-200',
      active
        ? 'bg-primary text-primary-foreground shadow-md transform-gpu hover:shadow-lg'
        : 'bg-muted text-muted-foreground hover:bg-muted/80',
      disabled && 'opacity-50 cursor-not-allowed'
    )}
  >
    {children}
  </button>
);

export interface FilterValues {
  timeMin: string;
  timeMax: string;
  strikeMin: string;
  strikeMax: string;
  volumeMin: string;
  volumeMax: string;
  oiMin: string;
  oiMax: string;
  ivMin: string;
  ivMax: string;
  returnMin: string;
  returnMax: string;
}

export interface ValidationErrors {
  time?: string;
  strike?: string;
  volume?: string;
  oi?: string;
  iv?: string;
  return?: string;
}

export interface QuickButtonState {
  time: string;
  strike: string;
  volume: string;
  oi: string;
}

export interface FilterPanelProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  validationErrors?: ValidationErrors;
  onValidationErrors?: (errors: ValidationErrors) => void;
  currentPrice?: number;
  className?: string;
  locRate: number;
  onLocRateChange: (rate: number) => void;
  totalResults: number;
  // New props for All/Recommendations
  activeTab?: 'all' | 'recommendations';
  onTabChange?: (tab: 'all' | 'recommendations') => void;
  recommendationsCount?: number;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  validationErrors = {},
  onValidationErrors,
  currentPrice,
  className,
  locRate,
  onLocRateChange,
  totalResults,
  activeTab = 'all',
  onTabChange,
  recommendationsCount = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeQuickBtns, setActiveQuickBtns] = useState<QuickButtonState>({
    time: '',
    strike: '',
    volume: '',
    oi: '',
  });

  // Validation logic
  const validateRanges = useCallback(() => {
    const errors: ValidationErrors = {};

    if (
      filters.timeMin &&
      filters.timeMax &&
      parseFloat(filters.timeMin) > parseFloat(filters.timeMax)
    ) {
      errors.time = 'Min days cannot be greater than max days';
    }
    if (
      filters.strikeMin &&
      filters.strikeMax &&
      parseFloat(filters.strikeMin) > parseFloat(filters.strikeMax)
    ) {
      errors.strike = 'Min strike cannot be greater than max strike';
    }
    if (
      filters.volumeMin &&
      filters.volumeMax &&
      parseFloat(filters.volumeMin) > parseFloat(filters.volumeMax)
    ) {
      errors.volume = 'Min volume cannot be greater than max volume';
    }
    if (filters.oiMin && filters.oiMax && parseFloat(filters.oiMin) > parseFloat(filters.oiMax)) {
      errors.oi = 'Min OI cannot be greater than max OI';
    }
    if (filters.ivMin && filters.ivMax && parseFloat(filters.ivMin) > parseFloat(filters.ivMax)) {
      errors.iv = 'Min IV cannot be greater than max IV';
    }
    if (
      filters.returnMin &&
      filters.returnMax &&
      parseFloat(filters.returnMin) > parseFloat(filters.returnMax)
    ) {
      errors.return = 'Min return cannot be greater than max return';
    }

    if (onValidationErrors) {
      onValidationErrors(errors);
    }

    return Object.keys(errors).length === 0;
  }, [filters, onValidationErrors]);

  useEffect(() => {
    validateRanges();
  }, [validateRanges]);

  const updateFilter = useCallback(
    (key: keyof FilterValues, value: string) => {
      onFiltersChange((prevFilters: FilterValues) => ({
        ...prevFilters,
        [key]: value,
      }));
    },
    [onFiltersChange]
  );

  const handleLocRateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onLocRateChange(parseFloat(e.target.value) || 0);
    },
    [onLocRateChange]
  );

  // Memoized handlers for each input field to prevent re-renders
  const handleStrikeMinChange = useCallback(
    (value: string) => updateFilter('strikeMin', value),
    [updateFilter]
  );
  const handleStrikeMaxChange = useCallback(
    (value: string) => updateFilter('strikeMax', value),
    [updateFilter]
  );
  const handleVolumeMinChange = useCallback(
    (value: string) => updateFilter('volumeMin', value),
    [updateFilter]
  );
  const handleVolumeMaxChange = useCallback(
    (value: string) => updateFilter('volumeMax', value),
    [updateFilter]
  );
  const handleTimeMinChange = useCallback(
    (value: string) => updateFilter('timeMin', value),
    [updateFilter]
  );
  const handleTimeMaxChange = useCallback(
    (value: string) => updateFilter('timeMax', value),
    [updateFilter]
  );
  const handleOIMinChange = useCallback(
    (value: string) => updateFilter('oiMin', value),
    [updateFilter]
  );
  const handleOIMaxChange = useCallback(
    (value: string) => updateFilter('oiMax', value),
    [updateFilter]
  );
  const handleIVMinChange = useCallback(
    (value: string) => updateFilter('ivMin', value),
    [updateFilter]
  );
  const handleIVMaxChange = useCallback(
    (value: string) => updateFilter('ivMax', value),
    [updateFilter]
  );
  const handleReturnMinChange = useCallback(
    (value: string) => updateFilter('returnMin', value),
    [updateFilter]
  );
  const handleReturnMaxChange = useCallback(
    (value: string) => updateFilter('returnMax', value),
    [updateFilter]
  );

  const resetAllFilters = () => {
    onFiltersChange({
      timeMin: '',
      timeMax: '',
      strikeMin: '',
      strikeMax: '',
      volumeMin: '',
      volumeMax: '',
      oiMin: '',
      oiMax: '',
      ivMin: '',
      ivMax: '',
      returnMin: '',
      returnMax: '',
    });
    setActiveQuickBtns({
      time: '',
      strike: '',
      volume: '',
      oi: '',
    });
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const calculateAnnualCost = (): number => {
    if (!currentPrice) return 0;
    return currentPrice * 100 * (locRate / 100);
  };

  // Check if any filters are active
  const hasActiveFilters = (): boolean => {
    return !!(
      filters.timeMin ||
      filters.timeMax ||
      filters.strikeMin ||
      filters.strikeMax ||
      filters.volumeMin ||
      filters.volumeMax ||
      filters.oiMin ||
      filters.oiMax ||
      filters.ivMin ||
      filters.ivMax ||
      filters.returnMin ||
      filters.returnMax
    );
  };

  // Quick button handlers
  const handleTimeQuickBtn = (preset: string) => {
    setActiveQuickBtns(prev => ({ ...prev, time: preset }));

    let newMin = '';
    let newMax = '';

    switch (preset) {
      case '30d':
        newMin = '0';
        newMax = '30';
        break;
      case '60d':
        newMin = '0';
        newMax = '60';
        break;
      case '90d':
        newMin = '0';
        newMax = '90';
        break;
      case '120d':
        newMin = '0';
        newMax = '120';
        break;
      case 'all':
        newMin = '';
        newMax = '';
        break;
    }

    // Batch update both min and max in a single call
    onFiltersChange((prevFilters: FilterValues) => ({
      ...prevFilters,
      timeMin: newMin,
      timeMax: newMax,
    }));
  };

  const handleStrikeQuickBtn = (preset: string) => {
    if (!currentPrice) return;

    setActiveQuickBtns(prev => ({ ...prev, strike: preset }));

    let newMin = '';
    let newMax = '';

    switch (preset) {
      case 'atm5':
        newMin = (currentPrice - 5).toString();
        newMax = (currentPrice + 5).toString();
        break;
      case 'atm10':
        newMin = (currentPrice - 10).toString();
        newMax = (currentPrice + 10).toString();
        break;
      case 'otm':
        newMin = currentPrice.toString();
        newMax = (currentPrice * 1.2).toString();
        break;
      case 'itm':
        newMin = '0';
        newMax = currentPrice.toString();
        break;
      case 'all':
        newMin = '';
        newMax = '';
        break;
    }

    // Batch update both min and max in a single call
    onFiltersChange((prevFilters: FilterValues) => ({
      ...prevFilters,
      strikeMin: newMin,
      strikeMax: newMax,
    }));
  };

  const handleVolumeQuickBtn = (preset: string) => {
    setActiveQuickBtns(prev => ({ ...prev, volume: preset }));

    let newMin = '';
    let newMax = '';

    switch (preset) {
      case '100+':
        newMin = '100';
        newMax = '50000';
        break;
      case '500+':
        newMin = '500';
        newMax = '100000';
        break;
      case 'all':
        newMin = '';
        newMax = '';
        break;
    }

    // Batch update both min and max in a single call
    onFiltersChange((prevFilters: FilterValues) => ({
      ...prevFilters,
      volumeMin: newMin,
      volumeMax: newMax,
    }));
  };

  const handleOIQuickBtn = (preset: string) => {
    setActiveQuickBtns(prev => ({ ...prev, oi: preset }));

    let newMin = '';
    let newMax = '';

    switch (preset) {
      case '100+':
        newMin = '100';
        newMax = '100000';
        break;
      case '1000+':
        newMin = '1000';
        newMax = '500000';
        break;
      case 'all':
        newMin = '';
        newMax = '';
        break;
    }

    // Batch update both min and max in a single call
    onFiltersChange((prevFilters: FilterValues) => ({
      ...prevFilters,
      oiMin: newMin,
      oiMax: newMax,
    }));
  };

  return (
    <div
      className={cn(
        'transition-all duration-300 border-2 rounded-xl bg-card/50',
        hasActiveFilters() ? 'border-green-700' : 'border-border',
        !isExpanded && 'max-h-16 overflow-hidden',
        className
      )}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-bold text-foreground">Filters</h3>
            <div className="text-sm font-semibold text-muted-foreground">
              {totalResults} results
              {Object.keys(validationErrors).length > 0 && (
                <span className="text-red-600 ml-2">⚠ Validation errors</span>
              )}
            </div>

            {/* View toggle buttons inline with header */}
            {onTabChange && (
              <div className="flex items-center space-x-1 ml-4">
                <span className="text-sm font-medium text-muted-foreground mr-2">View</span>
                <button
                  onClick={() => onTabChange('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                    activeTab === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  All ({totalResults})
                </button>
                <button
                  onClick={() => onTabChange('recommendations')}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                    activeTab === 'recommendations'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Recommendations ({recommendationsCount})
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={resetAllFilters} className="text-xs">
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset All
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-4">
            {/* Row 1: Strike, Volume, LOC */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Strike Range */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">
                  Strike Range (USD)
                  {validationErrors.strike && (
                    <span className="text-red-600 text-xs ml-2">{validationErrors.strike}</span>
                  )}
                </label>
                <div className="flex items-center space-x-2">
                  <RangeInput
                    placeholder="Min"
                    value={filters.strikeMin}
                    onChange={handleStrikeMinChange}
                    error={!!validationErrors.strike}
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <RangeInput
                    placeholder="Max"
                    value={filters.strikeMax}
                    onChange={handleStrikeMaxChange}
                    error={!!validationErrors.strike}
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {[
                    { key: 'atm5', label: 'ATM±$5' },
                    { key: 'atm10', label: 'ATM±$10' },
                    { key: 'otm', label: 'OTM' },
                    { key: 'itm', label: 'ITM' },
                    { key: 'all', label: 'All' },
                  ].map(btn => (
                    <QuickButton
                      key={btn.key}
                      active={activeQuickBtns.strike === btn.key}
                      onClick={() => handleStrikeQuickBtn(btn.key)}
                      disabled={!currentPrice}
                    >
                      {btn.label}
                    </QuickButton>
                  ))}
                </div>
              </div>

              {/* Volume Range */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">
                  Volume Range
                  {validationErrors.volume && (
                    <span className="text-red-600 text-xs ml-2">{validationErrors.volume}</span>
                  )}
                </label>
                <div className="flex items-center space-x-2">
                  <RangeInput
                    placeholder="Min"
                    value={filters.volumeMin}
                    onChange={handleVolumeMinChange}
                    error={!!validationErrors.volume}
                    step="1"
                    min="0"
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <RangeInput
                    placeholder="Max"
                    value={filters.volumeMax}
                    onChange={handleVolumeMaxChange}
                    error={!!validationErrors.volume}
                    step="1"
                    min="0"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {[
                    { key: '100+', label: '100+' },
                    { key: '500+', label: '500+' },
                    { key: 'all', label: 'All' },
                  ].map(btn => (
                    <QuickButton
                      key={btn.key}
                      active={activeQuickBtns.volume === btn.key}
                      onClick={() => handleVolumeQuickBtn(btn.key)}
                    >
                      {btn.label}
                    </QuickButton>
                  ))}
                </div>
              </div>

              {/* LOC Rate */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">LOC Rate (%)</label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={locRate}
                    onChange={handleLocRateChange}
                    className="w-16 h-8 text-sm text-center font-semibold"
                    step="0.1"
                    min="0"
                    max="20"
                  />
                  <span className="text-muted-foreground text-sm">%</span>
                </div>
                <div className="text-xs font-semibold text-muted-foreground">
                  Annual Cost: {currentPrice ? formatCurrency(calculateAnnualCost()) : '$0.00'}
                </div>
              </div>
            </div>

            {/* Row 2: Time, Open Interest, Annual Return */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Time Range */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">
                  Time Range (Days to Expiry)
                  {validationErrors.time && (
                    <span className="text-red-600 text-xs ml-2">{validationErrors.time}</span>
                  )}
                </label>
                <div className="flex items-center space-x-2">
                  <RangeInput
                    placeholder="Min"
                    value={filters.timeMin}
                    onChange={handleTimeMinChange}
                    error={!!validationErrors.time}
                    step="1"
                    min="0"
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <RangeInput
                    placeholder="Max"
                    value={filters.timeMax}
                    onChange={handleTimeMaxChange}
                    error={!!validationErrors.time}
                    step="1"
                    min="0"
                  />
                  <span className="text-muted-foreground text-sm">days</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {[
                    { key: '30d', label: '30d' },
                    { key: '60d', label: '60d' },
                    { key: '90d', label: '90d' },
                    { key: '120d', label: '120d' },
                    { key: 'all', label: 'All' },
                  ].map(btn => (
                    <QuickButton
                      key={btn.key}
                      active={activeQuickBtns.time === btn.key}
                      onClick={() => handleTimeQuickBtn(btn.key)}
                    >
                      {btn.label}
                    </QuickButton>
                  ))}
                </div>
              </div>

              {/* Open Interest Range */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">
                  Open Interest Range
                  {validationErrors.oi && (
                    <span className="text-red-600 text-xs ml-2">{validationErrors.oi}</span>
                  )}
                </label>
                <div className="flex items-center space-x-2">
                  <RangeInput
                    placeholder="Min"
                    value={filters.oiMin}
                    onChange={handleOIMinChange}
                    error={!!validationErrors.oi}
                    step="1"
                    min="0"
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <RangeInput
                    placeholder="Max"
                    value={filters.oiMax}
                    onChange={handleOIMaxChange}
                    error={!!validationErrors.oi}
                    step="1"
                    min="0"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {[
                    { key: '100+', label: '100+' },
                    { key: '1000+', label: '1000+' },
                    { key: 'all', label: 'All' },
                  ].map(btn => (
                    <QuickButton
                      key={btn.key}
                      active={activeQuickBtns.oi === btn.key}
                      onClick={() => handleOIQuickBtn(btn.key)}
                    >
                      {btn.label}
                    </QuickButton>
                  ))}
                </div>
              </div>

              {/* Annualized Return Range */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">
                  Annual Return Range (%)
                  {validationErrors.return && (
                    <span className="text-red-600 text-xs ml-2">{validationErrors.return}</span>
                  )}
                </label>
                <div className="flex items-center space-x-2">
                  <RangeInput
                    placeholder="Min"
                    value={filters.returnMin}
                    onChange={handleReturnMinChange}
                    error={!!validationErrors.return}
                    step="0.1"
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <RangeInput
                    placeholder="Max"
                    value={filters.returnMax}
                    onChange={handleReturnMaxChange}
                    error={!!validationErrors.return}
                    step="0.1"
                  />
                  <span className="text-muted-foreground text-sm">%</span>
                </div>
              </div>
            </div>

            {/* Row 3: IV Range */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              {/* Implied Volatility Range */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">
                  Implied Volatility Range (%)
                  {validationErrors.iv && (
                    <span className="text-red-600 text-xs ml-2">{validationErrors.iv}</span>
                  )}
                </label>
                <div className="flex items-center space-x-2">
                  <RangeInput
                    placeholder="Min"
                    value={filters.ivMin}
                    onChange={handleIVMinChange}
                    error={!!validationErrors.iv}
                    step="0.1"
                    min="0"
                    max="500"
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <RangeInput
                    placeholder="Max"
                    value={filters.ivMax}
                    onChange={handleIVMaxChange}
                    error={!!validationErrors.iv}
                    step="0.1"
                    min="0"
                    max="500"
                  />
                  <span className="text-muted-foreground text-sm">%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;
