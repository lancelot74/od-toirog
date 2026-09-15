import type { Metadata } from 'next';
import { Workspace } from '@/components/workspace';
import { ZodiacGallery } from '@/components/zodiac-gallery';

export const metadata:Metadata={title:'Арван хоёр орд | Од Тойрог',description:'Арван хоёр ордын бэлгэдэл, элемент, хэмнэл, зан төлөв ба харилцааны сэдвийг монголоор судална.'};
export default function ZodiacIndex(){return <Workspace privatePage={false}>
  <header className="zodiac-index-heading"><p className="eyebrow">ТЭНГЭРИЙН ТОЛЬ · I—XII</p><h1>Арван хоёр орд.<br/><em>Өөрийгөө харах арван хоёр өнцөг.</em></h1><p>Орд бүр өөрийн бэлгэдэл, хэмнэл, асуулттай. Зөвхөн Нарны ордоо бус, Сар, Асцендент болон бусад гариг байрласан ордуудаа хамтад нь судлаарай.</p></header>
  <ZodiacGallery/>
  <p className="zodiac-context">Эдгээр нь зурхайн уламжлалын тайлбарууд. Хүнийг нэг ордоор бүрэн тодорхойлохгүй; өөрийн туршлагатай харьцуулж эргэцүүлэхэд зориулсан болно.</p>
  </Workspace>;}
