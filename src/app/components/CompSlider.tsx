

type Props = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
};

export default function CompSlider({ value, onChange, min = 0.7, max = 1, step = 0.01 }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-medium">Investor Offer Margin: <span className="font-bold">{Math.round(value * 100)}%</span></label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-green-700"
      />
      <div className="text-xs text-gray-500">Lower margin = bigger discount. Typical investor offers are 70–90% of market value.</div>
    </div>
  );
} 