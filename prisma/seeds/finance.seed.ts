import { db } from "../client"

const EXPENSE_CATEGORIES = [
  { name: "Nhân sự", slug: "nhan-su", color: "#3B82F6", description: "Chi phí thuê freelancer, nhân viên thời vụ", sortOrder: 1 },
  { name: "Thiết bị", slug: "thiet-bi", color: "#8B5CF6", description: "Thuê hoặc mua thiết bị quay phim, ánh sáng", sortOrder: 2 },
  { name: "Studio", slug: "studio", color: "#EC4899", description: "Thuê studio, địa điểm chụp hình", sortOrder: 3 },
  { name: "Di chuyển", slug: "di-chuyen", color: "#F59E0B", description: "Xăng xe, taxi, vé máy bay", sortOrder: 4 },
  { name: "In ấn", slug: "in-an", color: "#10B981", description: "In ảnh, album, sản phẩm in ấn", sortOrder: 5 },
  { name: "Marketing", slug: "marketing", color: "#EF4444", description: "Quảng cáo, mạng xã hội, SEO", sortOrder: 6 },
  { name: "Phần mềm", slug: "phan-mem", color: "#6366F1", description: "Subscription phần mềm, cloud storage", sortOrder: 7 },
  { name: "Văn phòng", slug: "van-phong", color: "#64748B", description: "Văn phòng phẩm, tiện ích văn phòng", sortOrder: 8 },
  { name: "Chi phí khác", slug: "chi-phi-khac", color: "#94A3B8", description: "Chi phí phát sinh không phân loại được", sortOrder: 9 },
]

export async function seedFinance() {
  console.log("Đang seed expense categories...")

  for (const cat of EXPENSE_CATEGORIES) {
    await db.expenseCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, color: cat.color, sortOrder: cat.sortOrder },
      create: cat,
    })
  }

  console.log(`  ✓ ${EXPENSE_CATEGORIES.length} expense categories`)
}
