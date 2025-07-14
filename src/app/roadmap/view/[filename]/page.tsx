'use client';

import { useRouter } from 'next/navigation';
import MarkdownViewer from '../../../components/MarkdownViewer';

interface ViewDocumentPageProps {
  params: {
    filename: string;
  };
}

export default function ViewDocumentPage({ params }: ViewDocumentPageProps) {
  const router = useRouter();
  const { filename } = params;

  const handleBack = () => {
    router.push('/roadmap');
  };

  return <MarkdownViewer filename={filename} onBack={handleBack} />;
} 