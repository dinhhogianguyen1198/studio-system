import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/modules/auth/repository/auth.repository")
vi.mock("@/shared/lib/password")

import { authService } from "../auth.service"
import { authRepository } from "@/modules/auth/repository/auth.repository"
import { verifyPassword, hashPassword } from "@/shared/lib/password"

const mockRepo = vi.mocked(authRepository)
const mockVerify = vi.mocked(verifyPassword)
const mockHash = vi.mocked(hashPassword)

const MOCK_ROLE = { id: "role-1", name: "user", isSystem: false, description: null }
const MOCK_USER = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  password: "$2b$12$hashed",
  image: null,
  roleId: "role-1",
  role: MOCK_ROLE,
}

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("validateCredentials", () => {
    it("returns user when credentials are valid", async () => {
      mockRepo.findUserByEmail.mockResolvedValue(MOCK_USER)
      mockVerify.mockResolvedValue(true)

      const result = await authService.validateCredentials("test@example.com", "password123")

      expect(result).toEqual(MOCK_USER)
      expect(mockRepo.findUserByEmail).toHaveBeenCalledWith("test@example.com")
      expect(mockVerify).toHaveBeenCalledWith("password123", MOCK_USER.password)
    })

    it("throws INVALID_CREDENTIALS when user is not found", async () => {
      mockRepo.findUserByEmail.mockResolvedValue(null)

      await expect(
        authService.validateCredentials("nobody@example.com", "pw")
      ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" })

      expect(mockVerify).not.toHaveBeenCalled()
    })

    it("throws INVALID_CREDENTIALS when password is wrong", async () => {
      mockRepo.findUserByEmail.mockResolvedValue(MOCK_USER)
      mockVerify.mockResolvedValue(false)

      await expect(
        authService.validateCredentials("test@example.com", "wrong")
      ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" })
    })

    it("throws INVALID_CREDENTIALS when user has no password (OAuth account)", async () => {
      mockRepo.findUserByEmail.mockResolvedValue({ ...MOCK_USER, password: null })

      await expect(
        authService.validateCredentials("test@example.com", "any")
      ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" })

      expect(mockVerify).not.toHaveBeenCalled()
    })
  })

  describe("registerUser", () => {
    it("creates user and returns id, email, name on success", async () => {
      mockRepo.findUserByEmail.mockResolvedValue(null)
      mockRepo.findDefaultRole.mockResolvedValue(MOCK_ROLE)
      mockHash.mockResolvedValue("$2b$12$newhashed")
      mockRepo.createUser.mockResolvedValue({
        id: "user-new",
        email: "new@example.com",
        name: "New User",
      })

      const result = await authService.registerUser({
        email: "new@example.com",
        password: "Secure@123",
        name: "New User",
      })

      expect(result).toEqual({ id: "user-new", email: "new@example.com", name: "New User" })
      expect(mockHash).toHaveBeenCalledWith("Secure@123")
      expect(mockRepo.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: "new@example.com", roleId: MOCK_ROLE.id })
      )
    })

    it("throws EMAIL_ALREADY_EXISTS when email is taken", async () => {
      mockRepo.findUserByEmail.mockResolvedValue(MOCK_USER)

      await expect(
        authService.registerUser({ email: "test@example.com", password: "pw", name: "X" })
      ).rejects.toMatchObject({ code: "EMAIL_ALREADY_EXISTS" })

      expect(mockRepo.createUser).not.toHaveBeenCalled()
    })

    it("throws ROLE_NOT_FOUND when no default role is configured", async () => {
      mockRepo.findUserByEmail.mockResolvedValue(null)
      mockRepo.findDefaultRole.mockResolvedValue(null)

      await expect(
        authService.registerUser({ email: "new@example.com", password: "pw", name: "X" })
      ).rejects.toMatchObject({ code: "ROLE_NOT_FOUND" })

      expect(mockRepo.createUser).not.toHaveBeenCalled()
    })
  })

  describe("changePassword", () => {
    it("updates password when current password is correct", async () => {
      mockRepo.findUserById.mockResolvedValue(MOCK_USER)
      mockVerify.mockResolvedValue(true)
      mockHash.mockResolvedValue("$2b$12$updated")
      mockRepo.updatePassword.mockResolvedValue(undefined)

      await expect(
        authService.changePassword("user-1", "old_password", "new_password")
      ).resolves.toBeUndefined()

      expect(mockRepo.updatePassword).toHaveBeenCalledWith("user-1", "$2b$12$updated")
    })

    it("throws INVALID_CREDENTIALS when user has no password", async () => {
      mockRepo.findUserById.mockResolvedValue({ ...MOCK_USER, password: null })

      await expect(
        authService.changePassword("user-1", "any", "new")
      ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" })

      expect(mockVerify).not.toHaveBeenCalled()
    })

    it("throws INVALID_CREDENTIALS when current password is wrong", async () => {
      mockRepo.findUserById.mockResolvedValue(MOCK_USER)
      mockVerify.mockResolvedValue(false)

      await expect(
        authService.changePassword("user-1", "wrong_old", "new_password")
      ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" })

      expect(mockRepo.updatePassword).not.toHaveBeenCalled()
    })
  })
})
