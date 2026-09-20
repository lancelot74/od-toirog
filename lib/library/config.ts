export const collections = {
  tarot: {title:'Тарогийн 78 хөзөр',english:'Rider–Waite–Smith',description:'Их ба бага аркан, дүрслэл, түүхэн тайлбар, зөв ба урвуу байрлалын сэдэв, өдрийн болон харилцааны эргэцүүлэл.'},
  term: {title:'Нэр томьёоны толь',english:'Terms & concepts',description:'Мистицизм, философи, оккультизм, мэргэ төлөг, алхими болон тарогийн ойлголтуудыг тухайн уламжлалын хүрээнд тайлбарлана.'},
  tradition: {title:'Уламжлалын танилцуулга',english:'Traditions & histories',description:'Сургууль, урсгал, хөзрийн системүүдийн түүх, ялгаа болон судалгааны хамрах хүрээ.'},
  symbol: {title:'Бэлгэдлийн толь',english:'Symbols & motifs',description:'Дэнлүү, зам, хөшиг, тойрог зэрэг дүрслэлийн ажиглалт, шинэ холбоос, дизайны хэрэглээ.'},
  taboo: {title:'Заншил ба тайлбарын хүрээ',english:'Customs & claim checks',description:'Баримтжуулсан заншил, түүхэн хориг, батлагдаагүй нийтлэг яриа болон бүтээгдэхүүний зарчмыг тус тусад нь авч үзнэ.'},
  spread: {title:'Хөзөр дэлгэх байрлалууд',english:'Spreads & layouts',description:'Өдөр тутмын эргэцүүлэл, харилцаа, сонголт, бүтээл, шилжилтэд зориулсан байрлал ба асуултууд.'},
  method: {title:'Тайлах арга зүй',english:'Reading methods',description:'Асуулт, сонголтын механизм, урвуу байрлал, тайлбарын эх сурвалж болон хувилбар хадгалах арга зүйн тэмдэглэл.'},
  example: {title:'Бүрэн тайллын жишээ',english:'Worked readings',description:'Хөзөр, байрлал, нөхцөл, нэгдсэн тайлбар бүхий зохиомол сургалтын зургаан жишээ.'},
  vocabulary: {title:'Уур амьсгалын үгийн сан',english:'Editorial vocabulary',description:'Босго, гэрэл, шөнө, тэнгэр, цаг хугацаа, дурсамж, харилцааны үгсийн ажлын утга ба хэрэглээ.'},
  copy: {title:'Найруулгын жишээнүүд',english:'Original copy',description:'Нээлт, өдрийн уншлага, харилцаа, тэмдэглэл, төгсгөл болон интерфейсийн эх бичвэрүүд.'},
  translation: {title:'Монгол нэршлийн ноорог',english:'Mongolian candidates',description:'Англи ойлголт, монгол хувилбар, утгын тайлбар ба редакторын тэмдэглэл. Эх багцад ноорог гэж тэмдэглэгдсэн 37 бичлэг.'},
} as const;

export type Category = keyof typeof collections;
export const sections: {slug:string;number:string;title:string;subtitle:string;description:string;categories:Category[]}[] = [
  {slug:'tarot',number:'I',title:'Таро',subtitle:'Дүрслэлээс асуулт руу',description:'Нэг хөзөр хэд хэдэн давхаргатай: харагдах дүрслэл, түүхэн тайлбар, өнөөдрийн эргэцүүлэл. RWS системийн 78 хөзрийг эдгээр давхаргаар нь нээнэ.',categories:['tarot']},
  {slug:'knowledge',number:'II',title:'Нэр томьёо ба уламжлал',subtitle:'Үгийн цаадах түүх',description:'Ижил төстэй сонсогдох үгс өөр өөр түүхтэй. Нэр томьёог тайлбарлаж, түүний хамаарах сургууль, уламжлалтай нь хамт уншина.',categories:['term','tradition']},
  {slug:'symbols-context',number:'III',title:'Бэлгэдэл ба соёлын хүрээ',subtitle:'Дүрс, заншил, нөхцөл',description:'Дүрс юу харуулдаг, түүнд ямар утга өгсөн, тухайн утгын хүрээ хаана дуусахыг ажиглана. Монголын баримтжуулсан соёлын жишээг ч өөрийн нөхцөлд нь авч үзнэ.',categories:['symbol','taboo']},
  {slug:'reading-practice',number:'IV',title:'Тайлах арга ба жишээ',subtitle:'Асуултаа хэлбэртэй болгох',description:'Хөзөр дэлгэх байрлал, тайлбарыг холбох арга, бүрэн жишээ. Байрлал бүрийн асуулт, хөзрийн чиглэл, эх сурвалжийг тодорхой хадгална.',categories:['spread','method','example']},
  {slug:'editorial',number:'V',title:'Найруулга ба үгийн сан',subtitle:'Нам гүм, ойлгомжтой дуу хоолой',description:'Нэг тод дүрслэлээс нэг ойлгомжтой асуулт руу. Од Тойргийн эх бичвэр, үгийн ажлын утга, хэрэглээний нөхцөлийг судална.',categories:['vocabulary','copy']},
  {slug:'mongolian',number:'VI',title:'Монгол нэршлийн ноорог',subtitle:'Хэлний ажлын ширээ',description:'Нэршлийн хувилбар бүр англи ойлголт, утгын тэмдэглэлтэй. Эдгээр нь батлагдсан орчуулга биш; эхийн ноорог төлөв нь хэвээр харагдана.',categories:['translation']},
];

export const evidenceLabels:Record<string,string> = {
  documented_history_and_original_editorial:'Түүхэн тайлбар + шинэ найруулга',
  documented_terminology:'Судалсан нэр томьёо',historical_or_living_context:'Түүхэн / амьд уламжлалын хүрээ',
  documented_image_and_original_association:'Ажигласан дүрслэл + шинэ холбоос',historical_text_claim:'Түүхэн эхийн өгүүлэмж',
  documented_local_custom:'Баримтжуулсан нутгийн заншил',secondary_context_needs_review:'Хоёрдогч эх · нягтлах шаардлагатай',
  documented_historical_context:'Баримтжуулсан түүхэн хүрээ',unverified_generalization:'Батлагдаагүй ерөнхийлөл',
  contradicted_by_primary_example:'Анхдагч жишээтэй зөрөх тайлбар',editorial_boundary_informed_by_history:'Түүхэнд тулгуурласан тайлбарын хязгаар',
  unsupported_origin_claim:'Батлагдаагүй гарал үүслийн тайлбар',documented_system_difference:'Баримтжуулсан системийн ялгаа',
  original_product_policy:'Бүтээгдэхүүний өөрийн зарчим',original_editorial:'Шинээр бичсэн найруулга',
  historical_layout_with_original_adaptation:'Түүхэн байрлалын шинэ хувилбар',language_draft:'Нэршлийн ноорог',
};
export const useLabels = {educational:'Танин мэдэхүй',editorial:'Найруулгын материал',review_required:'Хяналт шаардлагатай'};
export const sourceKindLabels:Record<string,string>={scholarly_reference:'Эрдэм шинжилгээний лавлах',institutional_heritage:'Өв соёлын байгууллагын эх',museum_reference:'Музейн лавлах',curated_archive:'Архивын үзэсгэлэн',historical_primary:'Түүхэн анхдагч эх',primary_text_collection:'Анхдагч эхийн цуглуулга',practitioner_self_description:'Урсгалын өөрийн тайлбар',institutional_reference:'Байгууллагын лавлах',secondary_orientation:'Хоёрдогч танилцуулга'};
export const fieldLabels:Record<string,string>={
  arcana:'Арканы бүлэг',attribution:'Бүтээлийн хамаарал',deck_system:'Хөзрийн систем',editorial_boundary:'Тайлбарын хүрээ',historical_note:'Түүхэн тэмдэглэл',imagery:'Дүрслэл',number:'Дугаар / эрэмбэ',original_interpretation:'Од Тойргийн шинэ тайлбар',reversal_policy:'Урвуу байрлалыг унших зарчим',suit:'Хөзрийн төрөл',
  upright_themes:'Зөв байрлалын сэдэв',reversed_themes:'Урвуу байрлалын сэдэв',daily:'Өдрийн эргэцүүлэл',relationship:'Харилцааны эргэцүүлэл',reflection_question:'Өөртөө тавих асуулт',atmospheric_line:'Найруулгын мөр',
  definition_status:'Тайлбарын төлөв',original_example:'Шинээр бичсэн жишээ',plain_meaning:'Энгийн тайлбар',usage_note:'Хэрэглээний тэмдэглэл',coverage:'Хамрах хүрээ',important_distinction:'Чухал ялгаа',website_application:'Вебсайтад хэрэглэх санаа',design_direction:'Дүрслэлийн чиглэл',original_associations:'Шинээр холбосон утгууд',reference_card:'Холбогдох хөзөр',avoid:'Тайлбарлахдаа анхаарах зүйл',scope:'Хүрээ',attribution_note:'Хамаарлын тэмдэглэл',mood:'Дүрслэлийн бүлэг',suitable_for:'Хэрэглэх нөхцөл',working_meaning:'Ажлын утга',placement:'Байршил / нөхцөл',text:'Эх бичвэр',
  card_count:'Хөзрийн тоо',opening_question:'Эхлэх асуулт',origin:'Гарал үүсэл',positions:'Дэлгэлтийн байрлалууд',significator:'Төлөөлөх хөзөр',synthesis_method:'Тайлбарыг нэгтгэх арга',position:'Байрлал',label:'Нэр',prompt:'Асуулт',implementation_note:'Арга зүйн тэмдэглэл',card_ids:'Ашигласан хөзрүүд',orientation:'Хөзрийн чиглэл',provenance:'Жишээний үндэс',spread_title:'Ашигласан дэлгэлт',synthetic_context:'Зохиомол нөхцөл',editor_note:'Редакторын тэмдэглэл',english:'Англи ойлголт',meaning_note:'Утгын тайлбар',mongolian_candidate:'Монгол нэршлийн хувилбар',review_status:'Хяналтын төлөв',script:'Бичиг',
};

export function sectionFor(category:Category){return sections.find(s=>s.categories.includes(category))!;}
