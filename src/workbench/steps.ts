export const WORKBENCH_STEPS = ['system', 'repositories', 'review', 'export'] as const

export type WorkbenchStep = typeof WORKBENCH_STEPS[number]
