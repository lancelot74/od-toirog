"""Operational events exclude birth data, email, names and free-form client text."""
import os
import hashlib

EVENTS={'landing_view','signup_started','signup_completed','birth_info_started','birth_info_completed','chart_generated','chart_viewed','today_viewed','transit_explanation_opened','compatibility_started','compatibility_completed','share_created','premium_viewed','checkout_started','purchase_completed','client_error'}

async def forward(http,event,user_id):
    key=os.getenv('ANALYTICS_KEY')
    if not key:return
    # Provider receives an opaque identifier, never name/email/birth details.
    distinct=hashlib.sha256((user_id+os.getenv('ANALYTICS_SALT','od-toirog')).encode()).hexdigest()
    host=os.getenv('POSTHOG_HOST','https://us.i.posthog.com').rstrip('/')
    await http.post(host+'/capture/',json={'api_key':key,'event':event,'properties':{'distinct_id':distinct,'$process_person_profile':False}})
