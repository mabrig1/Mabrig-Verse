export type ServiceState={key:string;label:string;required:boolean;configured:boolean;purpose:string};
const yes=(...keys:string[])=>keys.every(k=>Boolean(process.env[k]));
export function phase1Services():ServiceState[]{return[
 {key:'openrouter',label:'OpenRouter',required:false,configured:yes('OPENROUTER_API_KEY'),purpose:'Director, agents, structured plans and QC reasoning'},
 {key:'nvidia',label:'NVIDIA NIM',required:false,configured:yes('NVIDIA_API_KEY'),purpose:'Vision/multimodal and configured NVIDIA inference'},
 {key:'huggingface',label:'Hugging Face',required:false,configured:yes('HF_TOKEN'),purpose:'Open-model inference fallback'},
 {key:'mongodb',label:'MongoDB',required:true,configured:yes('MONGODB_URI'),purpose:'Durable projects, jobs, stages and artifact metadata'},
 {key:'storage',label:(process.env.STORAGE_DRIVER||'local')==='local'?'Local shared storage':'Cloudflare R2',required:true,configured:(process.env.STORAGE_DRIVER||'local')==='local'?yes('LOCAL_MEDIA_ROOT'):yes('R2_ENDPOINT','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_BUCKET'),purpose:'Source audio and downloadable masters'},
 {key:'queue',label:'Redis Queue',required:true,configured:yes('REDIS_URL'),purpose:'Durable worker handoff and retries'},
 {key:'worker',label:'FFmpeg Worker',required:true,configured:yes('GPU_WORKER_URL','GPU_WORKER_TOKEN'),purpose:'Real worker-backed render and ffprobe QC'},
 ];}
export function phase1Readiness(){const services=phase1Services();const required=services.filter(s=>s.required);return{ready:required.every(s=>s.configured),configured:services.filter(s=>s.configured).length,total:services.length,services,storageDriver:process.env.STORAGE_DRIVER||'local',externalAIConfigured:services.some(s=>['openrouter','nvidia','huggingface'].includes(s.key)&&s.configured),domain:process.env.NEXT_PUBLIC_APP_URL||'http://localhost:3000'};}
