import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BarChart3,
  Download,
  Loader2,
  TrendingUp,
  Upload
} from 'lucide-react';
import React, { useState } from 'react';

// Define categories and their items
const CATEGORIES = {
  Commodities: [
    "Copper", "Crude Oil", "Iron Ore", "USTECH100", "BRONZE",
    "Aluminium", "Zinc", "Lead", "Steel Rebar", "Nickel"
  ],
  "Precious Metals": [
    "GOLD", "SILVER", "PALLADIUM", "PLATINUM"
  ],
  Crypto: [
    "Bitcoin", "Etherium", "Solana"
  ],
  Currency: [
    "USDJPY", "GBPUSD", "DOLLAR INDEX"
  ],
  // "Stocks - NYSE": [],
  // "Stocks - NSE/BSE": []
};

// interface StockSearchResult {
//   name: string;
//   ticker: string;
//   has_intraday: boolean;
//   has_eod: boolean;
//   stock_exchange: {
//     name: string;
//     acronym: string;
//     mic: string;
//   };
// }



interface SelectedAsset {
  type: 'metal' | 'stock' | 'category';
  symbol: string;
  name: string;
}

interface CombinedDashboardProps {
  selectedAsset?: SelectedAsset | null;
  onAssetChange?: (asset: SelectedAsset | null) => void;
  onFetchData?: (asset?: SelectedAsset) => void; // Updated to accept optional asset parameter
  onFileUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate?: () => void;
  onUploadClick?: () => void;
  loading?: boolean;
  userCMP?: number | null;
  onCMPChange?: (cmp: number | null) => void;
  duration?: number;
  onDurationChange?: (duration: number) => void;
  fileInputRef?: React.RefObject<HTMLInputElement | null>; // Allow null
  onPrint?: () => void;
}

export default function CombinedDashboard({
  selectedAsset,
  onAssetChange = () => {},
  onFetchData = () => {}, // Category fetch function
  onFileUpload = () => {},
  onDownloadTemplate = () => {},
  onUploadClick = () => {},
  loading = false,
  userCMP,
  onCMPChange = () => {},
  duration = 1,
  onDurationChange = () => {},
  fileInputRef,
   onPrint = () => {}
}: CombinedDashboardProps) {
  // Category selection states
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<string>("");
  
  // Stock search states
  // const [stockSearchQuery, setStockSearchQuery] = useState('');
  // const [stockSearchResults, setStockSearchResults] = useState<StockSearchResult[]>([]);
  // const [stockSearchLoading, setStockSearchLoading] = useState(false);
  // const [showStockResults, setShowStockResults] = useState(false);

  
  // Current date and time (display only)
  // const currentDateTime = new Date();
  // const currentDate = currentDateTime.toLocaleDateString('en-GB');
  // const currentTime = currentDateTime.toLocaleTimeString('en-GB', { 
  //   hour12: false, 
  //   hour: '2-digit', 
  //   minute: '2-digit' 
  // });

  // Debounced search function
  // const debounceSearch = useCallback(
  //   (func: Function, delay: number) => {
  //     let timeoutId: NodeJS.Timeout;
  //     return (...args: any[]) => {
  //       clearTimeout(timeoutId);
  //       timeoutId = setTimeout(() => func(...args), delay);
  //     };
  //   },
  //   []
  // );

  // Stock search API call
  // const searchStocks = async (query: string) => {
  //   if (!query.trim() || query.length < 2) {
  //     setStockSearchResults([]);
  //     setShowStockResults(false);
  //     return;
  //   }

  //   setStockSearchLoading(true);
  //   try {
  //     // Simulate API call - replace with actual endpoint
  //     const response = await fetch(`/api/stock-search?query=${encodeURIComponent(query)}&limit=10`);
      
  //     if (response.ok) {
  //       const data: StockSearchResponse = await response.json();
  //       setStockSearchResults(data.data || []);
  //       setShowStockResults(true);
  //     } else {
  //       setStockSearchResults([]);
  //       setShowStockResults(false);
  //     }
  //   } catch (err) {
  //     console.error('Error searching stocks:', err);
  //     setStockSearchResults([]);
  //     setShowStockResults(false);
  //   } finally {
  //     setStockSearchLoading(false);
  //   }
  // };

  // Debounced search
  // const debouncedStockSearch = useMemo(
  //   () => debounceSearch(searchStocks, 300),
  //   [debounceSearch]
  // );

  // Effect for stock search
  // useEffect(() => {
  //   debouncedStockSearch(stockSearchQuery);
  // }, [stockSearchQuery, debouncedStockSearch]);

  // Handle stock selection
  //  const handleStockSelect = (stock: StockSearchResult) => {
  //   const asset: SelectedAsset = { 
  //     type: 'stock', 
  //     symbol: stock.ticker, 
  //     name: `${stock.name} (${stock.ticker})` 
  //   };
  //   onAssetChange(asset);
  //   setStockSearchQuery(`${stock.name} (${stock.ticker})`);
  //   setShowStockResults(false);
  // };

   const handleCategoryFetch = () => {
    console.log("upload card component ", selectedCategory, selectedItem);
    
    if (!selectedCategory || !selectedItem) {
      alert("Please select a category and item");
      return;
    }
    
    const asset: SelectedAsset = {
      type: 'category',
      symbol: selectedItem,
      name: `${selectedCategory} - ${selectedItem}`
    };
    
    // Update the asset first
    onAssetChange(asset);
    
    // Then call the fetch function with the asset passed directly
    onFetchData(asset);
  };



 return (
  <div className="w-full max-w-7xl mx-auto space-y-4">

    {/* Header */}
    <header className="text-center">
      <h1 className="text-2xl font-bold text-slate-800">
        Futuretek Institute of Astrological Sciences
      </h1>
      <p className="text-slate-500 text-sm">
       Time period Projections 
      </p>
    </header>

    {/* Selection & Search Section */}
    <section className="bg-white rounded-lg shadow-sm p-6 space-y-5">

      {/* Category + Instrument */}
       <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Select Asset</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setSelectedItem(""); }}
            className="p-2.5 text-sm border border-slate-200 rounded-md w-full"
          >
            <option value="">Category</option>
            {Object.keys(CATEGORIES).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            disabled={!selectedCategory}
            className="p-2.5 text-sm border border-slate-200 rounded-md w-full"
          >
            <option value="">Instrument</option>
            {CATEGORIES[selectedCategory as keyof typeof CATEGORIES]?.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <Button
            onClick={handleCategoryFetch} // Use the local function
            disabled={loading || !selectedCategory || !selectedItem}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm w-full"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TrendingUp className="h-4 w-4 mr-2" />}
            Fetch Data
          </Button>
        </div>
      </div>

      {/* Stock Search */}
      {/* <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Or Search Stock</h2>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            value={stockSearchQuery}
            onChange={(e) => setStockSearchQuery(e.target.value)}
            placeholder="Company name or ticker..."
            className="pl-10 pr-10 text-sm"
          />
          {stockSearchLoading && (
            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-blue-500" />
          )}
        </div>

        {showStockResults && stockSearchResults.length > 0 && (
          <div className="mt-2 border border-slate-200 rounded-md shadow-sm bg-white max-h-48 overflow-y-auto">
            {stockSearchResults.map((stock) => (
              <div
                key={stock.ticker}
                onClick={() => handleStockSelect(stock)}
                className="px-4 py-2 text-sm hover:bg-blue-50 cursor-pointer flex justify-between border-b last:border-b-0"
              >
                <span>{stock.name}</span>
                <span className="text-slate-400">{stock.ticker}</span>
              </div>
            ))}
          </div>
        )}
      </div> */}
    </section>

    {/* Upload/Download & Parameters */}
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* Left: Upload */}
      <div className="bg-white rounded-lg shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Data Management</h2>
  <div className="flex gap-3">
            <Button variant="outline" onClick={onUploadClick} className="flex-1 text-sm">
              <Upload className="h-4 w-4 mr-2" /> Upload
            </Button>
            <Button variant="outline" onClick={onDownloadTemplate} className="flex-1 text-sm">
              <Download className="h-4 w-4 mr-2" /> Template
            </Button>
          </div>
       <Input ref={fileInputRef} type="file" accept=".csv,.xlsx" onChange={onFileUpload} className="hidden" />
      </div>

      {/* Right: Parameters */}
      <div className="bg-white rounded-lg shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Analysis Parameters</h2>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={duration}
            onChange={(e) => onDurationChange(Number(e.target.value))}
            className="p-2 text-sm border border-slate-200 rounded-md"
          >
            {[1, 2, 3, 7, 30, 60, 90, 180].map(d => (
              <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>
            ))}
          </select>
          <Input
            type="number"
            step="0.0001"
            value={userCMP ?? ""}
            onChange={(e) => onCMPChange(e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="Enter CMP"
            className="text-sm border border-slate-200"
          />
        </div>
      </div>
    </section>

    {/* Actions */}
    <section className="flex gap-3">
      <Button onClick={() => onFetchData()} disabled={loading || !selectedAsset} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
        <BarChart3 className="h-4 w-4 mr-2" /> Analyze
      </Button>
      <Button onClick={onPrint} variant="outline" className="text-sm">
        Print Report
      </Button>
    </section>

    {/* Footer Info */}
    <footer className="text-xs text-slate-500 flex justify-between border-t pt-3">
      <span>Pro Tip: Upload CSV/Excel files or search live data</span>
      <span>Powered by Advanced Gann Analysis</span>
    </footer>

  </div>
)

}