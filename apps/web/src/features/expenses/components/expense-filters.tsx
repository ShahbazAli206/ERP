'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useExpenseCategories } from '../hooks';

const ALL = '__all__';

export function ExpenseFilters({
  categoryId,
  onCategoryChange,
  from,
  onFromChange,
  to,
  onToChange,
}: {
  categoryId: string;
  onCategoryChange: (value: string) => void;
  from: string;
  onFromChange: (value: string) => void;
  to: string;
  onToChange: (value: string) => void;
}) {
  const categoriesQuery = useExpenseCategories();

  // `items` is required, not cosmetic — Base UI's <Select.Value> uses it to resolve the
  // closed-trigger label; without it the trigger falls back to the raw stored value once
  // the popup (and its <SelectItem> children) unmounts.
  const categoryItems = [
    { value: ALL, label: 'All categories' },
    ...(categoriesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name })),
  ];

  const hasDateFilter = Boolean(from || to);

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expense-category-filter" className="text-xs text-muted-foreground">
          Category
        </Label>
        <Select
          items={categoryItems}
          value={categoryId || ALL}
          onValueChange={(value) => onCategoryChange(value && value !== ALL ? value : '')}
        >
          <SelectTrigger id="expense-category-filter" className="w-[200px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {(categoriesQuery.data ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expense-from-filter" className="text-xs text-muted-foreground">
          From
        </Label>
        <Input
          id="expense-from-filter"
          type="date"
          value={from}
          onChange={(event) => onFromChange(event.target.value)}
          className="w-[160px]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expense-to-filter" className="text-xs text-muted-foreground">
          To
        </Label>
        <Input
          id="expense-to-filter"
          type="date"
          value={to}
          onChange={(event) => onToChange(event.target.value)}
          className="w-[160px]"
        />
      </div>

      {hasDateFilter && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            onFromChange('');
            onToChange('');
          }}
        >
          Clear dates
        </Button>
      )}
    </div>
  );
}
