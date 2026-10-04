'use client';

import { useMemo, useRef, useState } from 'react';
import {
  RENDER_PRESETS,
  addVariant,
  createStudioWorkflow,
  duplicateScene,
  newScene,
  validateWorkflow,
  type StudioScene,
  type StudioSourceMode,
  type StudioWorkflow,
} from '../lib/studio-workflow';

const SOURCE_MODES: Array<[StudioSourceMode, string]> = [
  ['text-to-video', 'Text → Video'],
  ['image-to-video', 'Image → Video'],
  ['video-to-video', 'Video → Video'],
  ['first-last-frame', 'First + Last Frame'],
];

function downloadWorkflow(workflow: StudioWorkflow) {
  const blob = new Blob([JSON.stringify(workflow, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${workflow.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'ai-video-workflow'}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function StudioWorkflowPanel({
  initialTitle = 'AI Video Project',
}: {
  initialTitle?: string;
}) {
  const [workflow, setWorkflow] = useState(() =>
    createStudioWorkflow(initialTitle),
  );
  const [selectedSceneId, setSelectedSceneId] = useState(
    workflow.scenes[0].id,
  );
  const [notice, setNotice] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () =>
      workflow.scenes.find((scene) => scene.id === selectedSceneId) ||
      workflow.scenes[0],
    [workflow, selectedSceneId],
  );

  function patchScene(
    sceneId: string,
    patch: Partial<StudioScene>,
  ) {
    setWorkflow((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      scenes: current.scenes.map((scene) =>
        scene.id === sceneId ? { ...scene, ...patch } : scene,
      ),
    }));
  }

  function moveScene(sceneId: string, direction: -1 | 1) {
    setWorkflow((current) => {
      const index = current.scenes.findIndex((scene) => scene.id === sceneId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.scenes.length) {
        return current;
      }
      const scenes = [...current.scenes];
      [scenes[index], scenes[nextIndex]] = [scenes[nextIndex], scenes[index]];
      return {
        ...current,
        scenes,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  function addScene() {
    setWorkflow((current) => {
      const scene = newScene(current.scenes.length);
      setSelectedSceneId(scene.id);
      return {
        ...current,
        scenes: [...current.scenes, scene],
        updatedAt: new Date().toISOString(),
      };
    });
  }

  function copySelected() {
    if (!selected) return;
    setWorkflow((current) => {
      const scene = duplicateScene(selected, current.scenes.length);
      setSelectedSceneId(scene.id);
      return {
        ...current,
        scenes: [...current.scenes, scene],
        updatedAt: new Date().toISOString(),
      };
    });
  }

  function queueVariants() {
    if (!selected) return;
    setWorkflow((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      scenes: current.scenes.map((scene) => {
        if (scene.id !== selected.id) return scene;
        let next = scene;
        for (let i = 0; i < current.batchVariants; i += 1) {
          next = addVariant(next, next.providerPreference);
        }
        return next;
      }),
    }));
    setNotice(
      `${workflow.batchVariants} variant plan(s) added. Provider execution remains behind the existing approval gate.`,
    );
  }

  async function importWorkflow(file?: File) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const imported = validateWorkflow(parsed);
      setWorkflow(imported);
      setSelectedSceneId(imported.scenes[0].id);
      setNotice('Workflow imported successfully.');
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'Workflow import failed.',
      );
    }
  }

  const preset =
    RENDER_PRESETS.find((item) => item.id === workflow.renderPresetId) ||
    RENDER_PRESETS[0];

  return (
    <section className="output">
      <p className="eyebrow">COMPETITIVE WORKFLOW STUDIO</p>
      <h2>Scene graph, variants, partial reruns and render presets.</h2>
      <p>
        Build once, change one scene, and reroute only that scene instead of
        regenerating the whole production.
      </p>

      <div className="studio">
        <div className="panel">
          <h2>Scene Timeline</h2>
          <label>Project title</label>
          <input
            value={workflow.title}
            onChange={(event) =>
              setWorkflow((current) => ({
                ...current,
                title: event.target.value,
                updatedAt: new Date().toISOString(),
              }))
            }
          />

          <div className="timeline">
            {workflow.scenes.map((scene, index) => (
              <article
                key={scene.id}
                onClick={() => setSelectedSceneId(scene.id)}
                style={{ cursor: 'pointer' }}
              >
                <b>{String(index + 1).padStart(2, '0')}</b>
                <div>
                  <strong>
                    {scene.id === selectedSceneId ? '▶ ' : ''}
                    {scene.title}
                  </strong>
                  <p>
                    {scene.sourceMode} · {scene.durationSeconds}s ·{' '}
                    {scene.variants.length} variant(s) · {scene.status}
                  </p>
                </div>
                <span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      moveScene(scene.id, -1);
                    }}
                  >
                    ↑
                  </button>{' '}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      moveScene(scene.id, 1);
                    }}
                  >
                    ↓
                  </button>
                </span>
              </article>
            ))}
          </div>

          <div className="chips">
            <button type="button" onClick={addScene}>
              + Scene
            </button>
            <button type="button" onClick={copySelected}>
              Duplicate
            </button>
            <button type="button" onClick={() => downloadWorkflow(workflow)}>
              Export JSON
            </button>
            <button type="button" onClick={() => importRef.current?.click()}>
              Import JSON
            </button>
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              style={{ display: 'none' }}
              onChange={(event) => importWorkflow(event.target.files?.[0])}
            />
          </div>
        </div>

        <div className="panel">
          <h2>Selected Scene</h2>
          {selected && (
            <>
              <label>Scene name</label>
              <input
                value={selected.title}
                onChange={(event) =>
                  patchScene(selected.id, { title: event.target.value })
                }
              />

              <label>Prompt</label>
              <textarea
                value={selected.prompt}
                onChange={(event) =>
                  patchScene(selected.id, { prompt: event.target.value })
                }
              />

              <label>Generation mode</label>
              <div className="chips">
                {SOURCE_MODES.map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    className={selected.sourceMode === value ? 'on' : ''}
                    onClick={() =>
                      patchScene(selected.id, { sourceMode: value })
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>

              {selected.sourceMode === 'first-last-frame' && (
                <>
                  <label>First-frame URL</label>
                  <input
                    value={selected.firstFrameUrl || ''}
                    onChange={(event) =>
                      patchScene(selected.id, {
                        firstFrameUrl: event.target.value,
                      })
                    }
                    placeholder="https://…"
                  />
                  <label>Last-frame URL</label>
                  <input
                    value={selected.lastFrameUrl || ''}
                    onChange={(event) =>
                      patchScene(selected.id, {
                        lastFrameUrl: event.target.value,
                      })
                    }
                    placeholder="https://…"
                  />
                </>
              )}

              <label>Duration</label>
              <input
                type="number"
                min="1"
                max="180"
                value={selected.durationSeconds}
                onChange={(event) =>
                  patchScene(selected.id, {
                    durationSeconds: Math.max(
                      1,
                      Math.min(180, Number(event.target.value) || 1),
                    ),
                  })
                }
              />

              <label>Preferred provider</label>
              <select
                value={selected.providerPreference || ''}
                onChange={(event) =>
                  patchScene(selected.id, {
                    providerPreference: event.target.value || undefined,
                  })
                }
              >
                <option value="">Auto router</option>
                <option value="local-wan">Local / Wan</option>
                <option value="gemini-veo">Gemini / Veo</option>
                <option value="runway">Runway</option>
              </select>

              <label>Batch variants</label>
              <div className="chips">
                {[1, 2, 3, 4].map((count) => (
                  <button
                    type="button"
                    key={count}
                    className={workflow.batchVariants === count ? 'on' : ''}
                    onClick={() =>
                      setWorkflow((current) => ({
                        ...current,
                        batchVariants: count,
                      }))
                    }
                  >
                    {count}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="generate"
                onClick={queueVariants}
              >
                ↻ Queue Scene Variants
              </button>

              {selected.variants.length > 0 && (
                <div className="render">
                  <b>{selected.variants.length} planned variant(s)</b>
                  <span>
                    Partial rerun keeps every other approved scene unchanged.
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="studio">
        <div className="panel">
          <h2>Render Profile</h2>
          <label>Preset</label>
          <select
            value={workflow.renderPresetId}
            onChange={(event) =>
              setWorkflow((current) => ({
                ...current,
                renderPresetId: event.target.value,
              }))
            }
          >
            {RENDER_PRESETS.map((item) => (
              <option value={item.id} key={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <div className="render">
            <b>
              {preset.width}×{preset.height} · {preset.fps}fps
            </b>
            <span>
              {preset.aspectRatio} · {preset.bitrateMbps} Mbps · captions{' '}
              {preset.captionSafeArea ? 'safe-area on' : 'safe-area off'}
            </span>
          </div>
        </div>

        <div className="panel">
          <h2>Workflow Portability</h2>
          <p>
            Workflow JSON contains scene order, prompts, source modes, variants,
            provider preferences and render settings. It can be versioned in
            Git, shared between machines or restored later.
          </p>
          <label>Production notes</label>
          <textarea
            value={workflow.notes}
            onChange={(event) =>
              setWorkflow((current) => ({
                ...current,
                notes: event.target.value,
                updatedAt: new Date().toISOString(),
              }))
            }
          />
          {notice && (
            <div className="render">
              <b>Studio notice</b>
              <span>{notice}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
