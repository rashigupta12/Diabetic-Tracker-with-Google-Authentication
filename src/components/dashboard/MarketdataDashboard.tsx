/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */


// MarketDataDashboard.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingDown } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { DataDisplayTable } from "./DataDisplayTable";
import { GannLevelsTable } from "./GannLevelsTable";
import CombinedDashboard from "./UploadCard"; // Fixed import
import { VolatilityAnalysisCard } from "./VolatilityAnalysisCard";
import {
  ApiResponse,
  GannLevel,
  MarketData,
  SelectedAsset,
  VolatilityData,
} from "@/types/Dashobaord";

const SYMBOL_MAP: Record<string, Record<string, string>> = {
  "Precious Metals": {
    GOLD: "GC=F",       // Gold futures
    SILVER: "SI=F",
    PALLADIUM: "PA=F",
    PLATINUM: "PL=F",
  },
  Commodities: {
    Copper: "HG=F",
    "Crude Oil": "CL=F",
    "Iron Ore": "TIO=F",
    USTECH100: "^NDX",
    Aluminium: "ALI=F",
    Zinc: "ZN=F",
    Nickel: "NI=F",
  },
  Crypto: {
    Bitcoin: "BTC-USD",
    Etherium: "ETH-USD",
    Solana: "SOL-USD",
  },
  Currency: {
    USDJPY: "USDJPY=X",
    GBPUSD: "GBPUSD=X",
    "DOLLAR INDEX": "DX-Y.NYB",
  },
};


export default function MarketDataDashboard() {
  const [selectedAsset, setSelectedAsset] = useState<SelectedAsset | null>(null);
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [excelData, setExcelData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userCMP, setUserCMP] = useState<number | null>(null);
  const [duration, setDuration] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>("09:00");

  const getMultiplier = (price: number): number => {
    const integerPart = Math.floor(price).toString();
    if (integerPart.length >= 4) return 1;
    const zerosToAdd = 4 - integerPart.length;
    return Math.pow(10, zerosToAdd);
  };

  const volatilityCalculations = useMemo(() => {
    let displayedData = apiData?.values || excelData;
    if (displayedData.length < 2) return null;

    if (userCMP !== null) {
      displayedData = [...displayedData];
      const lastIndex = displayedData.length - 1;
      displayedData[lastIndex] = {
        ...displayedData[lastIndex],
        close: userCMP.toString(),
      };
    }

    const basePrice =
      userCMP || parseFloat(displayedData[displayedData.length - 1].close);
    const multiplier = getMultiplier(basePrice);

    const processedData: VolatilityData[] = displayedData.map((item, index) => {
      const close = parseFloat(item.close) * multiplier;
      let lnReturn = null;
      let lnSquared = null;
      if (index > 0) {
        const prevClose =
          parseFloat(displayedData[index - 1].close) * multiplier;
        lnReturn = Math.log(close / prevClose);
        lnSquared = Math.pow(lnReturn, 2);
      }
      return { date: item.datetime, close, lnReturn, lnSquared };
    });

    const validReturns = processedData.slice(1).map((d) => d.lnReturn!);
    const validSquared = processedData.slice(1).map((d) => d.lnSquared!);
    const avgLnReturn =
      validReturns.reduce((sum, val) => sum + val, 0) / validReturns.length;
    const avgLnSquared =
      validSquared.reduce((sum, val) => sum + val, 0) / validSquared.length;

    const variance = avgLnSquared - Math.pow(avgLnReturn, 2);
    const dailyVolatility = Math.sqrt(variance);

    const periodVolatility = dailyVolatility * Math.sqrt(duration);
    const volatilityInPercent = periodVolatility * 100;
    const latestClose = processedData[processedData.length - 1].close;
    const range = Math.round(latestClose * periodVolatility * 10000) / 10000;
    const upperLimit = latestClose + range;
    const lowerLimit = latestClose - range;

    const gannDegrees = [
      15, 30, 45, 60, 75, 90, 135, 150, 180, 225, 270, 315, 360, 405, 450, 495,
      540, 720, 1080,
    ];

    const gannLevels: GannLevel[] = gannDegrees.map((degree) => {
      const factor = degree / 180;
      const resistance = Math.pow(Math.sqrt(range) + factor, 2);
      const supportPrice = (latestClose - factor * resistance) / multiplier;
      const resistancePrice = (latestClose + factor * resistance) / multiplier;
      return {
        degree,
        factor,
        resistance,
        support: supportPrice,
        resistancePrice,
        supportPrice,
      };
    });

   return {
  processedData,
  avgLnReturn,
  avgLnSquared,
  variance,
  dailyVolatility,
  periodVolatility,
  volatility: periodVolatility,
  volatilityInPercent,
  range,
  upperLimit: upperLimit / multiplier,
  lowerLimit: lowerLimit / multiplier,
  currentPrice: latestClose / multiplier,
  gannLevels,
};
  }, [apiData, excelData, userCMP, duration]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(data, { type: "array" });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (jsonData.length < 2) {
          setError("File is empty or has invalid format");
          return;
        }
        const headers = jsonData[0] as string[];
        const expectedHeaders = ["date", "open", "high", "low", "close"];
        const actualHeaders = headers.map((h) => h.trim().toLowerCase());
        const isValidFormat = expectedHeaders.every((header) =>
          actualHeaders.includes(header)
        );
        if (!isValidFormat) {
          setError("Invalid Excel format. Please use the provided template.");
          return;
        }
        const dataRows: MarketData[] = [];

        const excelDateToJSDate = (serial: number) => {
          const excelEpoch = new Date(1900, 0, 1);
          const jsDate = new Date(excelEpoch.getTime() + serial * 86400000);

          if (serial > 60) {
            jsDate.setDate(jsDate.getDate() - 2);
          } else {
            jsDate.setDate(jsDate.getDate() - 1);
          }

          return jsDate;
        };

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (row && row.length >= 5) {
            let dateValue = row[0];

            if (typeof dateValue === "number") {
              const jsDate = excelDateToJSDate(dateValue);
              const day = String(jsDate.getDate()).padStart(2, "0");
              const month = String(jsDate.getMonth() + 1).padStart(2, "0");
              const year = jsDate.getFullYear();
              dateValue = `${day}-${month}-${year}`;
            } else if (typeof dateValue === "string") {
              if (dateValue.match(/^\d{4}-\d{2}-\d{2}/)) {
                const parts = dateValue.split(/[-T]/);
                if (parts.length >= 3) {
                  const [year, month, day] = parts;
                  dateValue = `${day}-${month}-${year}`;
                }
              } else if (dateValue.includes("/")) {
                try {
                  const tempDate = new Date(dateValue);
                  if (!isNaN(tempDate.getTime())) {
                    const day = String(tempDate.getDate()).padStart(2, "0");
                    const month = String(tempDate.getMonth() + 1).padStart(
                      2,
                      "0"
                    );
                    const year = tempDate.getFullYear();
                    dateValue = `${day}-${month}-${year}`;
                  }
                } catch (e) {
                  // Keep original if parsing fails
                }
              }
            }

            dataRows.push({
              date: String(dateValue),
              open: String(row[1]),
              high: String(row[2]),
              low: String(row[3]),
              close: String(row[4]),
              volume: String(row[5] || row[4]),
              datetime:String(dateValue),
            });
          }
        }

        if (dataRows.length === 0) {
          setError("No valid data found in the file");
          return;
        }
        setExcelData(dataRows);
        setApiData(null);
        setError(null);
      } catch (err) {
        console.error("Error parsing Excel file:", err);
        setError("Error parsing the Excel file. Please check the format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

const handleApiFetch = async (category: string, item: string) => {
  console.log("market dashboard - API fetch:", category, item);
  if (!category || !item) {
    setError("Please select a category and item");
    return;
  }

  setLoading(true);
  setError(null);

  try {
    // Map category + item to actual ticker symbol
    const symbol = SYMBOL_MAP[category]?.[item] || item;

    const token = process.env.NEXT_PUBLIC_APIFY_TOKEN;
    const actId = "lujI4mrby2M9OV868"; // your Apify actor ID

    // 1️⃣ Trigger a new run
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${actId}/runs?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers: [symbol] }), // input for your actor
      }
    );

    if (!runResponse.ok) {
      throw new Error(`Run failed: ${runResponse.status}`);
    }

    const runData = await runResponse.json();
    const datasetId = runData.data.defaultDatasetId;

    // 2️⃣ Wait for run to finish (polling loop)
    let runStatus = runData.data.status;
    const runId = runData.data.id;

    while (runStatus !== "SUCCEEDED" && runStatus !== "FAILED") {
      await new Promise((r) => setTimeout(r, 3000)); // wait 3s
      const statusRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${token}`
      );
      const statusData = await statusRes.json();
      runStatus = statusData.data.status;
    }

    if (runStatus === "FAILED") {
      throw new Error("Actor run failed");
    }

    // 3️⃣ Fetch dataset items
    const datasetRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`
    );

    if (!datasetRes.ok) {
      throw new Error(`Dataset fetch failed: ${datasetRes.status}`);
    }

    const datasetItems = await datasetRes.json();
    const tickerData = datasetItems.find((d: any) => d.ticker === symbol);

    if (!tickerData) {
      throw new Error(`No data found for ${symbol}`);
    }

   // 4️⃣ Extract OHLC history
const history = tickerData.history?.data || [];

// Determine whether to include today based on current time
const now = new Date();
const sixPm = new Date();
sixPm.setHours(18, 0, 0, 0); // 6:00 PM today

let filteredHistory = history;

// If before 6 PM, exclude today (last item if its date is today)
if (now < sixPm && history.length > 0) {
  const lastItem = history[history.length - 1];
  const lastItemDate = new Date(lastItem.date); // make sure your date field is correct
  const isToday =
    lastItemDate.getFullYear() === now.getFullYear() &&
    lastItemDate.getMonth() === now.getMonth() &&
    lastItemDate.getDate() === now.getDate();

  if (isToday) {
    filteredHistory = history.slice(0, -1); // exclude today
  }
}

const last10 = filteredHistory.slice(-10);
const last30 = filteredHistory.slice(-30);

const cleaned = {
  ticker: symbol,
  latestPrice: tickerData.price_info?.current_price,
  last10Days: last10,
  last30Days: last30,
};

console.log("cleaned", cleaned);

// ✅ Create ApiResponse object for state
const apiResponse: ApiResponse = {
  meta: {
    symbol,
    interval: "1d",      // or whatever your actor provides
    exchange: "Apify",   // you can replace with real exchange if available
  },
  values: cleaned.last10Days,
  status: "success",
};

setApiData(apiResponse);
setExcelData([]);

  } catch (err) {
    console.error("Error fetching data:", err);
    setError(err instanceof Error ? err.message : "Failed to fetch data");
  } finally {
    setLoading(false);
  }
};


  // This function will be called when the child component triggers a category fetch
  const handleCategoryFetchFromChild = (asset?: SelectedAsset) => {
    console.log("market dashboard - handleCategoryFetchFromChild called with asset:", asset);
    
    // Use the passed asset or fall back to selectedAsset state
    const targetAsset = asset || selectedAsset;
    
    if (targetAsset && targetAsset.type === 'category') {
      // Extract category and item from the asset name
      const [category, item] = targetAsset.name.split(' - ');
      console.log("market dashboard - extracted from targetAsset:", category, item);
      handleApiFetch(category, item);
    } else {
      console.log("market dashboard - no valid selectedAsset for category fetch, targetAsset:", targetAsset);
      setError("Please select a category and item");
    }
  };

  const handleAssetChange = (asset: SelectedAsset | null) => {
    console.log("market dashboard - asset changed:", asset);
    setSelectedAsset(asset);
    if (asset && asset.type === 'stock') {
      handleApiFetch('Stock', asset.symbol);
    }
  };

  const handleDownloadTemplate = () => {
    const data = [["DATE", "OPEN", "HIGH", "LOW", "CLOSE"]];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Market Data");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "market_data_template.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const displayedData = apiData?.values || excelData;

const handlePrint = () => {
  const printContent = document.getElementById('printable-content');
  const originalContents = document.body.innerHTML;
  
  if (printContent) {
    // Create a print-specific version
    const printContents = printContent.innerHTML;
    
    // Create a print window with only the content we want
    document.body.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
          <h1>Market Analysis Report</h1>
          <p>${selectedAsset ? `Category: ${selectedAsset.type === 'category' ? selectedAsset.name.split(' - ')[0] : 'Stock'}, Item: ${selectedAsset.name}` : 'No asset selected'}</p>
          <p>Date: ${selectedDate} | Time: ${selectedTime}</p>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        ${printContents}
      </div>
    `;
    
    window.print();
    
    // Restore original content
    document.body.innerHTML = originalContents;
    
    // Ensure the page is reloaded properly after printing
    window.location.reload();
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 p-6 py-2">
      <div className="max-w-7xl mx-auto">
        <CombinedDashboard
          onFileUpload={handleFileUpload}
          onDownloadTemplate={handleDownloadTemplate}
          fileInputRef={fileInputRef}
          selectedAsset={selectedAsset}
          onAssetChange={handleAssetChange}
          onFetchData={handleCategoryFetchFromChild} // Use the new function
          loading={loading}
          userCMP={userCMP}
          onCMPChange={setUserCMP}
          duration={duration}
          onDurationChange={setDuration}
          onUploadClick={handleUploadClick}
          onPrint={handlePrint}
        />

        {error && (
          <Card className="mt-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-red-700 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            </CardContent>
          </Card>
        )}


<div id="printable-content">
        {displayedData.length > 0 && (
          <div className="mt-6">
            <DataDisplayTable
  data={displayedData}
  volatilityData={volatilityCalculations?.processedData || null}
  source={
    apiData
      ? `Showing API data for ${selectedAsset?.symbol || 'selected item'}`
      : "Showing uploaded data"
  }
/>

          </div>
        )}

        

        {volatilityCalculations && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <VolatilityAnalysisCard data={volatilityCalculations} />
            <GannLevelsTable gannLevels={volatilityCalculations.gannLevels} />
          </div>
        )}

        {volatilityCalculations && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Complete Gann Support & Resistance Levels
                </CardTitle>
                <CardDescription>
                  Dynamic levels calculated using volatility and Gann degrees methodology
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Degree</TableHead>
                        <TableHead>Factor</TableHead>
                        <TableHead className="text-red-600">Support</TableHead>
                        <TableHead className="text-green-600">
                          Resistance
                        </TableHead>
                        <TableHead>Importance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {volatilityCalculations.gannLevels.map((level) => (
                        <TableRow
                          key={level.degree}
                          className={
                            level.degree % 45 === 0 ? "bg-slate-50" : ""
                          }
                        >
                          <TableCell className="font-medium">
                            {level.degree}°
                          </TableCell>
                          <TableCell>{level.factor.toFixed(3)}</TableCell>
                          <TableCell className="text-red-600 font-mono">
                            {level.support.toFixed(4)}
                          </TableCell>
                          <TableCell className="text-green-600 font-mono">
                            {level.resistancePrice.toFixed(4)}
                          </TableCell>
                          <TableCell>
                            {level.degree % 90 === 0 ? (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                Critical
                              </span>
                            ) : level.degree % 45 === 0 ? (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                Major
                              </span>
                            ) : level.degree === 360 ? (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                Cycle
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                Minor
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}