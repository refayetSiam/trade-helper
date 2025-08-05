'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface FilterValues {
  timeMin: string;
  timeMax: string;
  strikeMin: string;
  strikeMax: string;
  volumeMin: string;
  volumeMax: string;
  oiMin: string;
  oiMax: string;
  profitability: 'all' | 'profitable' | 'unprofitable';
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
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeQuickBtns, setActiveQuickBtns] = useState<QuickButtonState>({
    time: '',
    strike: '',
    volume: '',
    oi: '',
  });

  // Validation logic
  const validateRanges = () => {
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
  };

  useEffect(() => {
    validateRanges();
  }, [filters]);

  const updateFilter = (key: keyof FilterValues, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

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
      profitability: 'all',
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

  // Quick button handlers
  const handleTimeQuickBtn = (preset: string) => {
    setActiveQuickBtns(prev => ({ ...prev, time: preset }));

    switch (preset) {
      case '30d':
        updateFilter('timeMin', '0');
        updateFilter('timeMax', '30');
        break;
      case '60d':
        updateFilter('timeMin', '0');
        updateFilter('timeMax', '60');
        break;
      case '90d':
        updateFilter('timeMin', '0');
        updateFilter('timeMax', '90');
        break;
      case '120d':
        updateFilter('timeMin', '0');
        updateFilter('timeMax', '120');
        break;
      case 'all':
        updateFilter('timeMin', '');
        updateFilter('timeMax', '');
        break;
    }
  };

  const handleStrikeQuickBtn = (preset: string) => {
    if (!currentPrice) return;

    setActiveQuickBtns(prev => ({ ...prev, strike: preset }));

    switch (preset) {
      case 'atm5':
        updateFilter('strikeMin', (currentPrice - 5).toString());
        updateFilter('strikeMax', (currentPrice + 5).toString());
        break;
      case 'atm10':
        updateFilter('strikeMin', (currentPrice - 10).toString());
        updateFilter('strikeMax', (currentPrice + 10).toString());
        break;
      case 'otm':
        updateFilter('strikeMin', currentPrice.toString());
        updateFilter('strikeMax', '');
        break;
      case 'itm':
        updateFilter('strikeMin', '');
        updateFilter('strikeMax', currentPrice.toString());
        break;
      case 'all':
        updateFilter('strikeMin', '');
        updateFilter('strikeMax', '');
        break;
    }
  };

  const handleVolumeQuickBtn = (preset: string) => {
    setActiveQuickBtns(prev => ({ ...prev, volume: preset }));

    switch (preset) {
      case '100+':
        updateFilter('volumeMin', '100');
        updateFilter('volumeMax', '');
        break;
      case '500+':
        updateFilter('volumeMin', '500');
        updateFilter('volumeMax', '');
        break;
      case 'all':
        updateFilter('volumeMin', '');
        updateFilter('volumeMax', '');
        break;
    }
  };

  const handleOIQuickBtn = (preset: string) => {
    setActiveQuickBtns(prev => ({ ...prev, oi: preset }));

    switch (preset) {
      case '100+':
        updateFilter('oiMin', '100');
        updateFilter('oiMax', '');
        break;
      case '1000+':
        updateFilter('oiMin', '1000');
        updateFilter('oiMax', '');
        break;
      case 'all':
        updateFilter('oiMin', '');
        updateFilter('oiMax', '');
        break;
    }
  };

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

  const RangeInput: React.FC<{
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    error?: boolean;
    step?: string;
    min?: string;
    max?: string;
  }> = ({ placeholder, value, onChange, error = false, step = '0.01', min, max }) => (
    <Input
      type="number"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      className={cn(
        'w-20 h-8 text-xs text-center bg-background border-input',
        error && 'border-destructive bg-destructive/10'
      )}
      step={step}
      min={min}
      max={max}
    />
  );

  return (
    <div
      className={cn(
        'transition-all duration-300 border-2 border-border rounded-xl bg-card/50',
        !isExpanded && 'max-h-16 overflow-hidden',
        className
      )}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-bold text-foreground">Advanced Filters</h3>
            <div className="text-sm font-semibold text-muted-foreground">
              {totalResults} results
              {Object.keys(validationErrors).length > 0 && (
                <span className="text-red-600 ml-2">⚠ Validation errors</span>
              )}
            </div>
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
                    onChange={value => updateFilter('strikeMin', value)}
                    error={!!validationErrors.strike}
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <RangeInput
                    placeholder="Max"
                    value={filters.strikeMax}
                    onChange={value => updateFilter('strikeMax', value)}
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
                    onChange={value => updateFilter('volumeMin', value)}
                    error={!!validationErrors.volume}
                    step="1"
                    min="0"
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <RangeInput
                    placeholder="Max"
                    value={filters.volumeMax}
                    onChange={value => updateFilter('volumeMax', value)}
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
                    onChange={e => onLocRateChange(parseFloat(e.target.value) || 0)}
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

            {/* Row 2: Time, Open Interest, Profitability */}
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
                    onChange={value => updateFilter('timeMin', value)}
                    error={!!validationErrors.time}
                    step="1"
                    min="0"
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <RangeInput
                    placeholder="Max"
                    value={filters.timeMax}
                    onChange={value => updateFilter('timeMax', value)}
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
                    onChange={value => updateFilter('oiMin', value)}
                    error={!!validationErrors.oi}
                    step="1"
                    min="0"
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <RangeInput
                    placeholder="Max"
                    value={filters.oiMax}
                    onChange={value => updateFilter('oiMax', value)}
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

              {/* Profitability Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">Profitability</label>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Options' },
                    { value: 'profitable', label: 'Profits Only' },
                    { value: 'unprofitable', label: 'Losses Only' },
                  ].map(option => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        value={option.value}
                        checked={filters.profitability === option.value}
                        onChange={e => updateFilter('profitability', e.target.value as any)}
                        className="mr-2"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 3: IV Range and Return Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    onChange={value => updateFilter('ivMin', value)}
                    error={!!validationErrors.iv}
                    step="0.1"
                    min="0"
                    max="500"
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <RangeInput
                    placeholder="Max"
                    value={filters.ivMax}
                    onChange={value => updateFilter('ivMax', value)}
                    error={!!validationErrors.iv}
                    step="0.1"
                    min="0"
                    max="500"
                  />
                  <span className="text-muted-foreground text-sm">%</span>
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
                    onChange={value => updateFilter('returnMin', value)}
                    error={!!validationErrors.return}
                    step="0.1"
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <RangeInput
                    placeholder="Max"
                    value={filters.returnMax}
                    onChange={value => updateFilter('returnMax', value)}
                    error={!!validationErrors.return}
                    step="0.1"
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
