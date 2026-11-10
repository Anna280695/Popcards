import { createClient } from 'npm:@supabase/supabase-js@2';

// Deploy with JWT verification enabled. Never expose SUPABASE_SERVICE_ROLE_KEY in browser code.
Deno.serve(async (req) => {
  const headers = {'Content-Type':'application/json','Cache-Control':'no-store'};
  const respond = (status:number, value:Record<string,string>) => new Response(JSON.stringify(value),{status,headers});
  if(req.method!=='POST') return respond(405,{error:'Method not allowed'});
  const token = req.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];
  if(!token) return respond(401,{error:'Sign in required'});
  const base = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!base||!anon||!service)return respond(500,{error:'Missing server configuration'});
  let body: {confirmation?:string};
  try{body=await req.json()}catch{return respond(400,{error:'Invalid request'})}
  if(body.confirmation!=='DELETE')return respond(400,{error:'Confirmation required'});
  const userClient=createClient(base,anon,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await userClient.auth.getUser(token);
  if(error||!data.user)return respond(401,{error:'Session invalid'});
  const admin=createClient(base,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const result=await admin.auth.admin.deleteUser(data.user.id);
  if(result.error)return respond(500,{error:'Account deletion failed'});
  return respond(200,{status:'deleted'});
});
