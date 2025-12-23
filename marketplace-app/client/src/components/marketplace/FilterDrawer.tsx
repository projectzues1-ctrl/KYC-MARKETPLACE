import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { CurrencySelector, PaymentMethodChips } from "./VendorCard";

interface FilterState {
  type: string;
  currency: string;
  minAmount: number;
  maxAmount: number;
  paymentMethods: string[];
  minRating: number;
}

interface FilterDrawerProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

const defaultFilters: FilterState = {
  type: "",
  currency: "",
  minAmount: 0,
  maxAmount: 10000,
  paymentMethods: [],
  minRating: 0,
};

const paymentOptions = [
  "Bank Transfer",
  "PayPal",
  "Venmo",
  "Cash App",
  "Zelle",
  "Wise",
  "Revolut",
  "Crypto",
];

export function FilterDrawer({ filters, onChange, onReset }: FilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onChange(localFilters);
    setOpen(false);
  };

  const handleReset = () => {
    setLocalFilters(defaultFilters);
    onReset();
    setOpen(false);
  };

  const activeFilterCount = [
    filters.type,
    filters.currency,
    filters.minAmount > 0,
    filters.maxAmount < 10000,
    filters.paymentMethods.length > 0,
    filters.minRating > 0,
  ].filter(Boolean).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
          data-testid="button-open-filters"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-purple-600 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-gray-900 border-gray-800 text-white" data-testid="filter-drawer">
        <SheetHeader>
          <SheetTitle className="text-white">Filter Offers</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <div className="space-y-3">
            <Label>Type</Label>
            <div className="flex gap-2">
              {["", "buy", "sell"].map((type) => (
                <Button
                  key={type}
                  variant={localFilters.type === type ? "default" : "outline"}
                  size="sm"
                  className={
                    localFilters.type === type
                      ? "bg-purple-600"
                      : "bg-gray-800 border-gray-700"
                  }
                  onClick={() =>
                    setLocalFilters({ ...localFilters, type })
                  }
                  data-testid={`filter-type-${type || "all"}`}
                >
                  {type ? type.charAt(0).toUpperCase() + type.slice(1) : "All"}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Currency</Label>
            <CurrencySelector
              value={localFilters.currency}
              onChange={(currency) =>
                setLocalFilters({ ...localFilters, currency })
              }
            />
          </div>

          <div className="space-y-3">
            <Label>Amount Range</Label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                value={localFilters.minAmount}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    minAmount: parseInt(e.target.value) || 0,
                  })
                }
                className="bg-gray-800 border-gray-700"
                placeholder="Min"
                data-testid="input-min-amount"
              />
              <span className="text-gray-500">to</span>
              <Input
                type="number"
                value={localFilters.maxAmount}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    maxAmount: parseInt(e.target.value) || 10000,
                  })
                }
                className="bg-gray-800 border-gray-700"
                placeholder="Max"
                data-testid="input-max-amount"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Payment Methods</Label>
            <PaymentMethodChips
              methods={paymentOptions}
              selected={localFilters.paymentMethods}
              onChange={(methods) =>
                setLocalFilters({ ...localFilters, paymentMethods: methods })
              }
              selectable
            />
          </div>

          <div className="space-y-3">
            <Label>Minimum Rating: {localFilters.minRating}</Label>
            <Slider
              value={[localFilters.minRating]}
              onValueChange={([value]) =>
                setLocalFilters({ ...localFilters, minRating: value })
              }
              max={5}
              step={0.5}
              className="py-4"
              data-testid="slider-min-rating"
            />
          </div>
        </div>

        <SheetFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1 bg-gray-800 border-gray-700"
            data-testid="button-reset-filters"
          >
            Reset
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
            data-testid="button-apply-filters"
          >
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
