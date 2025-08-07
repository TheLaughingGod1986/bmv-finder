import { redirect } from 'next/navigation';

export const metadata = {
  title: "BTL Equity Release Calculator",
  description: "Estimate cash you can release from a buy-to-let remortgage based on regional growth.",
};

export default function Page() {
  redirect('/deal-calculator?mode=brrr');
}


