import type { Category } from './config';
export type LibraryValue=string|number|boolean|null|LibraryValue[]|{[key:string]:LibraryValue};
export type ResearchEntry={id:string;category:Category;title:string;summary:string;traditions:string[];evidence_status:string;source_refs:{source_id:string;scope:string}[];details:Record<string,LibraryValue>;tags:string[];product_use:'educational'|'editorial'|'review_required';locale:string;version:string};
export type ResearchSource={id:string;title:string;author:string;url:string;kind:string;accessed:string;review_status:string;supports:string;limitations:string;independent_work_id:string};
export type LibraryMetadata={title:string;version:string;researched_at:string;entry_count:number;counts:Record<Category,number>;source_pages:number;grouped_source_works:number;scope:string;source_policy:string;localization_status:string;content_words:number};
export type EntrySummary=Pick<ResearchEntry,'id'|'category'|'title'|'summary'|'locale'|'product_use'|'evidence_status'>;
export type SearchIndex={version:string;entries:(EntrySummary&{search_text:string})[];sources:(ResearchSource&{search_text:string})[]};
