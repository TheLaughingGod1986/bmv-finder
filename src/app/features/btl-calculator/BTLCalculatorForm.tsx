"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchGrowthData } from "@/lib/fetchGrowthData";
import { formatPostcode } from "@/utils/formatPostcode";
import { computeStampDuty } from "@/lib/stampDuty";
import EnhancedResultsCard, { BtlResults } from "./EnhancedResultsCard";
import PortfolioPicker from "./PortfolioPicker";

type FormState = {
  postcode: string;
  manualAddress?: string; // Optional: user-entered house no. + street if not in suggestions
  purchasePrice: number;
  discountPct?: number; // Optional BMV discount
  monthlyRent?: number; // Optional monthly rent to compute yield
  depositPct: number; // user-selectable deposit %
  refurbCost: number; // may be auto-estimated from level + contingency
  refurbLevel: 'cosmetic' | 'modernisation' | 'full_renovation';
  refurbContingencyPct: 0 | 10 | 15 | 20;
  stampDuty?: number; // manual override
  legalFees: number;
  brokerFees: number;
  remortgageLtv: number; // default 75%
  timelineMonths: number; // default 24
  adjustForInflation: boolean;
  purchaseType: 'personal' | 'second_home' | 'ltd' | 'first_time';
};

const defaultState: FormState = {
  postcode: "",
  manualAddress: "",
  purchasePrice: 250000,
  discountPct: undefined,
  monthlyRent: undefined,
  depositPct: 25,
  refurbCost: 15000,
  refurbLevel: 'cosmetic',
  refurbContingencyPct: 15,
  stampDuty: undefined,
  legalFees: 1500,
  brokerFees: 1000,
  remortgageLtv: 75,
  timelineMonths: 24,
  adjustForInflation: false,
  purchaseType: 'ltd',
};

export default function BTLCalculatorForm() {
  const [state, setState] = useState<FormState>(defaultState);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BtlResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ address: string; postcode: string; number: string; street: string; display: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<{ address: string; postcode: string; number: string; street: string } | null>(null);
  const [lastSoldPrice, setLastSoldPrice] = useState<number | null>(null);
  const [lastSoldDate, setLastSoldDate] = useState<string | null>(null);
  const [autoMarketValue, setAutoMarketValue] = useState<number | null>(null);
  const [autoDiscountPct, setAutoDiscountPct] = useState<number | null>(null);
  const [discountTouched, setDiscountTouched] = useState(false);
  const [stampTouched, setStampTouched] = useState(false);
  const postcodeBoxRef = useRef<HTMLDivElement | null>(null);
  const postcodeInputRef = useRef<HTMLInputElement | null>(null);
  const suppressNextSuggestions = useRef(false);
  const [purchaseTouched, setPurchaseTouched] = useState(false);
  const [autoFilledFromMarket, setAutoFilledFromMarket] = useState(false);
  const [refurbTouched, setRefurbTouched] = useState(false);
  const [watchlist, setWatchlist] = useState<Array<{ id: string; address: string; postcode: string; price?: number }>>([]);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [addressMode, setAddressMode] = useState<'search' | 'manual' | 'watchlist' | 'portfolio'>('search');
  const [growthAnnualPct, setGrowthAnnualPct] = useState<number | null>(null);
  const [ltvMode, setLtvMode] = useState<'preset' | 'custom'>('preset');
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [upliftMode, setUpliftMode] = useState<'none' | 'percent' | 'amount'>('none');
  const [upliftPct, setUpliftPct] = useState<number | ''>('');
  const [upliftAmount, setUpliftAmount] = useState<number | ''>('');
  const [manualMortgageBalance, setManualMortgageBalance] = useState<number | ''>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  // Mortgage style for outstanding balance modelling
  const [mortgageType, setMortgageType] = useState<'interest_only' | 'repayment'>('interest_only');
  const [mortgageRatePct, setMortgageRatePct] = useState<number>(5);
  const [mortgageTermYears, setMortgageTermYears] = useState<number>(25);
  const [mortgageBalanceTouched, setMortgageBalanceTouched] = useState<boolean>(false);
  const [rentEstimateLoading, setRentEstimateLoading] = useState(false);
  const [rentConfidence, setRentConfidence] = useState<number | null>(null);
  const [rentTouched, setRentTouched] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const REFURB_PRESETS: Record<FormState['refurbLevel'], { label: string; avg: number; details: string }>= {
    cosmetic: {
      label: 'Cosmetic refresh',
      avg: 12000,
      details: 'Painting/decor, flooring, minor joinery, fixtures & fittings.'
    },
    modernisation: {
      label: 'Modernisation',
      avg: 30000,
      details: 'New kitchen/bath updates, partial rewire, boiler/heating refresh, windows in parts.'
    },
    full_renovation: {
      label: 'Full renovation',
      avg: 55000,
      details: 'Full rewire, plumbing/heating, new kitchen & bathrooms, windows/doors, possible structural repairs.'
    }
  };

  const onChange = (field: keyof FormState, value: string | number | boolean) => {
    setState((s) => ({ ...s, [field]: value }));
  };

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (typeof window !== 'undefined') {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );
          const { data: { session } } = await supabase.auth.getSession();
          setIsAuthenticated(!!session?.access_token);
        }
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  // Auto-estimate monthly rent when postcode and purchase price are available
  useEffect(() => {
    const fetchRent = async () => {
      const pc = state.postcode.trim();
      if (!pc) return;
      if (rentTouched) return; // respect manual override once user edits
      try {
        setRentEstimateLoading(true);
        const res = await fetch('/api/rent-estimation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postcode: pc,
            propertyType: 'terraced', // simple default; can be wired to UI later
            bedrooms: 2,
            price: state.purchasePrice > 0 ? state.purchasePrice : undefined,
          }),
        });
        const json = await res.json();
        const monthly = json?.estimation?.monthlyRent;
        const conf = json?.estimation?.confidence;
        if (typeof monthly === 'number' && monthly > 0) {
          setState((s) => ({ ...s, monthlyRent: monthly }));
          if (typeof conf === 'number') setRentConfidence(Math.round(conf * 100));
        }
      } catch {
        // ignore estimator errors
      } finally {
        setRentEstimateLoading(false);
      }
    };
    const handle = setTimeout(fetchRent, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.postcode, state.purchasePrice, rentTouched]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/btl-calc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...state,
          refurbUpliftPct: upliftMode === 'percent' && upliftPct !== '' ? Number(upliftPct) : undefined,
          refurbUpliftAmount: upliftMode === 'amount' && upliftAmount !== '' ? Number(upliftAmount) : undefined,
          currentMortgageBalance: manualMortgageBalance !== '' ? Number(manualMortgageBalance) : Math.round(outstandingAtRefi),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Request failed");
      setResults(json as BtlResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  // Auto update results when inputs change (debounced)
  useEffect(() => {
    if (!autoUpdate) return;
    const isFullPostcode = /^(?:[A-Z]{1,2}\d{1,2}[A-Z]?)\s*\d[A-Z]{2}$/i.test(state.postcode.trim());
    if (!isFullPostcode || !(state.purchasePrice > 0)) return;
    const handle = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/btl-calc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...state,
            refurbUpliftPct: upliftMode === 'percent' && upliftPct !== '' ? Number(upliftPct) : undefined,
            refurbUpliftAmount: upliftMode === 'amount' && upliftAmount !== '' ? Number(upliftAmount) : undefined,
            currentMortgageBalance: manualMortgageBalance !== '' ? Number(manualMortgageBalance) : undefined,
          }),
        });
        const json = await res.json();
        if (res.ok) setResults(json as BtlResults);
      } catch {}
      finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(handle);
    // Select explicit dependencies to avoid reruns on internal state changes unrelated to payload
  }, [autoUpdate, state.postcode, state.purchasePrice, state.discountPct, state.monthlyRent, state.depositPct, state.refurbCost, state.stampDuty, state.legalFees, state.brokerFees, state.remortgageLtv, state.timelineMonths, state.adjustForInflation, state.purchaseType]);

  // Fetch addresses by postcode when postcode looks valid
  useEffect(() => {
    const pc = state.postcode.trim();
    if (suppressNextSuggestions.current) {
      suppressNextSuggestions.current = false;
      setShowSuggestions(false);
      return;
    }
    setSelectedAddress(null);
    setLastSoldPrice(null);
    if (!pc) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const isFullPostcode = /^(?:[A-Z]{1,2}\d{1,2}[A-Z]?)\s*\d[A-Z]{2}$/i.test(pc);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/address-suggestions?q=${encodeURIComponent(pc)}`);
        const json = await res.json();
        const addrs = json?.addresses || [];
        setSuggestions(addrs);
        setShowSuggestions(isFullPostcode && addrs.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [state.postcode]);

  // Close suggestions when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (postcodeBoxRef.current && !postcodeBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowSuggestions(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  // Load watchlist (mock or real) for quick selection
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/watchlist');
        const json = await res.json();
        const items = (json?.properties || []).map((p: any) => ({ id: String(p.id), address: p.address || p.title, postcode: p.postcode || '', price: p.price }));
        setWatchlist(items);
      } catch {}
    };
    load();
  }, []);

  const onSelectAddress = async (a: { address: string; postcode: string; number: string; street: string }) => {
    setSelectedAddress(a);
    setState((s) => ({ ...s, postcode: a.postcode, manualAddress: `${a.number} ${a.street}` }));
    setShowSuggestions(false);
    setSuggestions([]);
    suppressNextSuggestions.current = true;
    // Blur the input to avoid reopening dropdown on focus
    postcodeInputRef.current?.blur();
    // Try to get last sold price for the selected property
    try {
      const url = `/api/property-sales-history?postcode=${encodeURIComponent(a.postcode)}&number=${encodeURIComponent(a.number)}`;
      const res = await fetch(url);
      const json = await res.json();
      const sales = json?.salesHistory || [];
      if (sales.length > 0) {
        const price = sales[0].price;
        const date = sales[0].date;
        if (typeof price === 'number' && price > 0) setLastSoldPrice(price);
        if (date) setLastSoldDate(date);
      }
    } catch {
      setLastSoldPrice(null);
      setLastSoldDate(null);
    }
  };

  // Auto-calc stamp duty from purchase price and purchase type unless manually overridden
  useEffect(() => {
    if (!stampTouched && state.purchasePrice > 0) {
      const auto = computeStampDuty(state.purchasePrice, state.purchaseType);
      setState((s) => ({ ...s, stampDuty: auto }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.purchasePrice, state.purchaseType]);

  // Auto-calc refurb cost from level + contingency unless manually overridden
  useEffect(() => {
    if (refurbTouched) return;
    const base = REFURB_PRESETS[state.refurbLevel].avg;
    const total = Math.round(base * (1 + state.refurbContingencyPct / 100));
    setState((s) => ({ ...s, refurbCost: total }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.refurbLevel, state.refurbContingencyPct]);

  // Compute estimated current market value from last sold price + regional growth
  useEffect(() => {
    const compute = async () => {
      if (!lastSoldPrice || !lastSoldDate || !state.postcode) {
        setAutoMarketValue(null);
        setAutoDiscountPct(null);
        return;
      }
      try {
        // Resolve region via Postcodes.io
        const pcRes = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(state.postcode.trim())}`);
        const pcJson = await pcRes.json();
        const region: string = pcJson?.result?.region || pcJson?.result?.admin_district || 'England';
        const growth = await fetchGrowthData(region);
        setGrowthAnnualPct(growth.annualHpiPct);
        // Years since last sale
        const years = Math.max(0, (Date.now() - new Date(lastSoldDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
        const estimated = Math.round(lastSoldPrice * Math.pow(1 + growth.annualHpiPct / 100, years));
        setAutoMarketValue(estimated);
        // Auto compute BMV % vs purchase price
        if (state.purchasePrice > 0) {
          const bmv = Math.max(0, ((estimated - state.purchasePrice) / estimated) * 100);
          const rounded = Math.round(bmv * 10) / 10;
          setAutoDiscountPct(rounded);
          if (!discountTouched && (state.discountPct === undefined || state.discountPct === null)) {
            setState((s) => ({ ...s, discountPct: rounded }));
          }
        } else {
          setAutoDiscountPct(null);
        }
      } catch {
        setAutoMarketValue(null);
        setAutoDiscountPct(null);
      }
    };
    compute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSoldPrice, lastSoldDate, state.postcode]);

  // Helper to extract a plausible house number (e.g., 12, 12A) from manualAddress
  function extractHouseNumber(input?: string): string | null {
    if (!input) return null;
    const m = input.trim().match(/^(\d+[A-Za-z]?)/);
    return m ? m[1] : null;
  }

  // If user manually types an address, try fetching last sold price with extracted number
  useEffect(() => {
    const number = extractHouseNumber(state.manualAddress);
    if (!number || !state.postcode) return;
    const handle = setTimeout(async () => {
      try {
        const url = `/api/property-sales-history?postcode=${encodeURIComponent(state.postcode)}&number=${encodeURIComponent(number)}`;
        const res = await fetch(url);
        const json = await res.json();
        const sales = json?.salesHistory || [];
        if (sales.length > 0) {
          const price = sales[0].price;
          const date = sales[0].date;
          if (typeof price === 'number' && price > 0) setLastSoldPrice(price);
          if (date) setLastSoldDate(date);
        }
      } catch {
        // ignore
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [state.manualAddress, state.postcode]);

  // If user changes purchase price and we have an auto value, refresh auto discount unless user typed discount
  useEffect(() => {
    if (autoMarketValue && !discountTouched) {
      const bmv = Math.max(0, ((autoMarketValue - state.purchasePrice) / autoMarketValue) * 100);
      const rounded = Math.round(bmv * 10) / 10;
      setAutoDiscountPct(rounded);
      setState((s) => ({ ...s, discountPct: rounded }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.purchasePrice]);

  // If we have an estimated market value and the user hasn't edited purchase price, auto-populate it
  useEffect(() => {
    if (!purchaseTouched && autoMarketValue && autoMarketValue > 0) {
      setState((s) => ({ ...s, purchasePrice: autoMarketValue }));
      setAutoFilledFromMarket(true);
    }
  }, [autoMarketValue, purchaseTouched]);

  // Ensure we always have a regional growth rate so timeline affects the preview
  useEffect(() => {
    const fetchGrowth = async () => {
      if (!state.postcode) { setGrowthAnnualPct(null); return; }
      try {
        const pcRes = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(state.postcode.trim())}`);
        const pcJson = await pcRes.json();
        const region: string = pcJson?.result?.region || pcJson?.result?.admin_district || 'England';
        const growth = await fetchGrowthData(region);
        setGrowthAnnualPct(growth.annualHpiPct);
      } catch {
        // ignore
      }
    };
    fetchGrowth();
  }, [state.postcode]);

  // Compute outstanding mortgage balance at refinance date
  function computeOutstandingBalance(purchasePrice: number, depositPct: number, monthsElapsed: number, type: 'interest_only' | 'repayment', ratePct: number, termYears: number): number {
    const principal = Math.max(0, purchasePrice * (1 - depositPct / 100));
    if (principal === 0) return 0;
    if (type === 'interest_only') return principal;
    const monthlyRate = Math.max(0, ratePct) / 100 / 12;
    const totalMonths = Math.max(1, Math.round(termYears * 12));
    const k = Math.min(totalMonths, Math.max(0, Math.round(monthsElapsed)));
    if (monthlyRate === 0) {
      // Straight-line principal repayment
      const principalPaid = (principal * k) / totalMonths;
      return Math.max(0, principal - principalPaid);
    }
    const pow = Math.pow(1 + monthlyRate, totalMonths);
    const payment = (principal * monthlyRate * pow) / (pow - 1);
    const balance = principal * Math.pow(1 + monthlyRate, k) - payment * ((Math.pow(1 + monthlyRate, k) - 1) / monthlyRate);
    return Math.max(0, balance);
  }

  const outstandingAtRefi = useMemo(() => {
    return computeOutstandingBalance(
      state.purchasePrice || 0,
      state.depositPct || 0,
      state.timelineMonths || 0,
      mortgageType,
      mortgageRatePct,
      mortgageTermYears
    );
  }, [state.purchasePrice, state.depositPct, state.timelineMonths, mortgageType, mortgageRatePct, mortgageTermYears]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form onSubmit={onSubmit} className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid gap-3">
          <div className="grid gap-1" ref={postcodeBoxRef}>
            <label className="text-sm font-medium">Property source</label>
            <div className={`grid gap-2 text-xs ${isAuthenticated ? 'grid-cols-4' : 'grid-cols-3'}`}>
              {(['search','manual','watchlist', ...(isAuthenticated ? ['portfolio'] : [])] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setAddressMode(m); setShowSuggestions(false); }}
                  className={`rounded-md border px-2 py-1 ${addressMode === m ? 'border-gray-900 text-gray-900' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
                >
                  {m === 'search' ? 'Search by postcode' : m === 'manual' ? 'Add manually' : m === 'watchlist' ? 'From watchlist' : 'From portfolio'}
                </button>
              ))}
            </div>

            {addressMode !== 'watchlist' && (
              <>
                <label className="mt-3 text-sm font-medium">Postcode</label>
                <input
                  required
                  value={state.postcode}
                  onChange={(e) => onChange("postcode", formatPostcode(e.target.value))}
                  placeholder="e.g., SW1A 1AA"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                  ref={postcodeInputRef}
                  onFocus={() => addressMode === 'search' && suggestions.length > 0 && setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setShowSuggestions(false);
                  }}
                />
              </>
            )}

            {addressMode === 'search' && showSuggestions && (
              <div className="mt-2 max-h-56 overflow-auto rounded-md border border-gray-200 bg-white text-sm">
                {suggestions.map((a) => (
                  <button
                    type="button"
                    key={`${a.postcode}-${a.number}-${a.street}`}
                    className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-gray-50"
                    onClick={() => onSelectAddress(a)}
                  >
                    <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{a.number}</span>
                    <span className="truncate">{a.street}, {a.postcode}</span>
                  </button>
                ))}
              </div>
            )}

            {addressMode === 'search' && (
              <p className="mt-2 text-xs text-gray-500">
                Not all properties will appear in the dropdown. If you can't find yours, switch to “Add manually”.
              </p>
            )}

            {addressMode === 'manual' && (
              <>
                <label className="mt-2 text-sm font-medium">House number and street</label>
                <input
                  value={state.manualAddress}
                  onChange={(e) => onChange("manualAddress", e.target.value)}
                  placeholder="e.g., 73 Belgrave Road"
                  className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">Enter the property address manually if it’s not in our database.</p>
              </>
            )}

            {addressMode === 'watchlist' && (
              <div className="mt-2 max-h-48 overflow-auto rounded-md border border-gray-200 bg-white text-sm">
                {watchlist.length === 0 && (
                  <div className="px-3 py-2 text-xs text-gray-500">No properties in watchlist.</div>
                )}
                {watchlist.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-gray-50"
                    onClick={() => {
                      onChange('postcode', w.postcode || state.postcode);
                      onChange('manualAddress', w.address || '');
                      if (w.price && !purchaseTouched) onChange('purchasePrice', w.price);
                      // Keep the watchlist open as requested
                    }}
                  >
                    <span className="truncate">{w.address}</span>
                    <span className="shrink-0 text-xs text-gray-500">{w.postcode}</span>
                  </button>
                ))}
              </div>
            )}
            {addressMode === 'portfolio' && (
              <PortfolioPicker
                onSelect={(p) => {
                  onChange('postcode', p.postcode || state.postcode);
                  onChange('manualAddress', p.address || '');
                  if (p.last_valuation && !purchaseTouched) onChange('purchasePrice', p.last_valuation);
                }}
              />
            )}
          </div>
          <div className="pt-2">
            <button type="button" className="text-xs text-gray-700 underline" onClick={() => setShowAdvanced((v) => !v)}>
              {showAdvanced ? 'Hide advanced assumptions' : 'Advanced assumptions'}
            </button>
            {showAdvanced && (
              <div className="mt-2 grid gap-3 rounded-md border border-gray-200 p-3">
                <div className="grid gap-1">
                  <label className="text-sm font-medium">Refurb value uplift (BRRR)</label>
                  <div className="flex items-center gap-2 text-xs">
                    <select
                      value={upliftMode}
                      onChange={(e) => setUpliftMode(e.target.value as any)}
                      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="none">No uplift</option>
                      <option value="percent">% uplift</option>
                      <option value="amount">£ uplift</option>
                    </select>
                    {upliftMode === 'percent' && (
                      <input type="number" min={0} value={upliftPct} onChange={(e) => setUpliftPct(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g., 8" className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm" />
                    )}
                    {upliftMode === 'amount' && (
                      <input type="number" min={0} value={upliftAmount} onChange={(e) => setUpliftAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g., 15000" className="w-36 rounded-md border border-gray-300 px-3 py-2 text-sm" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Applied before HPI growth to reflect forced appreciation from refurb.</p>
                </div>
                <div className="grid gap-1">
                  <label className="text-sm font-medium">Current mortgage balance (optional)</label>
                  <input
                    type="number" min={0}
                    value={manualMortgageBalance}
                    onChange={(e) => setManualMortgageBalance(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="If repaying capital, enter outstanding balance"
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="grid gap-1">
            {lastSoldPrice && (
              <div className="text-xs text-gray-600">
                Past purchase price: <strong>£{lastSoldPrice.toLocaleString()}</strong>{' '}
                {lastSoldDate ? `on ${new Date(lastSoldDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
              </div>
            )}
            <label className="text-sm font-medium">Offer/asking price (£)</label>
            <input
              type="number"
              min={0}
              value={state.purchasePrice}
              onChange={(e) => { setPurchaseTouched(true); setAutoFilledFromMarket(false); onChange("purchasePrice", Number(e.target.value)); }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            {lastSoldPrice && autoMarketValue && (
              <div className="mt-1 text-xs text-gray-500">
                {(() => {
                  const abs = autoMarketValue - lastSoldPrice;
                  const pct = lastSoldPrice > 0 ? (abs / lastSoldPrice) * 100 : 0;
                  const sign = abs >= 0 ? '+' : '';
                  return (
                    <span>
                      Since last sale: <strong>{sign}{pct.toFixed(1)}%</strong> ({sign}£{Math.abs(Math.round(abs)).toLocaleString()})
                    </span>
                  );
                })()}
              </div>
            )}
            {autoMarketValue && (
              <div className="mt-1 text-xs text-gray-500">
                {autoFilledFromMarket ? (
                  <span>
                    Auto-filled recommended market price{lastSoldDate ? ` since last sale on ${new Date(lastSoldDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}: <strong>£{autoMarketValue.toLocaleString()}</strong>
                  </span>
                ) : (
                  <>
                    Recommended market price: <strong>£{autoMarketValue.toLocaleString()}</strong>{' '}
                    <button
                      type="button"
                      className="rounded px-2 py-0.5 text-xs font-medium text-gray-700 underline hover:text-gray-900"
                      onClick={() => { onChange("purchasePrice", autoMarketValue); setAutoFilledFromMarket(true); setPurchaseTouched(false); }}
                    >
                      Use recommended
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          {autoDiscountPct !== null && (
            <div className="text-xs text-gray-500">
              Estimated BMV: <strong>{autoDiscountPct}%</strong>{autoMarketValue ? ` vs market ~£${autoMarketValue.toLocaleString()}` : ''}.
            </div>
          )}
          
          {/* Rent input for yield calculations */}
          <div className="grid gap-1">
            <label className="text-sm font-medium">Monthly rent (optional)</label>
            <input
              type="number"
              min={0}
              value={state.monthlyRent ?? ''}
              onChange={(e) => { setRentTouched(true); onChange('monthlyRent', e.target.value === '' ? undefined : Number(e.target.value)); }}
              placeholder="For yield calculations"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
            />
            <div className="text-xs text-gray-500">Used to calculate gross yield and rental performance metrics</div>
          </div>

          {/* Mortgage type and rate UI */}
          <div className="grid gap-3 rounded-md border border-gray-100 bg-gray-50 p-3">
            <div className="text-sm font-medium text-gray-700">Mortgage details</div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-1">
                <label className="text-xs font-medium text-gray-600">Type</label>
                <select
                  value={mortgageType}
                  onChange={(e) => setMortgageType(e.target.value as 'interest_only' | 'repayment')}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                >
                  <option value="interest_only">Interest only</option>
                  <option value="repayment">Repayment</option>
                </select>
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-gray-600">Rate (%)</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  step={0.1}
                  value={mortgageRatePct}
                  onChange={(e) => setMortgageRatePct(Number(e.target.value))}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                />
              </div>
            </div>
            {mortgageType === 'repayment' && (
              <div className="grid gap-1">
                <label className="text-xs font-medium text-gray-600">Term (years)</label>
                <input
                  type="number"
                  min={5}
                  max={40}
                  value={mortgageTermYears}
                  onChange={(e) => setMortgageTermYears(Number(e.target.value))}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                />
              </div>
            )}
            <div className="text-xs text-gray-500">
              Outstanding balance at refinance: <strong>£{Math.round(outstandingAtRefi).toLocaleString()}</strong>
            </div>
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">Deposit</label>
            <select
              value={state.depositPct}
              onChange={(e) => onChange("depositPct", Number(e.target.value))}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
            >
              <option value={10}>10%</option>
              <option value={15}>15%</option>
              <option value={20}>20%</option>
              <option value={25}>25%</option>
            </select>
            <div className="mt-1 text-xs text-gray-500">
              Deposit amount: <strong>£{Math.round((state.purchasePrice || 0) * (state.depositPct || 0) / 100).toLocaleString()}</strong>
            </div>
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium">Refurbishment scope</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs">
              {(['cosmetic','modernisation','full_renovation'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setRefurbTouched(false); onChange('refurbLevel', key); }}
                  className={`rounded-md border p-2 text-left ${state.refurbLevel === key ? 'border-gray-900 text-gray-900' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}
                >
                  <div className="font-medium">{REFURB_PRESETS[key].label}</div>
                  <div className="mt-0.5 text-[11px] text-gray-500">Avg £{REFURB_PRESETS[key].avg.toLocaleString()}</div>
                  <div className="mt-1 text-[11px] text-gray-500">{REFURB_PRESETS[key].details}</div>
                </button>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Contingency</label>
                <select
                  value={state.refurbContingencyPct}
                  onChange={(e) => { setRefurbTouched(false); onChange('refurbContingencyPct', Number(e.target.value) as 0|10|15|20); }}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value={0}>0% (no contingency)</option>
                  <option value={10}>10%</option>
                  <option value={15}>15%</option>
                  <option value={20}>20%</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Refurbishment cost (£) — override</label>
                <input
                  type="number"
                  min={0}
                  value={state.refurbCost}
                  onChange={(e) => { setRefurbTouched(true); onChange('refurbCost', Number(e.target.value)); }}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                {refurbTouched && (
                  <button
                    type="button"
                    className="mt-1 text-xs text-gray-700 underline"
                    onClick={() => { setRefurbTouched(false); const base = REFURB_PRESETS[state.refurbLevel].avg; const total = Math.round(base * (1 + state.refurbContingencyPct/100)); onChange('refurbCost', total); }}
                  >
                    Reset to estimate
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium">Purchase type</label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => onChange('purchaseType', 'first_time')}
                className={`rounded-md border px-2 py-1 ${state.purchaseType === 'first_time' ? 'border-gray-900 text-gray-900' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
              >
                First-time buyer
              </button>
              <button
                type="button"
                onClick={() => onChange('purchaseType', 'personal')}
                className={`rounded-md border px-2 py-1 ${state.purchaseType === 'personal' ? 'border-gray-900 text-gray-900' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
              >
                Personal
              </button>
              <button
                type="button"
                onClick={() => onChange('purchaseType', 'second_home')}
                className={`rounded-md border px-2 py-1 ${(state.purchaseType === 'second_home' || state.purchaseType === 'ltd') ? 'border-gray-900 text-gray-900' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
              >
                Second home / LTD
              </button>
            </div>
            <label className="mt-3 text-sm font-medium">Stamp duty (£) — override</label>
            <input
              type="number"
              min={0}
              value={state.stampDuty ?? ""}
              onChange={(e) => {
                setStampTouched(true);
                onChange("stampDuty", e.target.value === "" ? undefined : Number(e.target.value))
              }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Optional override"
            />
            <div className="text-xs text-gray-500 mt-1">Type affects auto-calculated SDLT. Override to use a custom value.</div>
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium">Legal fees (£)</label>
            <input
              type="number"
              min={0}
              value={state.legalFees}
              onChange={(e) => onChange("legalFees", Number(e.target.value))}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium">Broker fees (£)</label>
            <input
              type="number"
              min={0}
              value={state.brokerFees}
              onChange={(e) => onChange("brokerFees", Number(e.target.value))}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium">Remortgage LTV (%)</label>
            {ltvMode === 'preset' ? (
              <div className="flex items-center gap-2">
                <select
                  value={state.remortgageLtv}
                  onChange={(e) => onChange('remortgageLtv', Number(e.target.value))}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                >
                  <option value={65}>65%</option>
                  <option value={70}>70%</option>
                  <option value={75}>75% (typical)</option>
                  <option value={80}>80%</option>
                </select>
                <button type="button" className="text-xs text-gray-600 underline" onClick={() => setLtvMode('custom')}>Advanced</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={state.remortgageLtv}
                  onChange={(e) => onChange('remortgageLtv', Number(e.target.value))}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <button type="button" className="text-xs text-gray-600 underline" onClick={() => setLtvMode('preset')}>Presets</button>
              </div>
            )}
            <div className="mt-1 text-[11px] text-gray-500">Most lenders cap BTL remortgage around 75% LTV; 80% may require tighter stress tests.</div>
            {(() => {
              const base = state.purchasePrice || autoMarketValue || lastSoldPrice || 0;
              if (!base) return null;
              const years = state.timelineMonths / 12;
              const rate = (growthAnnualPct ?? 0) / 100;
              const projected = Math.round(base * Math.pow(1 + rate, years));
              const amount = Math.round(projected * (state.remortgageLtv / 100));
              return (
                <div className="mt-1 text-xs text-gray-500">Est. remortgage @{state.remortgageLtv}% in {state.timelineMonths}m: <strong>£{amount.toLocaleString()}</strong>{growthAnnualPct !== null ? ` (assumes ${growthAnnualPct.toFixed(1)}%/yr HPI)` : ''}</div>
              );
            })()}
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium">Remortgage timeline</label>
            <select
              value={state.timelineMonths}
              onChange={(e) => onChange("timelineMonths", Number(e.target.value))}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
            >
              <option value={24}>2 years</option>
              <option value={36}>3 years</option>
              <option value={60}>5 years</option>
              <option value={120}>10 years</option>
            </select>
          </div>
          <label className="mt-2 inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={state.adjustForInflation}
              onChange={(e) => onChange("adjustForInflation", e.target.checked)}
            />
            Adjust for inflation (uses local CPI estimate)
          </label>
          <button
            type="submit"
            className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Calculating…" : "Calculate"}
          </button>
          <label className="mt-1 inline-flex items-center gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={autoUpdate} onChange={(e) => setAutoUpdate(e.target.checked)} />
            Auto update results
          </label>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
      </form>

      <div>
        {results ? (
          <EnhancedResultsCard results={results} />
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
            Results will appear here after you calculate.
          </div>
        )}
      </div>
    </div>
  );
}


