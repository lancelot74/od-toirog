import { createBrowserClient } from './supabase/client';
import { api } from './api';
export async function track(event:string){
  // Telemetry must never interrupt the experience; no form values are sent.
  try{const session=await createBrowserClient()?.auth.getSession();if(session?.data.session)await api('/events',{event});}catch{}
}
