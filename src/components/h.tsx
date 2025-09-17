// 'use client';

// import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// import { Upload, Download, BarChart3, FileText, Loader2, Calculator, TrendingUp, TrendingDown, Search, X } from 'lucide-react';

// import * as XLSX from 'xlsx';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

// interface MarketData {
//   datetime: string;
//   open: string;
//   high: string;
//   low: string;
//   close: string;
// }

// interface ApiResponse {
//   meta: {
//     symbol: string;
//     interval: string;
//     exchange: string;
//   };
//   values: MarketData[];
//   status: string;
// }

// interface VolatilityData {
//   date: string;
//   close: number;
//   lnReturn: number | null;
//   lnSquared: number | null;
// }

// interface GannLevel {
//   degree: number;
//   factor: number;
//   resistance: number;
//   support: number;
//   resistancePrice: number;
//   supportPrice: number;
// }

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

// interface StockSearchResponse {
//   pagination: {
//     limit: number;
//     offset: number;
//     count: number;
//     total: number;
//   };
//   data: StockSearchResult[];
// }

// export default function MarketDataDashboard() {
//   const [selectedAsset, setSelectedAsset] = useState<{type: 'metal' | 'stock', symbol: string, name: string} | null>(null);
//   const [apiData, setApiData] = useState<ApiResponse | null>(null);
//   const [excelData, setExcelData] = useState<MarketData[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
  
//   // Stock search related states
//   const [stockSearchQuery, setStockSearchQuery] = useState('');
//   const [stockSearchResults, setStockSearchResults] = useState<StockSearchResult[]>([]);
//   const [stockSearchLoading, setStockSearchLoading] = useState(false);
//   const [showStockResults, setShowStockResults] = useState(false);
  
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const metals = [
//     { id: 'XAU/USD', name: 'Gold (XAU/USD)' },
//     { id: 'XAG/USD', name: 'Silver (XAG/USD)' },
//     { id: 'XCU/USD', name: 'Copper (XCU/USD)' },
//     { id: 'XPT/USD', name: 'Platinum (XPT/USD)' },
//   ];

//   // Debounced search function
//   const debounceSearch = useCallback(
//     (func: Function, delay: number) => {
//       let timeoutId: NodeJS.Timeout;
//       return (...args: any[]) => {
//         clearTimeout(timeoutId);
//         timeoutId = setTimeout(() => func.apply(null, args), delay);
//       };
//     },
//     []
//   );

//   // Stock search API call
//   const searchStocks = async (query: string) => {
//     if (!query.trim() || query.length < 2) {
//       setStockSearchResults([]);
//       setShowStockResults(false);
//       return;
//     }

//     console.log(query)
//     setStockSearchLoading(true);
//     try {
//       // Replace with your actual stock search API endpoint
//       const response = await fetch(`/api/stock-search?query=${encodeURIComponent(query)}&limit=10`);
      
//       if (!response.ok) {
//         throw new Error('Failed to search stocks');
//       }
      
//       const data: StockSearchResponse = await response.json();
//       setStockSearchResults(data.data || []);
//       setShowStockResults(true);
//     } catch (err) {
//       console.error('Error searching stocks:', err);
//       setStockSearchResults([]);
//       setShowStockResults(false);
//     } finally {
//       setStockSearchLoading(false);
//     }
//   };

//   // Debounced search
//   const debouncedStockSearch = useMemo(
//     () => debounceSearch(searchStocks, 300),
//     [debounceSearch]
//   );

//   // Effect for stock search
//   useEffect(() => {
//     debouncedStockSearch(stockSearchQuery);
//   }, [stockSearchQuery, debouncedStockSearch]);

//   // Calculate volatility and Gann levels
//   const volatilityCalculations = useMemo(() => {
//     const displayedData = apiData?.values || excelData;
//     if (displayedData.length < 2) return null;

//     // Step 1-4: Convert OHLC to numbers and multiply by 1000
//     const processedData: VolatilityData[] = displayedData.map((item, index) => {
//       const close = parseFloat(item.close) * 1000;
//       let lnReturn = null;
//       let lnSquared = null;

//       // Step 5: Calculate LN(Current/Previous) starting from second day
//       if (index > 0) {
//         const prevClose = parseFloat(displayedData[index - 1].close) * 1000;
//         lnReturn = Math.log(close / prevClose);
//         lnSquared = Math.pow(lnReturn, 2); // Step 6
//       }

//       return {
//         date: item.datetime,
//         close,
//         lnReturn,
//         lnSquared
//       };
//     });

//     // Step 7-8: Calculate averages (excluding first row which has null values)
//     const validReturns = processedData.slice(1).map(d => d.lnReturn!);
//     const validSquared = processedData.slice(1).map(d => d.lnSquared!);
    
//     const avgLnReturn = validReturns.reduce((sum, val) => sum + val, 0) / validReturns.length;
//     const avgLnSquared = validSquared.reduce((sum, val) => sum + val, 0) / validSquared.length;

//     // Step 9: Calculate Variance = Average(LN²) - (Average(LN))²
//     const variance = avgLnSquared - Math.pow(avgLnReturn, 2);

//     // Step 10: Calculate Volatility = SQRT(Variance)
//     const volatility = Math.sqrt(variance);

//     // Step 11: Calculate Range = Close Price × Volatility
//     const latestClose = processedData[processedData.length - 1].close;
//     const range = latestClose * volatility;

//     // Step 12: Calculate daily upper and lower limits
//     const upperLimit = latestClose + range;
//     const lowerLimit = latestClose - range;

//     // Step 13-21: Calculate Gann Support and Resistance levels
//     const gannDegrees = [15, 45, 90, 135, 180, 225, 270, 315, 360, 405, 450, 495, 540, 585, 630, 675, 720, 765, 810, 855, 900, 945, 990, 1035, 1080];
    
//     const gannLevels: GannLevel[] = gannDegrees.map(degree => {
//       // Step 15: Calculate Factor = degree/180
//       const factor = degree / 180;
      
//       // Step 16: Calculate Resistance = (SQRT(Range) + Factor)²
//       const resistance = Math.pow(Math.sqrt(range) + factor, 2);
//       const support = Math.pow(Math.sqrt(range) - factor, 2);
      
//       // Step 17: Calculate Price Levels
//       const resistancePrice = latestClose + (factor * resistance);
//       const supportPrice = latestClose - (factor * support);
      
//       return {
//         degree,
//         factor,
//         resistance,
//         support,
//         resistancePrice: resistancePrice / 1000, // Step 20: Divide by 1000 for original form
//         supportPrice: supportPrice / 1000
//       };
//     });

//     return {
//       processedData,
//       avgLnReturn,
//       avgLnSquared,
//       variance,
//       volatility,
//       range,
//       upperLimit: upperLimit / 1000,
//       lowerLimit: lowerLimit / 1000,
//       currentPrice: latestClose / 1000,
//       gannLevels
//     };
//   }, [apiData, excelData]);

//   const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onload = (e) => {
//       try {
//         const data = e.target?.result as ArrayBuffer;
//         const workbook = XLSX.read(data, { type: 'array' });
        
//         // Get first worksheet
//         const worksheetName = workbook.SheetNames[0];
//         const worksheet = workbook.Sheets[worksheetName];
        
//         // Convert to JSON
//         const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
//         if (jsonData.length < 2) {
//           setError('File is empty or has invalid format');
//           return;
//         }
        
//         // Check headers
//         const headers = jsonData[0] as string[];
//         const expectedHeaders = ['date', 'open', 'high', 'low', 'close'];
//         const actualHeaders = headers.map(h => h.trim().toLowerCase());
        
//         const isValidFormat = expectedHeaders.every(header => 
//           actualHeaders.includes(header)
//         );
        
//         if (!isValidFormat) {
//           setError('Invalid Excel format. Please use the provided template.');
//           return;
//         }
        
//         // Parse data
//         const dataRows: MarketData[] = [];
//         for (let i = 1; i < jsonData.length; i++) {
//           const row = jsonData[i] as any[];
//           if (row && row.length >= 5) {
//             // Handle Excel date format
//             let dateValue = row[0];
//             if (typeof dateValue === 'number') {
//               // Convert Excel serial date to JS date
//               const excelEpoch = new Date(1899, 11, 30);
//               const jsDate = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
//               dateValue = jsDate.toISOString().split('T')[0];
//             }
            
//             dataRows.push({
//               datetime: String(dateValue),
//               open: String(row[1]),
//               high: String(row[2]),
//               low: String(row[3]),
//               close: String(row[4])
//             });
//           }
//         }
        
//         if (dataRows.length === 0) {
//           setError('No valid data found in the file');
//           return;
//         }
        
//         setExcelData(dataRows);
//         setApiData(null);
//         setError(null);
//       } catch (err) {
//         console.error('Error parsing Excel file:', err);
//         setError('Error parsing the Excel file. Please check the format.');
//       }
//     };
    
//     reader.readAsArrayBuffer(file);
//   };

//   const handleApiFetch = async () => {
//     if (!selectedAsset) {
//       setError('Please select an asset');
//       return;
//     }

//     setLoading(true);
//     setError(null);
    
//     try {
//       let apiEndpoint = '';
      
//       if (selectedAsset.type === 'metal') {
//         apiEndpoint = `/api/market-data?symbol=${selectedAsset.symbol}`;
//       } else {
//         apiEndpoint = `/api/stock-data?symbol=${selectedAsset.symbol}`;
//       }
      
//       const response = await fetch(apiEndpoint);
      
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || `API error: ${response.status}`);
//       }
      
//       const data = await response.json();
      
//       console.log('API Response:', data);
//       setApiData(data);
//       setExcelData([]);
//     } catch (err) {
//       console.error('Error fetching data:', err);
//       setError(err instanceof Error ? err.message : 'Failed to fetch data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleMetalSelect = (metalId: string) => {
//     const metal = metals.find(m => m.id === metalId);
//     if (metal) {
//       setSelectedAsset({ type: 'metal', symbol: metal.id, name: metal.name });
//     }
//   };

//   const handleStockSelect = (stock: StockSearchResult) => {
//     setSelectedAsset({ 
//       type: 'stock', 
//       symbol: stock.ticker, 
//       name: `${stock.name} (${stock.ticker})` 
//     });
//     setStockSearchQuery(`${stock.name} (${stock.ticker})`);
//     setShowStockResults(false);
//   };

//   const handleClearSelection = () => {
//     setSelectedAsset(null);
//     setStockSearchQuery('');
//     setShowStockResults(false);
//   };

//   const handleDownloadTemplate = () => {
//     const template = `DATE\tOPEN\tHIGH\tLOW\tCLOSE
// 2025-08-19\t4.5425\t4.5565\t4.487\t4.4885
// 2025-08-20\t4.4945\t4.517\t4.4815\t4.5105
// 2025-08-21\t4.504\t4.523\t4.4815\t4.5115
// 2025-08-22\t4.517\t4.5485\t4.497\t4.5275
// 2025-08-24\t4.531\t4.5408\t4.5287\t4.5357
// 2025-08-25\t4.5295\t4.571\t4.5235\t4.5485
// 2025-08-26\t4.5335\t4.5585\t4.5035\t4.533
// 2025-08-27\t4.547\t4.5485\t4.4495\t4.4955
// 2025-08-28\t4.5435\t4.5665\t4.5435\t4.5615
// 2025-08-29\t4.572\t4.611\t4.569\t4.6115`;
    
//     const blob = new Blob([template], { type: 'text/plain' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'market_data_template.txt';
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
//   };

//   const displayedData = apiData?.values || excelData;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 p-6">
//       <div className="max-w-7xl mx-auto">
//         <header className="mb-8">
//           <h1 className="text-3xl font-bold text-slate-800">Market Data Dashboard</h1>
//           <p className="text-slate-600 mt-2">Upload Excel data or select metal/stock to fetch 10-day time series with volatility and Gann analysis</p>
//         </header>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {/* Upload Card */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <Upload className="h-5 w-5" />
//                 Upload Data File
//               </CardTitle>
//               <CardDescription>
//                 Upload your market data in TSV format (tab-separated values)
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="grid w-full max-w-sm items-center gap-1.5">
//                 <Label htmlFor="data-file">Data File (TSV/TXT)</Label>
//                 <Input 
//                   id="data-file" 
//                   type="file" 
//                   accept=".txt,.tsv"
//                   onChange={handleFileUpload}
//                   ref={fileInputRef}
//                 />
//               </div>
//               <div className="text-sm text-slate-500">
//                 <p>Expected format: DATE, OPEN, HIGH, LOW, CLOSE (tab-separated)</p>
//                 <p className="text-xs mt-1">Note: For Excel files, please save as TSV first or use a proper Excel parsing library</p>
//                 <Button 
//                   variant="link" 
//                   className="p-0 h-auto text-blue-500" 
//                   onClick={handleDownloadTemplate}
//                 >
//                   <Download className="h-4 w-4 mr-1" />
//                   Download template
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>

//           {/* API Fetch Card */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <BarChart3 className="h-5 w-5" />
//                 Fetch from API
//               </CardTitle>
//               <CardDescription>
//                 Select metals or search stocks to fetch data from API
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               {/* Metals Dropdown */}
//               <div className="grid w-full items-center gap-1.5">
//                 <Label>Metals</Label>
//                 <Select onValueChange={handleMetalSelect}>
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select metal" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {metals.map((metal) => (
//                       <SelectItem key={metal.id} value={metal.id}>{metal.name}</SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               {/* Stock Search */}
//               <div className="grid w-full items-center gap-1.5">
//                 <Label htmlFor="stock-search">Search Stocks</Label>
//                 <div className="relative">
//                   <div className="relative">
//                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
//                     <Input
//                       id="stock-search"
//                       type="text"
//                       placeholder="Search by company name or ticker..."
//                       value={stockSearchQuery}
//                       onChange={(e) => setStockSearchQuery(e.target.value)}
//                       className="pl-10 pr-10"
//                     />
//                     {stockSearchLoading && (
//                       <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
//                     )}
//                   </div>
                  
//                   {/* Search Results Dropdown */}
//                   {showStockResults && stockSearchResults.length > 0 && (
//                     <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
//                       {stockSearchResults.map((stock, index) => (
//                         <div
//                           key={`${stock.ticker}-${index}`}
//                           className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
//                           onClick={() => handleStockSelect(stock)}
//                         >
//                           <div className="font-medium text-sm">{stock.name}</div>
//                           <div className="text-xs text-gray-500 flex justify-between">
//                             <span>{stock.ticker}</span>
//                             <span>{stock.stock_exchange.acronym}</span>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Selected Asset Display */}
//               {selectedAsset && (
//                 <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-sm font-medium text-blue-900">Selected Asset</p>
//                       <p className="text-sm text-blue-700">{selectedAsset.name}</p>
//                       <p className="text-xs text-blue-600 capitalize">{selectedAsset.type}</p>
//                     </div>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={handleClearSelection}
//                       className="text-blue-600 hover:text-blue-800"
//                     >
//                       <X className="h-4 w-4" />
//                     </Button>
//                   </div>
//                 </div>
//               )}

//               <Button 
//                 className="w-full" 
//                 onClick={handleApiFetch}
//                 disabled={loading || !selectedAsset}
//               >
//                 {loading ? (
//                   <>
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     Fetching Data...
//                   </>
//                 ) : (
//                   "Fetch Data"
//                 )}
//               </Button>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Error Display */}
//         {error && (
//           <Card className="mt-6 border-red-200 bg-red-50">
//             <CardContent className="pt-6">
//               <div className="text-red-700 flex items-center">
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
//                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                 </svg>
//                 {error}
//               </div>
//             </CardContent>
//           </Card>
//         )}

//         {/* Volatility Analysis */}
//         {volatilityCalculations && (
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <Calculator className="h-5 w-5" />
//                   Volatility Analysis
//                 </CardTitle>
//                 <CardDescription>
//                   Statistical calculations based on logarithmic returns
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-4">
//                   <div className="grid grid-cols-2 gap-4 text-sm">
//                     <div>
//                       <p className="text-slate-600">Current Price</p>
//                       <p className="text-lg font-semibold">{volatilityCalculations.currentPrice.toFixed(4)}</p>
//                     </div>
//                     <div>
//                       <p className="text-slate-600">Volatility</p>
//                       <p className="text-lg font-semibold">{(volatilityCalculations.volatility * 100).toFixed(2)}%</p>
//                     </div>
//                     <div>
//                       <p className="text-slate-600">Upper Limit</p>
//                       <p className="text-lg font-semibold text-green-600">{volatilityCalculations.upperLimit.toFixed(4)}</p>
//                     </div>
//                     <div>
//                       <p className="text-slate-600">Lower Limit</p>
//                       <p className="text-lg font-semibold text-red-600">{volatilityCalculations.lowerLimit.toFixed(4)}</p>
//                     </div>
//                     <div>
//                       <p className="text-slate-600">Variance</p>
//                       <p className="text-lg font-semibold">{volatilityCalculations.variance.toFixed(6)}</p>
//                     </div>
//                     <div>
//                       <p className="text-slate-600">Range</p>
//                       <p className="text-lg font-semibold">{(volatilityCalculations.range / 1000).toFixed(4)}</p>
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <TrendingUp className="h-5 w-5" />
//                   Key Gann Levels
//                 </CardTitle>
//                 <CardDescription>
//                   Important support and resistance levels at key degrees
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-2 text-sm">
//                   {volatilityCalculations.gannLevels
//                     .filter(level => [45, 90, 135, 180, 225, 270, 360].includes(level.degree))
//                     .map(level => (
//                     <div key={level.degree} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
//                       <span className="font-medium">{level.degree}°</span>
//                       <div className="flex gap-4">
//                         <span className="text-red-600">S: {level.supportPrice.toFixed(4)}</span>
//                         <span className="text-green-600">R: {level.resistancePrice.toFixed(4)}</span>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         )}

//         {/* Full Gann Levels Table */}
//         {volatilityCalculations && (
//           <Card className="mt-6">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <TrendingDown className="h-5 w-5" />
//                 Complete Gann Support & Resistance Levels
//               </CardTitle>
//               <CardDescription>
//                 Dynamic levels calculated using volatility and Gann degrees methodology
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="rounded-md border max-h-96 overflow-y-auto">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Degree</TableHead>
//                       <TableHead>Factor</TableHead>
//                       <TableHead className="text-red-600">Support</TableHead>
//                       <TableHead className="text-green-600">Resistance</TableHead>
//                       <TableHead>Importance</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {volatilityCalculations.gannLevels.map((level) => (
//                       <TableRow key={level.degree} className={level.degree % 45 === 0 ? "bg-slate-50" : ""}>
//                         <TableCell className="font-medium">{level.degree}°</TableCell>
//                         <TableCell>{level.factor.toFixed(3)}</TableCell>
//                         <TableCell className="text-red-600 font-mono">{level.supportPrice.toFixed(4)}</TableCell>
//                         <TableCell className="text-green-600 font-mono">{level.resistancePrice.toFixed(4)}</TableCell>
//                         <TableCell>
//                           {level.degree % 90 === 0 ? (
//                             <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Critical</span>
//                           ) : level.degree % 45 === 0 ? (
//                             <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Major</span>
//                           ) : level.degree === 360 ? (
//                             <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Cycle</span>
//                           ) : (
//                             <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Minor</span>
//                           )}
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </div>
//             </CardContent>
//           </Card>
//         )}

//         {/* Data Display */}
//         {displayedData.length > 0 && (
//           <Card className="mt-6">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <FileText className="h-5 w-5" />
//                 Market Data
//                 {selectedAsset && (
//                   <span className="text-sm font-normal text-slate-500">
//                     ({selectedAsset.symbol})
//                   </span>
//                 )}
//               </CardTitle>
//               <CardDescription>
//                 {selectedAsset 
//                   ? `Showing API data for ${selectedAsset.name}` 
//                   : "Showing uploaded data"}
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="rounded-md border">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Open</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">High</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Low</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Close</th>
//                       {volatilityCalculations && (
//                         <>
//                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LN Return</th>
//                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LN²</th>
//                         </>
//                       )}
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {displayedData.map((item, index) => {
//                       const volData = volatilityCalculations?.processedData[index];
//                       return (
//                         <tr key={index}>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.datetime}</td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.open}</td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.high}</td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.low}</td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.close}</td>
//                           {volatilityCalculations && (
//                             <>
//                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
//                                 {volData?.lnReturn ? volData.lnReturn.toFixed(6) : '-'}
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
//                                 {volData?.lnSquared ? volData.lnSquared.toFixed(6) : '-'}
//                               </td>
//                             </>
//                           )}
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             </CardContent>
//           </Card>
//         )}
//       </div>
//     </div>
//   );
// }

