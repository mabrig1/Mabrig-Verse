export type ServiceState={key:string;label:string;required:boolean;configured:boolean;purpose:string};
const yes=(...keys:string[])=>keys.every(k=>Boolean(process.env[k]));
export function phase1Services():ServiceState[]{return[
 {key:'openrouter',label:'OpenRouter',required:true,configured:yes('OPENROUTER_API_KEY'),purpose:'Director, agents, structured plans and QC reasoning'},
 {key:'nvidia',label:'NVIDIA NIM',required:false,configured:yes('NVIDIA_API_KEY'),purpose:'Vision/multimodal and configured NVIDIA inference'},
 {key:'huggingface',label:'Hugging Face',required:false,configured:yes('HF_TOKEN'),purpose:'Open-model inference fallback'},
 {key:'mongodb',label:'MongoDB',required:true,configured:yes('MONGODB_URI'),purpose:'Durable projects, jobs, stages and artifact metadata'},
 {key:'r2',label:'Cloudflare R2',required:true,configured:yes('R2_ENDPOINT','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_BUCKET'),purpose:'Audio, references, clips, thumbnails and finished masters'},
 {key:'queue',label:'Redis Queue',required:true,configured:yes('REDIS_URL'),purpose:'Durable long-running generation, retries and repair jobs'},
 {key:'gpu',label:'GPU Worker',required:true,configured:yes('GPU_WORKER_URL','GPU_WORKER_TOKEN'),purpose:'Video generation, lip sync, enhancement and FFmpeg mastering'},
 ];}
export function phase1Readiness(){const services=phase1Services();const required=services.filter(s=>s.required);return{ready:required.every(s=>s.configured),configured:services.filter(s=>s.configured).length,total:services.length,services,domain:process.env.NEXT_PUBLIC_APP_URL||'https://apps.mabrigkorie.org'};}
