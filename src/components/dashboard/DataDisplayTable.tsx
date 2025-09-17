// DataDisplayTable.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ArrowUpDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface MarketData {
  date: string;
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string
}

interface VolatilityData {
  date: string;
  close: number;
  lnReturn: number | null;
  lnSquared: number | null;
}

interface DataDisplayTableProps {
  data: MarketData[];
  volatilityData: VolatilityData[] | null;
  source: string;
}

export function DataDisplayTable({ data,  source }: DataDisplayTableProps) {
  console.log(data)
  const [sortConfig, setSortConfig] = useState<{ key: keyof MarketData; direction: 'ascending' | 'descending' } | null>(null);

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    // Convert to number if possible
    const aNum = parseFloat(aValue);
    const bNum = parseFloat(bValue);

    if (!isNaN(aNum) && !isNaN(bNum)) {
      return sortConfig.direction === 'ascending' ? aNum - bNum : bNum - aNum;
    }

    // Fallback string comparison
    if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
    return 0;
  });

  const requestSort = (key: keyof MarketData) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof MarketData) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };

  // Utility: returns CSS class based on value change
  const getFluctuationClass = (current: string, previous?: string) => {
    if (!previous) return '';
    const curr = parseFloat(current);
    const prev = parseFloat(previous);
    if (isNaN(curr) || isNaN(prev)) return '';

    if (curr > prev) return 'text-green-600 font-medium';
    if (curr < prev) return 'text-red-600 font-medium';
    return '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Market Data
        </CardTitle>
        <CardDescription>
          {source}
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2.5'>
        <div className="rounded-md  max-h-96 overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-gray-50">
              <TableRow>
                {['datetime', 'open', 'high', 'low', 'close'].map((header) => (
                  <TableHead
                    key={header}
                    className="cursor-pointer select-none"
                    onClick={() => requestSort(header as keyof MarketData)}
                  >
                    <div className="flex items-center gap-1">
                      {header.charAt(0).toUpperCase() + header.slice(1)}{' '}
                      <ArrowUpDown className="h-3 w-3" />
                      {getSortIcon(header as keyof MarketData)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item, index) => {
                const prevRow = index > 0 ? sortedData[index - 1] : undefined;

                return (
                  <TableRow key={index}>
{/* 
<TableCell>
  {(() => {
    const dateStr = item?.datetime || "";

    if (!dateStr) return "-"; // fallback if missing

    // If already in dd-mm-yyyy format, return as is
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      return dateStr;
    }

    // Handle ISO (with T inside)
    if (dateStr.includes("T")) {
      const dateObj = new Date(dateStr);
      if (!isNaN(dateObj.getTime())) {
        const day = String(dateObj.getDate()).padStart(2, "0");
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const year = dateObj.getFullYear();
        return `${day}-${month}-${year}`;
      }
    }

    // Fallback
    return dateStr;
  })()}
</TableCell> */}

<TableCell > {item.date}</TableCell>


                    <TableCell className={getFluctuationClass(item.open, prevRow?.open)}>{item.open}</TableCell>
                    <TableCell className={getFluctuationClass(item.high, prevRow?.high)}>{item.high}</TableCell>
                    <TableCell className={getFluctuationClass(item.low, prevRow?.low)}>{item.low}</TableCell>
                    <TableCell className={getFluctuationClass(item.close, prevRow?.close)}>{item.close}</TableCell>
                    {/* <TableCell className={getFluctuationClass(item.volume, prevRow?.volume)}>{item.volume}</TableCell> */}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
