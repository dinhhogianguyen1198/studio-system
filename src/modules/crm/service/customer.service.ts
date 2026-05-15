import { customerRepository } from "../repository/customer.repository"
import type { CustomerFilters, CrmError } from "../types/crm.types"
import type { CreateCustomerInput, UpdateCustomerInput } from "../schemas/crm.schema"

export const customerService = {
  async listCustomers(filters: CustomerFilters) {
    return customerRepository.findMany(filters)
  },

  async getCustomer(id: string) {
    const customer = await customerRepository.findById(id)
    if (!customer) {
      throw { code: "CUSTOMER_NOT_FOUND", message: "Không tìm thấy khách hàng" } satisfies CrmError
    }
    return customer
  },

  async createCustomer(data: CreateCustomerInput, createdById: string) {
    return customerRepository.create({ ...data, createdById })
  },

  async updateCustomer(id: string, data: UpdateCustomerInput) {
    const existing = await customerRepository.findById(id)
    if (!existing) {
      throw { code: "CUSTOMER_NOT_FOUND", message: "Không tìm thấy khách hàng" } satisfies CrmError
    }
    return customerRepository.update(id, data)
  },

  async deleteCustomer(id: string) {
    const existing = await customerRepository.findById(id)
    if (!existing) {
      throw { code: "CUSTOMER_NOT_FOUND", message: "Không tìm thấy khách hàng" } satisfies CrmError
    }
    return customerRepository.delete(id)
  },

  // ── Notes ──────────────────────────────────────────────────────────────────

  async addNote(customerId: string, content: string, authorId: string) {
    const customer = await customerRepository.findById(customerId)
    if (!customer) {
      throw { code: "CUSTOMER_NOT_FOUND", message: "Không tìm thấy khách hàng" } satisfies CrmError
    }
    return customerRepository.createNote({ customerId, content, authorId })
  },

  async updateNote(noteId: string, content: string, requesterId: string) {
    const note = await customerRepository.findNoteById(noteId)
    if (!note) {
      throw { code: "NOTE_NOT_FOUND", message: "Không tìm thấy ghi chú" } satisfies CrmError
    }
    if (note.authorId !== requesterId) {
      throw { code: "FORBIDDEN", message: "Bạn không có quyền chỉnh sửa ghi chú này" } satisfies CrmError
    }
    return customerRepository.updateNote(noteId, content)
  },

  async deleteNote(noteId: string, requesterId: string) {
    const note = await customerRepository.findNoteById(noteId)
    if (!note) {
      throw { code: "NOTE_NOT_FOUND", message: "Không tìm thấy ghi chú" } satisfies CrmError
    }
    if (note.authorId !== requesterId) {
      throw { code: "FORBIDDEN", message: "Bạn không có quyền xóa ghi chú này" } satisfies CrmError
    }
    return customerRepository.deleteNote(noteId)
  },

  async getStats() {
    return customerRepository.countByStatus()
  },
}
