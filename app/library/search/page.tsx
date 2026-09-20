import { Workspace } from '@/components/workspace';
import { LibraryNav,LibraryBreadcrumb } from '@/components/library/chrome';
import { LibrarySearch } from '@/components/library/search';
export const metadata={title:'Номын сангаас хайх | Од Тойрог',description:'518 тэмдэглэл, 117 эх сурвалжаас үг, сэдэв, хэл, цуглуулгаар хайх.'};
export default function Search(){return <Workspace privatePage={false}><LibraryNav/><LibraryBreadcrumb items={[{label:'Хайх'}]}/><header className="library-heading"><p className="eyebrow">НЭГ ҮГЭЭС ЭХЛЭХ АЯЛАЛ</p><h1>Юуг судалмаар байна?</h1><p>Гарчиг, бүрэн тайлбар, түлхүүр үг, уламжлал, эшилсэн зохиогчоор хайна. Англи эх болон монгол ноорог нэршлийг хайх боломжтой.</p></header><LibrarySearch/></Workspace>;}
