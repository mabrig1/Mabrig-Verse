export type StudioSourceMode =
  | 'text-to-video'
  | 'image-to-video'
  | 'video-to-video'
  | 'first-last-frame';

export type StudioSceneStatus =
  | 'draft'
  | 'routed'
  | 'queued'
  | 'rendering'
  | 'review'
  | 'approved'
  | 'failed';

export type SceneVariant = {
  id: string;
  label: string;
  createdAt: string;
  prompt: string;
  providerId?: string;
  outputUrl?: string;
  status: StudioSceneStatus;
};

export type StudioScene = {
  id: string;
  title: string;
  prompt: string;
  durationSeconds: number;
  sourceMode: StudioSourceMode;
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  referenceImageUrls: string[];
  providerPreference?: string;
  status: StudioSceneStatus;
  variants: SceneVariant[];
};

export type RenderPreset = {
  id: string;
  label: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  width: number;
  height: number;
  fps: number;
  bitrateMbps: number;
  captionSafeArea: boolean;
};

export type StudioWorkflow = {
  version: 1;
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  scenes: StudioScene[];
  renderPresetId: string;
  batchVariants: number;
  notes: string;
};

export const RENDER_PRESETS: RenderPreset[] = [
  {
    id: 'cinema-16x9',
    label: 'Cinema 1080p',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    fps: 24,
    bitrateMbps: 16,
    captionSafeArea: false,
  },
  {
    id: 'youtube-16x9',
    label: 'YouTube 1080p',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    fps: 30,
    bitrateMbps: 12,
    captionSafeArea: true,
  },
  {
    id: 'shorts-9x16',
    label: 'Shorts / Reels 1080×1920',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    fps: 30,
    bitrateMbps: 10,
    captionSafeArea: true,
  },
  {
    id: 'square-1x1',
    label: 'Square Social',
    aspectRatio: '1:1',
    width: 1080,
    height: 1080,
    fps: 30,
    bitrateMbps: 10,
    captionSafeArea: true,
  },
  {
    id: 'social-4x5',
    label: 'Feed 4:5',
    aspectRatio: '4:5',
    width: 1080,
    height: 1350,
    fps: 30,
    bitrateMbps: 10,
    captionSafeArea: true,
  },
];

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function newScene(
  index: number,
  prompt = 'Describe the shot, action, subject, camera and lighting.',
): StudioScene {
  return {
    id: id('scene'),
    title: `Scene ${index + 1}`,
    prompt,
    durationSeconds: 8,
    sourceMode: 'text-to-video',
    referenceImageUrls: [],
    status: 'draft',
    variants: [],
  };
}

export function createStudioWorkflow(title = 'Untitled AI Video'): StudioWorkflow {
  const now = new Date().toISOString();
  return {
    version: 1,
    id: id('workflow'),
    title,
    createdAt: now,
    updatedAt: now,
    scenes: [newScene(0)],
    renderPresetId: 'cinema-16x9',
    batchVariants: 1,
    notes: '',
  };
}

export function duplicateScene(scene: StudioScene, index: number): StudioScene {
  return {
    ...scene,
    id: id('scene'),
    title: `${scene.title} Copy ${index + 1}`,
    status: 'draft',
    variants: [],
  };
}

export function addVariant(
  scene: StudioScene,
  providerId?: string,
): StudioScene {
  const variant: SceneVariant = {
    id: id('variant'),
    label: `Variant ${scene.variants.length + 1}`,
    createdAt: new Date().toISOString(),
    prompt: scene.prompt,
    providerId,
    status: 'queued',
  };

  return {
    ...scene,
    status: 'queued',
    variants: [...scene.variants, variant],
  };
}

export function validateWorkflow(value: unknown): StudioWorkflow {
  if (!value || typeof value !== 'object') {
    throw new Error('Workflow JSON must be an object.');
  }

  const workflow = value as Partial<StudioWorkflow>;
  if (workflow.version !== 1) {
    throw new Error('Unsupported workflow version.');
  }
  if (!Array.isArray(workflow.scenes) || workflow.scenes.length === 0) {
    throw new Error('Workflow must contain at least one scene.');
  }

  const sceneIds = new Set<string>();
  const scenes = workflow.scenes.slice(0, 100).map((scene, index) => {
    if (!scene || typeof scene !== 'object') {
      throw new Error(`Scene ${index + 1} is invalid.`);
    }
    const typed = scene as StudioScene;
    if (!typed.id || sceneIds.has(typed.id)) {
      throw new Error(`Scene ${index + 1} must have a unique id.`);
    }
    sceneIds.add(typed.id);
    if (!typed.prompt?.trim()) {
      throw new Error(`Scene ${index + 1} requires a prompt.`);
    }
    const duration = Number(typed.durationSeconds);
    if (!Number.isFinite(duration) || duration <= 0 || duration > 180) {
      throw new Error(`Scene ${index + 1} duration must be 1–180 seconds.`);
    }

    return {
      ...typed,
      title: String(typed.title || `Scene ${index + 1}`).slice(0, 120),
      prompt: typed.prompt.trim().slice(0, 20_000),
      durationSeconds: duration,
      referenceImageUrls: Array.isArray(typed.referenceImageUrls)
        ? typed.referenceImageUrls.slice(0, 8)
        : [],
      variants: Array.isArray(typed.variants) ? typed.variants.slice(0, 20) : [],
    };
  });

  return {
    version: 1,
    id: String(workflow.id || id('workflow')).slice(0, 120),
    title: String(workflow.title || 'Imported AI Video').slice(0, 160),
    createdAt: workflow.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    scenes,
    renderPresetId:
      typeof workflow.renderPresetId === 'string'
        ? workflow.renderPresetId
        : 'cinema-16x9',
    batchVariants: Math.max(
      1,
      Math.min(4, Number(workflow.batchVariants || 1)),
    ),
    notes: String(workflow.notes || '').slice(0, 5_000),
  };
}
