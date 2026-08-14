/**
 * Utility for exporting rich styled Microsoft Excel (.xlsx / .xls XML) and CSV files
 * directly from browser memory with native styling, headers, currency formats, and formulas.
 */

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  type?: 'string' | 'number' | 'currency_usd' | 'currency_bs' | 'date' | 'percent';
}

export interface ExcelExportOptions {
  fileName: string;
  sheetName: string;
  title: string;
  subtitle?: string;
  columns: ExcelColumn[];
  data: Record<string, any>[];
  summaryRows?: {
    label: string;
    values: Record<string, number | string>;
  }[];
}

export function exportToStyledExcel(options: ExcelExportOptions) {
  const { fileName, sheetName, title, subtitle, columns, data, summaryRows } = options;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>${title}</Title>
  <Author>ERP ARI - Business Intelligence</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#1E293B"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="HeaderTitle">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="16" ss:Bold="1" ss:Color="#4338CA"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="HeaderSubtitle">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Color="#64748B" ss:Italic="1"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="TableHeader">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#4338CA" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#312E81"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#4F46E5"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#4F46E5"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#312E81"/>
   </Borders>
  </Style>
  <Style ss:ID="DataString">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="DataNumber">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="DataCurrencyUSD">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="&quot;$&quot;#,##0.00"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="DataCurrencyBS">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="&quot;Bs. &quot;#,##0.00"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#334155"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="DataPercent">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="0.0%"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#059669"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalRow">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="12" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#EEF2FF" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#6366F1"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#4338CA"/>
   </Borders>
   <Alignment ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${sheetName}">
  <Table ss:DefaultRowHeight="20">
`;

  // Column definitions
  columns.forEach((col) => {
    xml += `   <Column ss:Width="${col.width || 120}"/>\n`;
  });

  // Title rows
  xml += `   <Row ss:Height="28">
    <Cell ss:StyleID="HeaderTitle"><Data ss:Type="String">${title}</Data></Cell>
   </Row>\n`;

  if (subtitle) {
    xml += `   <Row ss:Height="18">
    <Cell ss:StyleID="HeaderSubtitle"><Data ss:Type="String">${subtitle}</Data></Cell>
   </Row>\n`;
  }

  xml += `   <Row ss:Height="8"><Cell/></Row>\n`;

  // Table Headers
  xml += `   <Row ss:Height="24">\n`;
  columns.forEach((col) => {
    xml += `    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">${col.header}</Data></Cell>\n`;
  });
  xml += `   </Row>\n`;

  // Table Data Rows
  data.forEach((row) => {
    xml += `   <Row ss:Height="20">\n`;
    columns.forEach((col) => {
      const val = row[col.key];
      let styleID = 'DataString';
      let dataType = 'String';
      let formattedVal = val !== undefined && val !== null ? String(val) : '';

      if (col.type === 'number') {
        styleID = 'DataNumber';
        dataType = 'Number';
        formattedVal = String(Number(val) || 0);
      } else if (col.type === 'currency_usd') {
        styleID = 'DataCurrencyUSD';
        dataType = 'Number';
        formattedVal = String(Number(val) || 0);
      } else if (col.type === 'currency_bs') {
        styleID = 'DataCurrencyBS';
        dataType = 'Number';
        formattedVal = String(Number(val) || 0);
      } else if (col.type === 'percent') {
        styleID = 'DataPercent';
        dataType = 'Number';
        formattedVal = String((Number(val) || 0) / 100);
      }

      xml += `    <Cell ss:StyleID="${styleID}"><Data ss:Type="${dataType}">${escapeXml(formattedVal)}</Data></Cell>\n`;
    });
    xml += `   </Row>\n`;
  });

  // Summary / Totals Rows if available
  if (summaryRows && summaryRows.length > 0) {
    xml += `   <Row ss:Height="8"><Cell/></Row>\n`;
    summaryRows.forEach((sRow) => {
      xml += `   <Row ss:Height="24">\n`;
      columns.forEach((col, idx) => {
        if (idx === 0) {
          xml += `    <Cell ss:StyleID="TotalRow"><Data ss:Type="String">${sRow.label}</Data></Cell>\n`;
        } else if (sRow.values[col.key] !== undefined) {
          const val = sRow.values[col.key];
          let styleID = 'TotalRow';
          let dataType = typeof val === 'number' ? 'Number' : 'String';
          xml += `    <Cell ss:StyleID="${styleID}"><Data ss:Type="${dataType}">${val}</Data></Cell>\n`;
        } else {
          xml += `    <Cell ss:StyleID="TotalRow"/>\n`;
        }
      });
      xml += `   </Row>\n`;
    });
  }

  xml += `  </Table>
 </Worksheet>
</Workbook>`;

  // Create downloadable blob
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
