'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types for the store
interface ChartData {
  symbol: string;
  data: any[];
  timeRange: string;
  lastFetched: number;
}

interface OptionsData {
  symbol: string;
  data: any[];
  lastFetched: number;
  maxExpirations?: number;
}

interface FilterState {
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

interface TradingState {
  // Current symbol being analyzed
  currentSymbol: string;

  // Chart data cache
  chartDataCache: Record<string, ChartData>;

  // Options data cache
  optionsDataCache: Record<string, OptionsData>;

  // Filter states
  coveredCallsFilters: FilterState;

  // UI states
  isLoading: boolean;
  lastError: string | null;

  // LOC rate for covered calls
  locRate: number;

  // Actions
  setCurrentSymbol: (symbol: string) => void;
  setCacheData: (type: 'chart' | 'options', key: string, data: any, additionalParams?: any) => void;
  getCacheData: (type: 'chart' | 'options', key: string, additionalParams?: any) => any;
  isCacheValid: (
    type: 'chart' | 'options',
    key: string,
    maxAgeMs?: number,
    additionalParams?: any
  ) => boolean;
  setCoveredCallsFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLocRate: (rate: number) => void;
}

const defaultFilters: FilterState = {
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
};

export const useTradingStore = create<TradingState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSymbol: '',
      chartDataCache: {},
      optionsDataCache: {},
      coveredCallsFilters: defaultFilters,
      isLoading: false,
      lastError: null,
      locRate: 3.5, // Default 3.5% LOC rate

      // Actions
      setCurrentSymbol: (symbol: string) => {
        set({ currentSymbol: symbol.toUpperCase() });
      },

      setCacheData: (type, key, data, additionalParams = {}) => {
        const timestamp = Date.now();
        let cacheKey = key.toUpperCase();

        // For chart data, include timeRange in cache key
        if (type === 'chart' && additionalParams.timeRange) {
          cacheKey = `${cacheKey}_${additionalParams.timeRange}`;
        }

        if (type === 'chart') {
          set(state => ({
            chartDataCache: {
              ...state.chartDataCache,
              [cacheKey]: {
                symbol: key.toUpperCase(),
                data,
                timeRange: additionalParams.timeRange || '3M',
                lastFetched: timestamp,
              },
            },
          }));
        } else if (type === 'options') {
          set(state => ({
            optionsDataCache: {
              ...state.optionsDataCache,
              [cacheKey]: {
                symbol: cacheKey,
                data,
                lastFetched: timestamp,
                maxExpirations: additionalParams.maxExpirations,
              },
            },
          }));
        }
      },

      getCacheData: (type, key, additionalParams = {}) => {
        let cacheKey = key.toUpperCase();

        // For chart data, include timeRange in cache key
        if (type === 'chart' && additionalParams.timeRange) {
          cacheKey = `${cacheKey}_${additionalParams.timeRange}`;
        }

        const state = get();

        if (type === 'chart') {
          return state.chartDataCache[cacheKey] || null;
        } else if (type === 'options') {
          return state.optionsDataCache[cacheKey] || null;
        }

        return null;
      },

      isCacheValid: (type, key, maxAgeMs = 5 * 60 * 1000, additionalParams = {}) => {
        // Default 5 minutes
        const cachedData = get().getCacheData(type, key, additionalParams);
        if (!cachedData) return false;

        const now = Date.now();
        const age = now - cachedData.lastFetched;

        return age < maxAgeMs;
      },

      setCoveredCallsFilters: filters => {
        set(state => ({
          coveredCallsFilters: {
            ...state.coveredCallsFilters,
            ...filters,
          },
        }));
      },

      resetFilters: () => {
        set({ coveredCallsFilters: defaultFilters });
      },

      setLoading: loading => {
        set({ isLoading: loading });
      },

      setError: error => {
        set({ lastError: error });
      },

      setLocRate: rate => {
        set({ locRate: rate });
      },
    }),
    {
      name: 'trading-store',
      // Only persist certain parts of the store
      partialize: state => ({
        currentSymbol: state.currentSymbol,
        chartDataCache: state.chartDataCache,
        optionsDataCache: state.optionsDataCache,
        coveredCallsFilters: state.coveredCallsFilters,
        locRate: state.locRate,
      }),
      // Cache expiration - remove old data on hydration
      onRehydrateStorage: () => state => {
        if (state) {
          const now = Date.now();
          const maxAge = 30 * 60 * 1000; // 30 minutes

          // Clean up old chart data
          const validChartCache: Record<string, ChartData> = {};
          Object.entries(state.chartDataCache).forEach(([key, data]) => {
            if (now - data.lastFetched < maxAge) {
              validChartCache[key] = data;
            }
          });
          state.chartDataCache = validChartCache;

          // Clean up old options data
          const validOptionsCache: Record<string, OptionsData> = {};
          Object.entries(state.optionsDataCache).forEach(([key, data]) => {
            if (now - data.lastFetched < maxAge) {
              validOptionsCache[key] = data;
            }
          });
          state.optionsDataCache = validOptionsCache;
        }
      },
    }
  )
);

// Helper hooks for specific use cases
export const useCurrentSymbol = () => useTradingStore(state => state.currentSymbol);
export const useSetCurrentSymbol = () => useTradingStore(state => state.setCurrentSymbol);
export const useCoveredCallsFilters = () => useTradingStore(state => state.coveredCallsFilters);
export const useSetCoveredCallsFilters = () =>
  useTradingStore(state => state.setCoveredCallsFilters);
export const useLocRate = () => useTradingStore(state => state.locRate);
export const useSetLocRate = () => useTradingStore(state => state.setLocRate);
export const useTradingLoading = () => useTradingStore(state => state.isLoading);
export const useTradingError = () => useTradingStore(state => state.lastError);
