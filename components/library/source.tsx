import Link from 'next/link';
import type { ResearchSource } from '@/lib/library/types';
import { sourceKindLabels } from '@/lib/library/config';

export function SourceLink({source}:{source:ResearchSource}){return <article className="library-source-link"><p className="eyebrow">{sourceKindLabels[source.kind]||source.kind}</p><h3><Link href={`/library/sources/${source.id}`} lang="en">{source.title} →</Link></h3><p lang="en">{source.author}</p><small>Судалсан: {source.accessed}</small></article>;}
