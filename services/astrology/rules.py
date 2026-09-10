from pydantic import BaseModel, Field, model_validator

class Rules(BaseModel):
    version:int=1
    orbs:dict[str,float]=Field(default_factory=lambda:dict(conjunction=8,opposition=8,trine=6,square=6,sextile=4))
    transit_orb:float=Field(default=2,gt=0,le=8)
    transit_weights:list[float]=Field(default_factory=lambda:[1,.7,1,1.1,1.1,1.3,1.5,1.3,1.2,1.4],min_length=10,max_length=10)
    natal_weights:list[float]=Field(default_factory=lambda:[1.5,1.5,1.1,1.3,1.1,.8,.8,.5,.5,.5],min_length=10,max_length=10)
    aspect_weights:dict[str,float]=Field(default_factory=lambda:dict(conjunction=1.2,opposition=1.1,square=1.1,trine=.9,sextile=.7))
    @model_validator(mode='after')
    def valid(self):
        keys={'conjunction','opposition','trine','square','sextile'}
        if set(self.orbs)!=keys or set(self.aspect_weights)!=keys:raise ValueError('The five major aspect keys are required')
        if any(not 0<x<=12 for x in self.orbs.values()):raise ValueError('Orb must be between 0 and 12 degrees')
        if any(not 0<x<=5 for x in [*self.transit_weights,*self.natal_weights,*self.aspect_weights.values()]):raise ValueError('Weights must be between 0 and 5')
        return self

DEFAULT_RULES=Rules()
