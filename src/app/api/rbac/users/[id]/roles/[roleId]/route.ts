import { NextResponse } from "next/server"

const DISABLED = { error: "Multi-role management is disabled — system uses single-role per user." }

export function DELETE(): NextResponse {
  return NextResponse.json(DISABLED, { status: 410 })
}
