export type VideoToolSideEffect =
  | 'read'
  | 'draft'
  | 'write'
  | 'external'
  | 'destructive';

export type VideoToolContext = {
  missionId: string;
  actorId: string;
  approvalId?: string;
  idempotencyKey: string;
};

export type VideoToolResult<T> =
  | { ok: true; data: T; eventId: string; warnings?: string[] }
  | {
      ok: false;
      code: string;
      retryable: boolean;
      message: string;
      eventId: string;
    };

export interface VideoToolContract<Input, Output> {
  name: string;
  description: string;
  sideEffect: VideoToolSideEffect;
  timeoutMs: number;
  validate(input: unknown): Input;
  authorize(context: VideoToolContext, input: Input): Promise<void>;
  execute(
    context: VideoToolContext,
    input: Input,
  ): Promise<VideoToolResult<Output>>;
}

export async function runVideoTool<Input, Output>(
  tool: VideoToolContract<Input, Output>,
  context: VideoToolContext,
  rawInput: unknown,
) {
  const input = tool.validate(rawInput);

  if (
    ['external', 'destructive'].includes(tool.sideEffect) &&
    !context.approvalId
  ) {
    throw new Error(
      `Scoped human approval is required before "${tool.name}" can perform an external action.`,
    );
  }

  await tool.authorize(context, input);

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      tool.execute(context, input),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Tool timeout: ${tool.name}`)),
          tool.timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
