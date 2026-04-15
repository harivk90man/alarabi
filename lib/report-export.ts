// PDF and CSV export utilities for APF Maintenance Tracker
import type { ReportData } from '@/components/reports/ReportsView'

/** Loads an image URL into a base64 data URL via HTMLImageElement + Canvas.
 *  Works reliably for same-origin assets with no CORS complications. */
function loadImageAsDataURL(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('No canvas context')); return }
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

const LOGO_URL = '/logo-white.png'  // served from same origin — no CORS
const BRAND_GREEN = '#0d7a3e'
const HEADER_BG: [number, number, number] = [13, 51, 32]   // #0d3320
const ACCENT: [number, number, number] = [13, 122, 62]     // #0d7a3e

function formatDate(d: Date) {
  return d.toLocaleDateString('en-KW', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── CSV ──────────────────────────────────────────────────────────────────────

export function exportCSV(data: ReportData, from: Date, to: Date) {
  const lines: string[] = []

  const header = (title: string) => [`\n# ${title}`]

  // Meta
  lines.push(`# Al Arabi Plastic Factory — Maintenance Report`)
  lines.push(`# Period: ${formatDate(from)} to ${formatDate(to)}`)
  lines.push(`# Generated: ${new Date().toLocaleString('en-KW')}`)

  // Summary
  lines.push(...header('SUMMARY'))
  lines.push('Metric,Value')
  lines.push(`Total Issues,${data.summary.total}`)
  lines.push(`Breakdowns,${data.summary.breakdowns}`)
  lines.push(`Minor Issues,${data.summary.minor}`)
  lines.push(`Preventive,${data.summary.preventive}`)
  lines.push(`Total Downtime (min),${data.totalDowntimeMin}`)

  // Issues
  lines.push(...header('ALL ISSUES'))
  lines.push('Issue #,Machine,Type,Status,Description,Reporter,Assigned To,Start Time,End Time,Duration (min),Downtime')
  for (const i of data.issues) {
    const row = [
      i.issue_number, i.machine_id, i.type, i.status,
      `"${(i.description ?? '').replace(/"/g, '""')}"`,
      i.reporter_name ?? '', i.assignee_name ?? '',
      i.start_time ? new Date(i.start_time).toLocaleString('en-KW') : '',
      i.end_time ? new Date(i.end_time).toLocaleString('en-KW') : '',
      i.duration_minutes ?? '',
      i.downtime ? 'Yes' : 'No',
    ]
    lines.push(row.join(','))
  }

  // Downtime by machine
  lines.push(...header('DOWNTIME BY MACHINE'))
  lines.push('Machine ID,Total Downtime (min),Total Downtime (h m)')
  for (const d of data.downtimeMachines) {
    const h = Math.floor(d.total_minutes / 60)
    const m = Math.round(d.total_minutes % 60)
    lines.push(`${d.machine_id},${d.total_minutes},${h}h ${m}m`)
  }

  // Operator performance
  lines.push(...header('OPERATOR PERFORMANCE'))
  lines.push('Name,Issues Resolved,Avg Resolution Time (min)')
  for (const op of data.operatorStats) {
    lines.push(`"${op.name}",${op.resolved},${op.avg_minutes}`)
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `APF-Maintenance-Report-${formatDate(from)}-to-${formatDate(to)}.csv`.replace(/\s/g, '-')
  a.click()
  URL.revokeObjectURL(url)
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

export async function exportPDF(data: ReportData, from: Date, to: Date) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 14

  // ── Header bar ──────────────────────────────────────────────────────────────
  doc.setFillColor(...HEADER_BG)
  doc.rect(0, 0, pageW, 28, 'F')

  // Accent border line
  doc.setFillColor(...ACCENT)
  doc.rect(0, 28, pageW, 1.2, 'F')

  // Load logo via Image + Canvas (same-origin, no CORS issues)
  try {
    const dataUrl = await loadImageAsDataURL(LOGO_URL)
    doc.addImage(dataUrl, 'PNG', margin, 5, 40, 16)
  } catch {
    // Text fallback if image fails
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Al Arabi Plastic Factory', margin, 17)
  }

  // Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Maintenance Report', pageW - margin, 12, { align: 'right' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`${formatDate(from)} — ${formatDate(to)}`, pageW - margin, 18, { align: 'right' })
  doc.text(`Generated: ${new Date().toLocaleString('en-KW')}`, pageW - margin, 23, { align: 'right' })

  let y = 36

  // ── Summary cards ───────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(30, 30, 30)
  doc.text('Summary', margin, y)
  y += 5

  const summaryItems = [
    { label: 'Total Issues', value: String(data.summary.total), color: [30, 30, 30] as [number,number,number] },
    { label: 'Breakdowns', value: String(data.summary.breakdowns), color: [220, 38, 38] as [number,number,number] },
    { label: 'Minor Issues', value: String(data.summary.minor), color: [180, 83, 9] as [number,number,number] },
    { label: 'Preventive', value: String(data.summary.preventive), color: [29, 78, 216] as [number,number,number] },
    { label: 'Total Downtime', value: fmtDur(data.totalDowntimeMin), color: [220, 38, 38] as [number,number,number] },
  ]

  const cardW = (pageW - margin * 2 - 4 * 3) / 5
  summaryItems.forEach((item, i) => {
    const x = margin + i * (cardW + 3)
    doc.setFillColor(248, 250, 248)
    doc.setDrawColor(220, 220, 220)
    doc.roundedRect(x, y, cardW, 18, 2, 2, 'FD')
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...item.color)
    doc.text(item.value, x + cardW / 2, y + 10, { align: 'center' })
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(item.label, x + cardW / 2, y + 15.5, { align: 'center' })
  })
  y += 24

  // ── Issue Type Distribution bar ──────────────────────────────────────────
  if (data.summary.total > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    doc.text('Issue Type Distribution', margin, y)
    y += 4

    const barW = pageW - margin * 2
    const barH = 8
    const total = data.summary.total || 1
    const bPct = data.summary.breakdowns / total
    const mPct = data.summary.minor / total
    const pPct = data.summary.preventive / total

    let bx = margin
    if (bPct > 0) {
      doc.setFillColor(220, 38, 38)
      doc.rect(bx, y, barW * bPct, barH, 'F')
      bx += barW * bPct
    }
    if (mPct > 0) {
      doc.setFillColor(180, 83, 9)
      doc.rect(bx, y, barW * mPct, barH, 'F')
      bx += barW * mPct
    }
    if (pPct > 0) {
      doc.setFillColor(29, 78, 216)
      doc.rect(bx, y, barW * pPct, barH, 'F')
    }
    y += barH + 3

    // Legend
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    const legendItems = [
      { color: [220,38,38] as [number,number,number], label: `Breakdown (${data.summary.breakdowns})` },
      { color: [180,83,9] as [number,number,number], label: `Minor (${data.summary.minor})` },
      { color: [29,78,216] as [number,number,number], label: `Preventive (${data.summary.preventive})` },
    ]
    let lx = margin
    legendItems.forEach(l => {
      doc.setFillColor(...l.color)
      doc.rect(lx, y, 4, 3, 'F')
      doc.setTextColor(60, 60, 60)
      doc.text(l.label, lx + 5.5, y + 2.5)
      lx += 45
    })
    y += 8
  }

  // ── Top Downtime Machines ───────────────────────────────────────────────────
  if (data.downtimeMachines.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    doc.text('Top Downtime Machines', margin, y)
    y += 2

    autoTable(doc, {
      startY: y,
      head: [['Rank', 'Machine ID', 'Total Downtime', 'Hours / Min']],
      body: data.downtimeMachines.slice(0, 10).map((d, i) => [
        String(i + 1),
        d.machine_id,
        `${d.total_minutes} min`,
        fmtDur(d.total_minutes),
      ]),
      margin: { left: margin, right: margin },
      headStyles: { fillColor: ACCENT, textColor: [255,255,255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 248] },
      columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 30, font: 'courier' }, 2: { cellWidth: 28 }, 3: { cellWidth: 28 } },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  }

  // ── Operator Performance ────────────────────────────────────────────────────
  if (data.operatorStats.length > 0) {
    if (y > pageH - 60) { doc.addPage(); y = 20 }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    doc.text('Operator Performance', margin, y)
    y += 2

    autoTable(doc, {
      startY: y,
      head: [['Name', 'Issues Resolved', 'Avg Resolution Time']],
      body: data.operatorStats.map(op => [
        op.name,
        String(op.resolved),
        op.avg_minutes > 0 ? fmtDur(op.avg_minutes) : '—',
      ]),
      margin: { left: margin, right: margin },
      headStyles: { fillColor: ACCENT, textColor: [255,255,255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 248] },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  }

  // ── Issues Detail ───────────────────────────────────────────────────────────
  if (data.issues.length > 0) {
    if (y > pageH - 60) { doc.addPage(); y = 20 }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    doc.text('Issues Detail', margin, y)
    y += 2

    autoTable(doc, {
      startY: y,
      head: [['Issue #', 'Machine', 'Type', 'Status', 'Description', 'Assigned To', 'Duration']],
      body: data.issues.map(i => [
        i.issue_number,
        i.machine_id,
        i.type,
        i.status,
        (i.description ?? '').substring(0, 50) + (i.description?.length > 50 ? '…' : ''),
        i.assignee_name ?? '—',
        i.duration_minutes ? fmtDur(i.duration_minutes) : '—',
      ]),
      margin: { left: margin, right: margin },
      headStyles: { fillColor: ACCENT, textColor: [255,255,255], fontStyle: 'bold', fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 250, 248] },
      columnStyles: {
        0: { cellWidth: 18, font: 'courier' },
        1: { cellWidth: 16, font: 'courier' },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 68 },
        5: { cellWidth: 26 },
        6: { cellWidth: 16 },
      },
      didParseCell: (hookData) => {
        if (hookData.column.index === 2 && hookData.section === 'body') {
          const type = hookData.cell.text[0]
          if (type === 'breakdown') hookData.cell.styles.textColor = [220, 38, 38]
          else if (type === 'minor') hookData.cell.styles.textColor = [180, 83, 9]
          else if (type === 'preventive') hookData.cell.styles.textColor = [29, 78, 216]
        }
        if (hookData.column.index === 3 && hookData.section === 'body') {
          const status = hookData.cell.text[0]
          if (status === 'resolved') hookData.cell.styles.textColor = [22, 163, 74]
          else if (status === 'open') hookData.cell.styles.textColor = [220, 38, 38]
        }
      },
    })
  }

  // ── Footer on every page ────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFillColor(...HEADER_BG)
    doc.rect(0, pageH - 12, pageW, 12, 'F')
    doc.setFillColor(...ACCENT)
    doc.rect(0, pageH - 12, pageW, 0.8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('Al Arabi Plastic Factory · Sabhan Industrial, Kuwait · Internal Use Only', margin, pageH - 5)
    doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 5, { align: 'right' })
  }

  doc.save(`APF-Maintenance-Report-${formatDate(from)}-to-${formatDate(to)}.pdf`.replace(/\s/g, '-'))
}

function fmtDur(minutes: number): string {
  if (!minutes) return '0m'
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
