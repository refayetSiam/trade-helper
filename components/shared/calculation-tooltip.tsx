'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface CalculationTooltipProps {
  metric: 'netProfit' | 'annualizedReturn' | 'breakeven' | 'maxProfit';
  optionType: 'calls' | 'puts';
  className?: string;
}

const CalculationTooltip: React.FC<CalculationTooltipProps> = ({
  metric,
  optionType,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  const getTooltipContent = () => {
    const isCall = optionType === 'calls';

    switch (metric) {
      case 'netProfit':
        return {
          title: isCall ? 'Net Profit (Covered Calls)' : 'Net Profit (Cash-Secured Puts)',
          formula: isCall
            ? 'ITM (if called): net_if_called_CC = ((PK - P0) × 100 + C × 100) - interest_CC\n\nOTM (expires worthless): min_profit_CC = (C × 100) - interest_CC\n\nVariables:\nPK = Strike price per share\nP0 = Current stock price per share\nC = Option premium per share\ninterest_CC = (P0 × 100) × r × (t/365)\nr = Annual interest rate (decimal)\nt = Days to expiration'
            : 'ITM (if assigned): net_if_assigned_CSP = ((ST - PK_put) × 100 + C × 100) - interest_CSP\n\nOTM (expires worthless): min_profit_CSP = (C × 100) - interest_CSP\n\nVariables:\nST = Stock price at expiration\nPK_put = Put strike price per share\nC = Option premium per share\ninterest_CSP = (PK_put × 100) × r × (t/365)\nr = Annual interest rate (decimal)\nt = Days to expiration',
          description: isCall
            ? 'Shows ITM formula if stock price > strike (assignment likely), OTM formula if stock price < strike (expiration likely).'
            : 'Shows ITM formula if stock price < strike (assignment likely), OTM formula if stock price > strike (expiration likely).',
        };

      case 'annualizedReturn':
        return {
          title: 'Annualized Return',
          formula: isCall
            ? 'ITM: ann_ret_called_CC = (net_if_called_CC ÷ B_CC) × (365 ÷ t) × 100\n\nOTM: ann_ret_min_CC = (min_profit_CC ÷ B_CC) × (365 ÷ t) × 100\n\nVariables:\nB_CC = P0 × 100 (borrowed capital)\nP0 = Current stock price per share\nt = Days to expiration\nnet_if_called_CC = Net profit if called\nmin_profit_CC = Minimum profit if expires worthless'
            : 'ITM: ann_ret_assigned_CSP = (net_if_assigned_CSP ÷ B_CSP) × (365 ÷ t) × 100\n\nOTM: ann_ret_min_CSP = (min_profit_CSP ÷ B_CSP) × (365 ÷ t) × 100\n\nVariables:\nB_CSP = PK_put × 100 (cash secured)\nPK_put = Put strike price per share\nt = Days to expiration\nnet_if_assigned_CSP = Net profit if assigned\nmin_profit_CSP = Minimum profit if expires worthless',
          description: isCall
            ? 'Yearly percentage return on borrowed capital. Formula automatically switches based on whether call is ITM (assignment scenario) or OTM (expiration scenario).'
            : 'Yearly percentage return on cash secured. Formula automatically switches based on whether put is ITM (assignment scenario) or OTM (expiration scenario).',
        };

      case 'breakeven':
        return {
          title: 'Breakeven',
          formula: isCall
            ? 'ITM (assignment): breakeven_strike_ITM_CC = P0 + (interest_CC ÷ 100) - C\n\nOTM (expiration): breakeven_price_OTM_CC = P0 - C + (interest_CC ÷ 100)\n\nVariables:\nP0 = Current stock price per share\nC = Option premium per share\ninterest_CC = Interest cost on borrowed capital\n100 = Contract multiplier (shares per contract)'
            : 'ITM (assignment): breakeven_price_ITM_CSP = PK_put - C + (interest_CSP ÷ 100)\n\nOTM (expiration): breakeven_premium_OTM_CSP = PK_put - C\n\nVariables:\nPK_put = Put strike price per share\nC = Option premium per share\ninterest_CSP = Interest cost on cash secured\n100 = Contract multiplier (shares per contract)',
          description: isCall
            ? 'ITM: Minimum strike needed to break even if called. OTM: Stock price needed at expiration to break even without assignment.'
            : 'ITM: Stock price needed at assignment to break even. OTM: Simple premium breakeven (stock must stay above strike - premium).',
        };

      case 'maxProfit':
        return {
          title: 'Maximum Profit',
          formula: isCall
            ? 'Always shows the better outcome between:\n\nITM: net_if_called_CC = ((PK - P0) × 100 + C × 100) - interest_CC\n\nOTM: min_profit_CC = (C × 100) - interest_CC\n\nVariables:\nPK = Strike price per share\nP0 = Current stock price per share\nC = Option premium per share\ninterest_CC = (P0 × 100) × r × (t/365)\nr = Annual interest rate\nt = Days to expiration'
            : 'Always shows OTM scenario (maximum for puts):\n\nmin_profit_CSP = (C × 100) - interest_CSP\n\nVariables:\nC = Option premium per share\ninterest_CSP = (PK_put × 100) × r × (t/365)\nPK_put = Put strike price per share\nr = Annual interest rate\nt = Days to expiration\n\n(Assignment scenario typically yields lower profit due to stock risk)',
          description: isCall
            ? 'Shows the highest possible profit. Usually the ITM scenario if strike > purchase price, otherwise OTM scenario.'
            : 'Shows maximum profit (OTM expiration scenario). Keep premium without assignment risk. ITM assignment involves stock price risk.',
        };

      default:
        return {
          title: 'Calculation',
          formula: 'Formula not available',
          description: 'Description not available',
        };
    }
  };

  const content = getTooltipContent();

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={e => {
          e.stopPropagation(); // Prevent event bubbling to parent table header
          setIsOpen(!isOpen);
        }}
        className={`h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer ${className}`}
        aria-label="Show calculation details"
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-6 left-0 w-80 bg-card border border-border rounded-lg shadow-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="font-semibold text-sm text-foreground">{content.title}</div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2">
            <div className="text-xs">
              <div className="font-medium text-muted-foreground mb-1">Formula:</div>
              <div className="font-mono text-xs bg-muted p-2 rounded text-foreground whitespace-pre-line">
                {content.formula}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">{content.description}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculationTooltip;
