import {NextRequest,NextResponse} from 'next/server';
import {approveAndContinue,createProduction,getProduction,advanceProduction,markPublished,type Destination} from '../../../lib/production-workflow';

export async function POST(req:NextRequest){
 try{
  const body=await req.json();
  if(!body?.brief||!body?.audioName)return NextResponse.json({error:'brief and audioName are required'},{status:400});
  const destinations=(body.destinations||['youtube','instagram','facebook','tiktok','website']) as Destination[];
  return NextResponse.json(createProduction({title:body.title,brief:body.brief,template:body.template||'Auto Director',ratio:body.ratio||'16:9',audioName:body.audioName,referenceCount:Number(body.referenceCount||0),destinations,publishMode:body.publishMode==='auto-publish'?'auto-publish':'review-first'}),{status:201});
 }catch{return NextResponse.json({error:'Invalid production request'},{status:400})}
}
export async function PATCH(req:NextRequest){
 try{const body=await req.json();if(!body?.id)return NextResponse.json({error:'id is required'},{status:400});let job;
  if(body.action==='advance')job=advanceProduction(body.id);
  else if(body.action==='approve')job=approveAndContinue(body.id);
  else if(body.action==='published')job=markPublished(body.id,body.urls||{});
  else return NextResponse.json({error:'Unknown action'},{status:400});
  return job?NextResponse.json(job):NextResponse.json({error:'Production not found'},{status:404});
 }catch{return NextResponse.json({error:'Invalid action'},{status:400})}
}
export async function GET(req:NextRequest){const id=req.nextUrl.searchParams.get('id');if(!id)return NextResponse.json({error:'id is required'},{status:400});const job=getProduction(id);return job?NextResponse.json(job):NextResponse.json({error:'Production not found'},{status:404})}
