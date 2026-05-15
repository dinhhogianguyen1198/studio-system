/**
 * Workflow Engine — pure functions, không có Prisma hay HTTP.
 * Mọi business rule về state machine nằm ở đây.
 */

export interface TransitionRule {
  fromStepId: string
  toStepId: string
  requireNote: boolean
}

export interface TransitionContext {
  currentStepId: string | null
  targetStepId: string
  availableTransitions: TransitionRule[]
}

/**
 * Kiểm tra transition có hợp lệ không.
 * Nếu currentStepId là null (item chưa có step), chỉ cho phép nếu không có transition nào
 * được định nghĩa (template chưa setup) — trường hợp này không nên xảy ra trong production.
 */
export function canTransition(ctx: TransitionContext): boolean {
  if (ctx.currentStepId === null) return false
  return ctx.availableTransitions.some(
    (t) => t.fromStepId === ctx.currentStepId && t.toStepId === ctx.targetStepId,
  )
}

export function requiresNote(ctx: TransitionContext): boolean {
  const transition = ctx.availableTransitions.find(
    (t) => t.fromStepId === ctx.currentStepId && t.toStepId === ctx.targetStepId,
  )
  return transition?.requireNote ?? false
}

/**
 * Validate transition, throw error code nếu không hợp lệ.
 * Service layer sẽ catch và xử lý.
 */
export function validateTransition(ctx: TransitionContext, note: string | undefined): void {
  if (!canTransition(ctx)) throw new Error("INVALID_TRANSITION")
  if (requiresNote(ctx) && !note?.trim()) throw new Error("NOTE_REQUIRED_FOR_TRANSITION")
}

/**
 * Lấy danh sách các step có thể chuyển tới từ step hiện tại.
 */
export function getAvailableTargets(
  currentStepId: string | null,
  transitions: TransitionRule[],
): string[] {
  if (currentStepId === null) return []
  return transitions
    .filter((t) => t.fromStepId === currentStepId)
    .map((t) => t.toStepId)
}
