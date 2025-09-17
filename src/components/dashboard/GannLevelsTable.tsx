// GannLevelsTable.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface GannLevel {
  degree: number;
  factor: number;
  resistancePrice: number;
  supportPrice: number;
  support:number;
}


interface GannLevelsTableProps {
  gannLevels: GannLevel[];
}

export function GannLevelsTable({ gannLevels }: GannLevelsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Key Gann Levels
        </CardTitle>
        <CardDescription>
          Important support and resistance levels at key degrees.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {gannLevels
            .filter(level => [45, 90, 135, 180, 225, 270, 360].includes(level.degree))
            .map(level => (
              <div key={level.degree} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                <span className="font-medium">{level.degree}°</span>
                <div className="flex gap-4">
                  <span className="text-red-600">S: {level.support.toFixed(4)}</span>
                  <span className="text-green-600">R: {level.resistancePrice.toFixed(4)}</span>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
