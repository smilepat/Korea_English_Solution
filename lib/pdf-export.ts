"use client"

export async function exportToPDF(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId)
  if (!element) {
    alert("내보낼 내용이 없습니다.")
    return
  }

  // Dynamic imports to keep bundle small
  const html2canvas = (await import("html2canvas")).default
  const { jsPDF } = await import("jspdf")

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  })

  const imgData = canvas.toDataURL("image/png")
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pdfWidth - 20 // 10mm margins
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 10 // top margin

  // First page
  pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight)
  heightLeft -= (pdfHeight - 20)

  // Additional pages if content is long
  while (heightLeft > 0) {
    position = heightLeft - imgHeight + 10
    pdf.addPage()
    pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight)
    heightLeft -= (pdfHeight - 20)
  }

  pdf.save(filename)
}
