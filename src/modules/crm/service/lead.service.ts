import { leadRepository } from "../repository/lead.repository"
import type { LeadFilters, CrmError } from "../types/crm.types"
import type { CreateLeadInput, UpdateLeadInput } from "../schemas/crm.schema"

export const leadService = {
  async listLeads(filters: LeadFilters) {
    return leadRepository.findMany(filters)
  },

  async getLead(id: string) {
    const lead = await leadRepository.findById(id)
    if (!lead) {
      throw { code: "LEAD_NOT_FOUND", message: "Không tìm thấy lead" } satisfies CrmError
    }
    return lead
  },

  async createLead(data: CreateLeadInput, createdById: string) {
    return leadRepository.create({ ...data, createdById })
  },

  async updateLead(id: string, data: UpdateLeadInput) {
    const existing = await leadRepository.findById(id)
    if (!existing) {
      throw { code: "LEAD_NOT_FOUND", message: "Không tìm thấy lead" } satisfies CrmError
    }
    return leadRepository.update(id, data)
  },

  async deleteLead(id: string) {
    const existing = await leadRepository.findById(id)
    if (!existing) {
      throw { code: "LEAD_NOT_FOUND", message: "Không tìm thấy lead" } satisfies CrmError
    }
    return leadRepository.delete(id)
  },

  // ── Notes ──────────────────────────────────────────────────────────────────

  async addNote(leadId: string, content: string, authorId: string) {
    const lead = await leadRepository.findById(leadId)
    if (!lead) {
      throw { code: "LEAD_NOT_FOUND", message: "Không tìm thấy lead" } satisfies CrmError
    }
    return leadRepository.createNote({ leadId, content, authorId })
  },

  async updateNote(noteId: string, content: string, requesterId: string) {
    const note = await leadRepository.findNoteById(noteId)
    if (!note) {
      throw { code: "NOTE_NOT_FOUND", message: "Không tìm thấy ghi chú" } satisfies CrmError
    }
    if (note.authorId !== requesterId) {
      throw { code: "FORBIDDEN", message: "Bạn không có quyền chỉnh sửa ghi chú này" } satisfies CrmError
    }
    return leadRepository.updateNote(noteId, content)
  },

  async deleteNote(noteId: string, requesterId: string) {
    const note = await leadRepository.findNoteById(noteId)
    if (!note) {
      throw { code: "NOTE_NOT_FOUND", message: "Không tìm thấy ghi chú" } satisfies CrmError
    }
    if (note.authorId !== requesterId) {
      throw { code: "FORBIDDEN", message: "Bạn không có quyền xóa ghi chú này" } satisfies CrmError
    }
    return leadRepository.deleteNote(noteId)
  },

  async getStats() {
    const [byStatus, valueByStatus] = await Promise.all([
      leadRepository.countByStatus(),
      leadRepository.sumValueByStatus(),
    ])
    return { byStatus, valueByStatus }
  },
}
