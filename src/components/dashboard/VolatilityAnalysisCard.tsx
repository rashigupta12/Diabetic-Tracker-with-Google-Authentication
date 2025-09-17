// VolatilityAnalysisCard.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator } from 'lucide-react';

interface VolatilityData {
  currentPrice: number;
  volatility: number;
  upperLimit: number;
  lowerLimit: number;
  variance: number;
  range: number;
}

interface VolatilityAnalysisCardProps {
  data: VolatilityData;
}

export function VolatilityAnalysisCard({ data }: VolatilityAnalysisCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Volatility Analysis
        </CardTitle>
        <CardDescription>
          Statistical calculations based on logarithmic returns.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-600">Current Price</p>
              <p className="text-lg font-semibold">{data.currentPrice}</p>
            </div>
            <div>
              <p className="text-slate-600">Volatility(%)</p>
              <p className="text-lg font-semibold">{((data.volatility)*100).toFixed(4)}</p>
            </div>
            <div>
              <p className="text-slate-600">Upper Limit</p>
              <p className="text-lg font-semibold text-green-600">{((data.upperLimit)).toFixed(4)}</p>
            </div>
            <div>
              <p className="text-slate-600">Lower Limit</p>
              <p className="text-lg font-semibold text-red-600">{((data.lowerLimit)).toFixed(4)}</p>
            </div>
            <div>
              <p className="text-slate-600">Variance</p>
              <p className="text-lg font-semibold">{((data.variance)*100000).toFixed(4)}</p>
            </div>
            <div>
              <p className="text-slate-600">Range</p>
              <p className="text-lg font-semibold">{(data.range)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}