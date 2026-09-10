from services.interpretation.reading import from_entry

def test_unapproved_or_invalid_knowledge_falls_back_to_facts():
    for entry in [{'status':'draft','payload':{}},{'status':'approved','payload':{}}]:
        result=from_entry('key',{'key':entry},'Known position','Calculated fact')
        assert result['status']=='facts' and result['summary']=='Calculated fact'

def test_only_approved_structured_knowledge_is_used():
    result=from_entry('key',{'key':{'status':'approved','version':2,'payload':{'headline':'Approved','summary':'Edited copy','strengths':['trait']}}},'Fact','Fact')
    assert result['source']=='knowledge:key:v2' and result['strengths']==['trait']
