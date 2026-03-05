import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/utils/responsiveUtils';

interface ColumnConfig {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  mobileHidden?: boolean;
  mobileLabel?: string;
}

interface MobileAwareTableProps {
  data: any[];
  columns: ColumnConfig[];
  onRowClick?: (row: any) => void;
  className?: string;
  emptyMessage?: string;
  cardTitle?: (row: any) => string;
  cardDescription?: (row: any) => string;
  cardBadges?: (row: any) => Array<{ label: string; variant?: 'default' | 'secondary' | 'outline' | 'destructive' }>;
}

export const MobileAwareTable: React.FC<MobileAwareTableProps> = ({
  data,
  columns,
  onRowClick,
  className,
  emptyMessage = "No data available",
  cardTitle,
  cardDescription,
  cardBadges
}) => {
  const { isMobile } = useBreakpoint();

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div className={cn('space-y-3', className)}>
        {data.map((row, index) => (
          <Card 
            key={index} 
            className={cn(
              'transition-colors',
              onRowClick && 'cursor-pointer hover:bg-muted/50'
            )}
            onClick={() => onRowClick?.(row)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base line-clamp-2">
                    {cardTitle ? cardTitle(row) : row[columns[0]?.key] || 'Item'}
                  </CardTitle>
                  {cardDescription && (
                    <CardDescription className="text-sm mt-1 line-clamp-2">
                      {cardDescription(row)}
                    </CardDescription>
                  )}
                </div>
                {cardBadges && (
                  <div className="flex flex-wrap gap-1">
                    {cardBadges(row).map((badge, badgeIndex) => (
                      <Badge 
                        key={badgeIndex} 
                        variant={badge.variant || 'secondary'}
                        className="text-xs"
                      >
                        {badge.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {columns
                  .filter(col => !col.mobileHidden)
                  .map((column) => {
                    const value = row[column.key];
                    const displayValue = column.render ? column.render(value, row) : value;
                    
                    if (!displayValue && displayValue !== 0) return null;
                    
                    return (
                      <div key={column.key} className="flex justify-between items-center gap-2">
                        <span className="text-sm text-muted-foreground flex-shrink-0">
                          {column.mobileLabel || column.label}:
                        </span>
                        <div className="text-sm font-medium text-right min-w-0 flex-1">
                          {displayValue}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className={cn('rounded-md border', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow 
              key={index}
              className={cn(
                onRowClick && 'cursor-pointer hover:bg-muted/50'
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => {
                const value = row[column.key];
                const displayValue = column.render ? column.render(value, row) : value;
                
                return (
                  <TableCell key={column.key}>
                    {displayValue}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};