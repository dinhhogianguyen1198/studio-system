import { db } from "@/shared/lib/prisma"
import type { LeadFilters } from "../types/crm.types"
import type { CreateLeadInput, UpdateLeadInput } from "../schemas/crm.schema"

// ─── Reusable select fragments ────────────────────────────────────────────────

const leadSummarySelect = {
  id: true,
  title: true,
  contactName: true,
  contactEmail: true,
  contactPhone: true,
  value: true,
  currency: true,
  status: true,
  priority: true,
  source: true,
  expectedCloseDate: true,
  createdAt: true,
  customer: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
} as const

const leadDetailInclude = {
  createdBy: { select: { id: true, name: true, email: true } },
  notes: {
    select: {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      author: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" as const },
  },
} as const

// ─── Repository ───────────────────────────────────────────────────────────────

export const leadRepository = {
  async findMany(filters: LeadFilters) {
    const {
      search,
      status,
      priority,
      source,
      assignedToId,
      customerId,
      page = 1,
      pageSize = 20,
    } = filters
    const skip = (page - 1) * pageSize

    const where = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { contactName: { contains: search, mode: "insensitive" as const } },
          { contactEmail: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(source && { source }),
      ...(assignedToId && { assignedToId }),
      ...(customerId && { customerId }),
    }

    const [data, total] = await Promise.all([
      db.lead.findMany({
        where,
        select: leadSummarySelect,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      db.lead.count({ where }),
    ])

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  },

  async findById(id: string) {
    return db.lead.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        value: true,
        currency: true,
        status: true,
        priority: true,
        source: true,
        expectedCloseDate: true,
        closedAt: true,
        createdAt: true,
        updatedAt: true,
        customer: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        ...leadDetailInclude,
      },
    })
  },

  async create(data: CreateLeadInput & { createdById: string }) {
    return db.lead.create({
      data: {
        title: data.title,
        contactName: data.contactName,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        value: data.value !== "" && data.value !== undefined ? String(data.value) : null,
        currency: data.currency ?? "VND",
        status: data.status,
        priority: data.priority,
        source: data.source,
        customerId: data.customerId || null,
        assignedToId: data.assignedToId || null,
        createdById: data.createdById,
        expectedCloseDate:
          data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
      },
    })
  },

  async update(id: string, data: UpdateLeadInput) {
    const closedAt =
      (data.status === "WON" || data.status === "LOST") ? new Date() : undefined

    return db.lead.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.contactName && { contactName: data.contactName }),
        contactEmail:
          data.contactEmail !== undefined ? data.contactEmail || null : undefined,
        contactPhone:
          data.contactPhone !== undefined ? data.contactPhone || null : undefined,
        value:
          data.value !== undefined
            ? data.value !== "" && data.value !== null
              ? String(data.value)
              : null
            : undefined,
        ...(data.currency && { currency: data.currency }),
        ...(data.status && { status: data.status }),
        ...(data.priority && { priority: data.priority }),
        ...(data.source && { source: data.source }),
        customerId: data.customerId !== undefined ? data.customerId || null : undefined,
        assignedToId:
          data.assignedToId !== undefined ? data.assignedToId || null : undefined,
        expectedCloseDate:
          data.expectedCloseDate !== undefined
            ? data.expectedCloseDate
              ? new Date(data.expectedCloseDate)
              : null
            : undefined,
        ...(closedAt !== undefined && { closedAt }),
      },
    })
  },

  async delete(id: string) {
    return db.lead.delete({ where: { id } })
  },

  // ── Notes ──────────────────────────────────────────────────────────────────

  async createNote(data: { leadId: string; content: string; authorId: string }) {
    return db.leadNote.create({
      data,
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, name: true, email: true } },
      },
    })
  },

  async updateNote(noteId: string, content: string) {
    return db.leadNote.update({
      where: { id: noteId },
      data: { content },
    })
  },

  async deleteNote(noteId: string) {
    return db.leadNote.delete({ where: { id: noteId } })
  },

  async findNoteById(noteId: string) {
    return db.leadNote.findUnique({ where: { id: noteId } })
  },

  // ── Stats ──────────────────────────────────────────────────────────────────

  async countByStatus() {
    const statuses = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const
    const counts = await Promise.all(
      statuses.map((status) => db.lead.count({ where: { status } }))
    )
    return statuses.map((status, i) => ({ status, _count: { _all: counts[i] } }))
  },

  async sumValueByStatus() {
    const statuses = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const
    const results = await Promise.all(
      statuses.map((status) =>
        db.lead.aggregate({ where: { status }, _sum: { value: true } })
      )
    )
    return statuses.map((status, i) => ({ status, _sum: { value: results[i]._sum.value } }))
  },
}
