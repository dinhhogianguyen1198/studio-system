import { db } from "@/shared/lib/prisma"
import type { CustomerFilters } from "../types/crm.types"
import type { CreateCustomerInput, UpdateCustomerInput } from "../schemas/crm.schema"

// ─── Reusable select fragments ────────────────────────────────────────────────

const customerSummarySelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  company: true,
  address: true,
  status: true,
  source: true,
  tags: true,
  createdAt: true,
  _count: { select: { notes: true } },
} as const

const customerDetailInclude = {
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
  leads: {
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      value: true,
      currency: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" as const },
    take: 10,
  },
} as const

// ─── Repository ───────────────────────────────────────────────────────────────

export const customerRepository = {
  async findMany(filters: CustomerFilters) {
    const { search, page = 1, pageSize = 20 } = filters
    const skip = (page - 1) * pageSize

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
          { company: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      db.customer.findMany({
        where,
        select: customerSummarySelect,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      db.customer.count({ where }),
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
    return db.customer.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        address: true,
        status: true,
        source: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        ...customerDetailInclude,
      },
    })
  },

  async findByEmail(email: string) {
    return db.customer.findFirst({ where: { email } })
  },

  async create(data: CreateCustomerInput & { createdById: string }) {
    return db.customer.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        createdById: data.createdById,
      },
    })
  },

  async update(id: string, data: UpdateCustomerInput) {
    return db.customer.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        email: data.email !== undefined ? data.email || null : undefined,
        phone: data.phone !== undefined ? data.phone || null : undefined,
        address: data.address !== undefined ? data.address || null : undefined,
      },
    })
  },

  async delete(id: string) {
    return db.customer.delete({ where: { id } })
  },

  // ── Notes ──────────────────────────────────────────────────────────────────

  async createNote(data: { customerId: string; content: string; authorId: string }) {
    return db.customerNote.create({
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
    return db.customerNote.update({
      where: { id: noteId },
      data: { content },
    })
  },

  async deleteNote(noteId: string) {
    return db.customerNote.delete({ where: { id: noteId } })
  },

  async findNoteById(noteId: string) {
    return db.customerNote.findUnique({ where: { id: noteId } })
  },

}
