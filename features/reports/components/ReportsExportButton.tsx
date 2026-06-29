"use client";

import { Download } from "lucide-react";

import { ActionButton } from "@/components/action-button";

interface ReportSheet {
  name: string;
  rows: Record<string, string | number>[];
}

interface ReportsExportButtonProps {
  fileName: string;
  sheets: ReportSheet[];
}

function escapeCell(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildTable(sheet: ReportSheet) {
  const headers = Array.from(
    sheet.rows.reduce<Set<string>>((keys, row) => {
      Object.keys(row).forEach((key) => keys.add(key));
      return keys;
    }, new Set())
  );

  return `
    <h2>${escapeCell(sheet.name)}</h2>
    <table>
      <thead>
        <tr>${headers.map((header) => `<th>${escapeCell(header)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${sheet.rows
          .map(
            (row) =>
              `<tr>${headers
                .map((header) => `<td>${escapeCell(row[header] ?? "")}</td>`)
                .join("")}</tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;
}

export function ReportsExportButton({
  fileName,
  sheets,
}: ReportsExportButtonProps) {
  function handleExport() {
    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; }
            h2 { margin: 24px 0 8px; }
            table { border-collapse: collapse; margin-bottom: 28px; width: 100%; }
            th, td { border: 1px solid #d4d4d8; padding: 8px; text-align: left; }
            th { background: #f4f4f5; font-weight: 700; }
          </style>
        </head>
        <body>${sheets.map(buildTable).join("")}</body>
      </html>
    `;
    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${fileName}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <ActionButton
      onAction={handleExport}
      loadingLabel="Exporting..."
      className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
    >
      <Download className="h-4 w-4" />
      Export XLS
    </ActionButton>
  );
}
