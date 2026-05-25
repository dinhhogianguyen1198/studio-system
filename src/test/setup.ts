import { vi } from "vitest"

// Mock Next.js server-only guard so service imports work in Node test env
vi.mock("server-only", () => ({}))
