import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function LibraryMarkdown({text}:{text:string}){return <div className="library-markdown" lang="en"><ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{h1:({children})=><h2>{children}</h2>,h2:({children})=><h3>{children}</h3>,h3:({children})=><h4>{children}</h4>,table:({children})=><div className="table-wrap"><table>{children}</table></div>}}>{text}</ReactMarkdown></div>;}
