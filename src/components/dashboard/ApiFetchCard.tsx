/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart3, Loader2, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface Metal {
  id: string;
  name: string;
}

interface StockSearchResult {
  name: string;
  ticker: string;
  has_intraday: boolean;
  has_eod: boolean;
  stock_exchange: {
    name: string;
    acronym: string;
    mic: string;
  };
}

interface StockSearchResponse {
  pagination: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
  data: StockSearchResult[];
}

interface SelectedAsset {
  type: 'metal' | 'stock';
  symbol: string;
  name: string;
}

interface ApiFetchCardProps {
  selectedAsset: SelectedAsset | null;
  onAssetChange: (asset: SelectedAsset | null) => void;
  onFetchData: () => void;
  loading: boolean;
  metals: Metal[];
}

export function ApiFetchCard({ 
  selectedAsset, 
  onAssetChange, 
  onFetchData, 
  loading, 
  
}: ApiFetchCardProps) {
  // Stock search related states
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockSearchResults, setStockSearchResults] = useState<StockSearchResult[]>([]);
  const [stockSearchLoading, setStockSearchLoading] = useState(false);
  const [showStockResults, setShowStockResults] = useState(false);

  // Debounced search function
const debounceSearch = useCallback(
  (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },
  []
);

  // Stock search API call
  const searchStocks = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setStockSearchResults([]);
      setShowStockResults(false);
      return;
    }

    setStockSearchLoading(true);
    try {
      const response = await fetch(`/api/stock-search?query=${encodeURIComponent(query)}&limit=10`);
      
      if (!response.ok) {
        throw new Error('Failed to search stocks');
      }
      
      const data: StockSearchResponse = await response.json();
      setStockSearchResults(data.data || []);
      setShowStockResults(true);
    } catch (err) {
      console.error('Error searching stocks:', err);
      setStockSearchResults([]);
      setShowStockResults(false);
    } finally {
      setStockSearchLoading(false);
    }
  };

  // Debounced search
  const debouncedStockSearch = useMemo(
    () => debounceSearch(searchStocks, 300),
    [debounceSearch]
  );

  // Effect for stock search
  useEffect(() => {
    debouncedStockSearch(stockSearchQuery);
  }, [stockSearchQuery, debouncedStockSearch]);

  // Handle metal selection
  // const handleMetalSelect = (metalId: string) => {
  //   const metal = metals.find(m => m.id === metalId);
  //   if (metal) {
  //     const asset: SelectedAsset = { 
  //       type: 'metal', 
  //       symbol: metal.id, 
  //       name: metal.name 
  //     };
  //     onAssetChange(asset);
  //     // Clear stock search when metal is selected
  //     setStockSearchQuery('');
  //     setShowStockResults(false);
  //   }
  // };

  // Handle stock selection
  const handleStockSelect = (stock: StockSearchResult) => {
    const asset: SelectedAsset = { 
      type: 'stock', 
      symbol: stock.ticker, 
      name: `${stock.name} (${stock.ticker})` 
    };
    onAssetChange(asset);
    setStockSearchQuery(`${stock.name} (${stock.ticker})`);
    setShowStockResults(false);
  };

  // Handle clear selection
  // const handleClearSelection = () => {
  //   onAssetChange(null);
  //   setStockSearchQuery('');
  //   setShowStockResults(false);
  // };

  // Update search query when selected asset changes externally
  useEffect(() => {
    if (selectedAsset?.type === 'stock') {
      setStockSearchQuery(selectedAsset.name);
    } else if (selectedAsset?.type === 'metal') {
      setStockSearchQuery('');
    } else if (!selectedAsset) {
      setStockSearchQuery('');
    }
  }, [selectedAsset]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Fetch from API
        </CardTitle>
        <CardDescription>
          Select search stocks to fetch data from API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metals Dropdown */}
        {/* <div className="grid w-full items-center gap-1.5">
          <Label>Metals</Label>
          <Select 
            value={selectedAsset?.type === 'metal' ? selectedAsset.symbol : ''} 
            onValueChange={handleMetalSelect}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select metal" />
            </SelectTrigger>
            <SelectContent>
              {metals.map((metal) => (
                <SelectItem key={metal.id} value={metal.id}>
                  {metal.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div> */}

        {/* Stock Search */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="stock-search">Search Stocks</Label>
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="stock-search"
                type="text"
                placeholder="Search by company name or ticker..."
                value={stockSearchQuery}
                onChange={(e) => setStockSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {stockSearchLoading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {showStockResults && stockSearchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {stockSearchResults.map((stock, index) => (
                  <div
                    key={`${stock.ticker}-${index}`}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => handleStockSelect(stock)}
                  >
                    <div className="font-medium text-sm">{stock.name}</div>
                    <div className="text-xs text-gray-500 flex justify-between">
                      <span>{stock.ticker}</span>
                      <span>{stock.stock_exchange.acronym}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Asset Display */}
        {/* {selectedAsset && (
          <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Selected Asset</p>
                <p className="text-sm text-blue-700">{selectedAsset.name}</p>
                <p className="text-xs text-blue-600 capitalize">{selectedAsset.type}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )} */}

        {/* Fetch Button */}
        <Button 
          className="w-full" 
          onClick={onFetchData}
          disabled={loading || !selectedAsset || !onFetchData}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fetching Data...
            </>
          ) : (
            "Fetch Data"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}