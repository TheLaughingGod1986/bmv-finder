

type Props = {
  score: number;
  rating: 'low' | 'medium' | 'high';
  reason: string;
};

export default function ConfidenceScore({ score, rating, reason }: Props) {
  const color = rating === 'high' ? 'text-green-700' : rating === 'medium' ? 'text-yellow-600' : 'text-red-600';
  return (
    <div className="rounded-lg border p-4 bg-white shadow flex flex-col items-start">
      <div className="flex items-center mb-2">
        <span className={`text-2xl font-bold mr-2 ${color}`}>{score}</span>
        <span className={`uppercase font-semibold ${color}`}>{rating} confidence</span>
      </div>
      <div className="text-sm text-gray-700">{reason}</div>
    </div>
  );
} 