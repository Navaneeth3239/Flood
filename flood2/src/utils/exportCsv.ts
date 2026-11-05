/**
 * Generates and downloads a CSV file from an array of objects
 */
export function exportToCsv<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: { key: keyof T; label: string }[]
) {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  const columns = headers || Object.keys(data[0]).map((key) => ({ key, label: key }));

  const csvRows: string[] = [];

  // Header row
  csvRows.push(columns.map((c) => `"${String(c.label).replace(/"/g, '""')}"`).join(','));

  // Data rows
  for (const row of data) {
    const values = columns.map((col) => {
      const val = row[col.key];
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\r\n');
  // Include UTF-8 BOM (\uFEFF) so Excel correctly renders Indic scripts (Malayalam, Tamil, Hindi)
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
