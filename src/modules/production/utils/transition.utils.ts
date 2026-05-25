import type { KanbanTransitionInfo } from "../types/production.types"

export function getTransitionInfo(
  fromStatus: string,
  toStatus: string,
  isFullyPaid: boolean,
): KanbanTransitionInfo {
  if (fromStatus === toStatus) {
    return {
      type: "BLOCKED_SAME_STATUS",
      canDrop: false,
      actionLabel: "",
      description: "Đơn đang ở trạng thái này rồi",
    }
  }

  if (fromStatus === "COMPLETED") {
    return {
      type: "BLOCKED_FINAL_STATE",
      canDrop: false,
      actionLabel: "",
      description: "Đơn đã hoàn thành không thể thay đổi",
    }
  }

  const autoComputedTargets = [
    "OVERDUE",
    "WAITING_FILES",
    "PARTIAL_DELIVERY",
    "NEW",
  ]
  if (autoComputedTargets.includes(toStatus)) {
    return {
      type: "BLOCKED_AUTO_COMPUTED",
      canDrop: false,
      actionLabel: "",
      description: "Trạng thái này được tính toán tự động từ hệ thống",
    }
  }

  if (toStatus === "FILES_DELIVERED") {
    return {
      type: "MARK_ALL_DELIVERED",
      canDrop: true,
      actionLabel: "Đánh dấu đã giao file",
      description: "Tất cả items chưa giao sẽ được đánh dấu là đã giao file.",
    }
  }

  if (toStatus === "COMPLETED") {
    if (!isFullyPaid) {
      return {
        type: "BLOCKED_REQUIRES_PAYMENT",
        canDrop: false,
        actionLabel: "",
        description: "Đơn chưa thanh toán đầy đủ",
        warning: "Cần ghi nhận đủ thanh toán trước khi hoàn thành đơn",
      }
    }
    return {
      type: "CONFIRM_COMPLETED",
      canDrop: true,
      actionLabel: "Xác nhận hoàn thành",
      description: "Xác nhận đơn đã giao đủ file và thanh toán đầy đủ.",
    }
  }

  return {
    type: "BLOCKED_AUTO_COMPUTED",
    canDrop: false,
    actionLabel: "",
    description: "Không thể thực hiện chuyển trạng thái này",
  }
}
