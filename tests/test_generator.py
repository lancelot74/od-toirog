import asyncio
import pytest
from services.interpretation.generator import synthesize

class Provider:
    def __init__(self,value):self.value=value;self.called=False
    async def generate(self,approved):self.called=True;return self.value

def test_unapproved_knowledge_never_sent_to_provider():
    provider=Provider('invalid')
    assert asyncio.run(synthesize(provider,[{'status':'draft'}])) is None
    assert not provider.called

def test_invalid_json_rejected():
    with pytest.raises(ValueError):asyncio.run(synthesize(Provider('not json'),[{'key':'k','status':'approved'}]))

def test_invented_evidence_rejected():
    text='{"headline":"H","summary":"S","love":"","work":"","emotion":"","communication":"","do":[],"avoid":[],"evidence_keys":["invented"]}'
    with pytest.raises(ValueError):asyncio.run(synthesize(Provider(text),[{'key':'k','status':'approved'}]))
