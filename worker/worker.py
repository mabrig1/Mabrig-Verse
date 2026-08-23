import os,subprocess
from fastapi import FastAPI,Header,HTTPException
from pydantic import BaseModel
app=FastAPI(title='Mabrig Verse GPU Worker',version='0.1.0')
TOKEN=os.getenv('GPU_WORKER_TOKEN','')
class RenderJob(BaseModel):
 project_id:str
 audio_url:str
 reference_urls:list[str]=[]
 brief:str
 aspect_ratio:str='16:9'

def auth(authorization:str|None):
 if TOKEN and authorization!=f'Bearer {TOKEN}': raise HTTPException(status_code=401,detail='Unauthorized')
@app.get('/health')
def health():
 try: ffmpeg=subprocess.check_output(['ffmpeg','-version'],text=True).splitlines()[0]
 except Exception: ffmpeg='unavailable'
 return {'ok':True,'gpuWorker':True,'ffmpeg':ffmpeg}
@app.post('/jobs')
def create_job(job:RenderJob,authorization:str|None=Header(default=None)):
 auth(authorization)
 # Queue adapters will hand this payload to Whisper/Demucs, generation/lip-sync and FFmpeg stages.
 return {'accepted':True,'projectId':job.project_id,'pipeline':['audio-analysis','vocal-separation','storyboard','shot-generation','lip-sync','qc-repair','ffmpeg-master'],'note':'Worker scaffold ready; model adapters are activated when their providers/models are configured.'}
