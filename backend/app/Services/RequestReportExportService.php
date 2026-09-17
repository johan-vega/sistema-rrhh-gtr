<?php

namespace App\Services;

use App\Models\LaborRequest;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use ZipArchive;

class RequestReportExportService
{
    /** @param Collection<int, LaborRequest> $requests */
    public function download(Collection $requests, array $filters): BinaryFileResponse
    {
        $path = tempnam(sys_get_temp_dir(), 'gtr-reporte-');
        $zip = new ZipArchive;
        $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);

        $summary = [
            ['Reporte de solicitudes de RRHH'],
            ['Generado el', now()->format('Y-m-d H:i')],
            ['Rango desde', $filters['from'] ?? 'Sin límite'],
            ['Rango hasta', $filters['to'] ?? 'Sin límite'],
            [],
            ['Indicador', 'Cantidad'],
            ['Total de solicitudes', $requests->count()],
            ['Pendientes', $this->countByStatus($requests, 'PENDIENTE')],
            ['Aprobadas', $this->countByStatus($requests, 'APROBADA')],
            ['Rechazadas', $this->countByStatus($requests, 'RECHAZADA')],
            ['Canceladas', $this->countByStatus($requests, 'CANCELADA')],
        ];

        $details = [['Trabajador', 'Área', 'Motivo', 'Periodo', 'Periodo inicio', 'Periodo fin', 'Estado', 'Solicitada']];
        foreach ($requests as $request) {
            $details[] = [
                trim("{$request->worker->first_name} {$request->worker->last_name}"),
                $request->worker->area?->name ?? '',
                $request->category->name,
                $request->start_date?->format('Y-m-d').' al '.$request->end_date?->format('Y-m-d'),
                $request->start_date?->format('d/m/Y') ?? '',
                $request->end_date?->format('d/m/Y') ?? '',
                $request->status->value,
                $request->requested_at?->format('Y-m-d') ?? '',
            ];
        }

        $zip->addFromString('[Content_Types].xml', $this->contentTypes());
        $zip->addFromString('_rels/.rels', $this->rootRelationships());
        $zip->addFromString('xl/workbook.xml', $this->workbook());
        $zip->addFromString('xl/_rels/workbook.xml.rels', $this->workbookRelationships());
        $zip->addFromString('xl/styles.xml', $this->styles());
        // El detalle es la primera hoja para que Excel abra el mismo formato que ve RRHH en la web.
        $zip->addFromString('xl/worksheets/sheet1.xml', $this->worksheet($details, [1], 'A1:H'.max(count($details), 1), [34, 26, 28, 30, 18, 18, 18, 18], false));
        $zip->addFromString('xl/worksheets/sheet2.xml', $this->worksheet($summary, [6], null, [30, 22]));
        $zip->close();

        return response()->download($path, 'reporte-solicitudes-'.now()->format('Ymd-His').'.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    private function worksheet(array $rows, array $headerRows, ?string $filterRange = null, array $widths = [], bool $firstRowIsTitle = true): string
    {
        $columns = '';
        foreach ($widths as $index => $width) {
            $column = $index + 1;
            $columns .= '<col min="'.$column.'" max="'.$column.'" width="'.$width.'" customWidth="1"/>';
        }
        $columnDefinitions = $columns ? '<cols>'.$columns.'</cols>' : '';
        $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="15"/>'.$columnDefinitions.'<sheetData>';
        foreach ($rows as $rowIndex => $values) {
            $row = $rowIndex + 1;
            $xml .= '<row r="'.$row.'">';
            foreach ($values as $columnIndex => $value) {
                $column = $this->columnName($columnIndex + 1);
                $style = $firstRowIsTitle && $row === 1 ? 2 : (in_array($row, $headerRows, true) ? 1 : 0);
                $xml .= '<c r="'.$column.$row.'" s="'.$style.'" t="inlineStr"><is><t xml:space="preserve">'.$this->escape((string) $value).'</t></is></c>';
            }
            $xml .= '</row>';
        }

        $filter = $filterRange ? '<autoFilter ref="'.$filterRange.'"/>' : '';

        return $xml.'</sheetData>'.$filter.'<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>';
    }

    /** @param Collection<int, LaborRequest> $requests */
    private function countByStatus(Collection $requests, string $status): int
    {
        return $requests->filter(fn (LaborRequest $request) => $request->status->value === $status)->count();
    }

    private function columnName(int $number): string
    {
        $name = '';
        while ($number > 0) {
            $number--;
            $name = chr(65 + ($number % 26)).$name;
            $number = intdiv($number, 26);
        }
        return $name;
    }

    private function escape(string $value): string
    {
        // Evita que valores originados en texto de usuario se interpreten como fórmulas al abrir Excel.
        if (preg_match('/^[=+\-@]/', $value)) $value = "'{$value}";
        return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    }

    private function contentTypes(): string
    {
        return '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>';
    }

    private function rootRelationships(): string
    {
        return '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
    }

    private function workbook(): string
    {
        return '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets><sheet name="Solicitudes" sheetId="1" r:id="rId1"/><sheet name="Resumen" sheetId="2" r:id="rId2"/></sheets></workbook>';
    }

    private function workbookRelationships(): string
    {
        return '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
    }

    private function styles(): string
    {
        return '<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FF0F172A"/><sz val="14"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0F172A"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>';
    }
}
