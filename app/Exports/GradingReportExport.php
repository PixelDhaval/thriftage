<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Illuminate\Support\Collection;

class GradingReportExport implements 
    FromCollection, 
    WithHeadings, 
    WithMapping, 
    WithStyles, 
    WithTitle, 
    ShouldAutoSize
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        return collect($this->data);
    }

    /**
     * @return array
     */
    public function headings(): array
    {
        return [
            'Section',
            'Grade',
            'Total Weight (kg)',
            'Total Pairs'
        ];
    }

    /**
     * @param mixed $row
     * @return array
     */
    public function map($row): array
    {
        return [
            $row->section?->name ?? 'N/A',
            $row->grade?->name ?? 'N/A',
            number_format($row->total_weight, 2) . ' kg',
            $row->total_pairs > 0 ? number_format($row->total_pairs) : 'N/A'
        ];
    }

    /**
     * @param Worksheet $sheet
     * @return array
     */
    public function styles(Worksheet $sheet)
    {
        $lastRow = count($this->data) + 1;
        
        // Calculate totals
        $totalWeight = $this->data->sum('total_weight');
        $totalPairs = $this->data->sum('total_pairs');
        
        // Add a summary row at the end
        $sheet->setCellValue('A' . ($lastRow + 2), 'TOTAL:');
        $sheet->setCellValue('C' . ($lastRow + 2), number_format($totalWeight, 2) . ' kg');
        $sheet->setCellValue('D' . ($lastRow + 2), $totalPairs > 0 ? number_format($totalPairs) : 'N/A');
        
        // Apply styles
        $sheet->getStyle('A1:D1')->getFont()->setBold(true);
        $sheet->getStyle('A1:D1')->getFill()
            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setRGB('DDEBF7');
            
        $sheet->getStyle('A' . ($lastRow + 2) . ':D' . ($lastRow + 2))->getFont()->setBold(true);
        $sheet->getStyle('A' . ($lastRow + 2) . ':D' . ($lastRow + 2))->getFill()
            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setRGB('EEEEEE');
            
        // Add borders to all cells
        $styleArray = [
            'borders' => [
                'allBorders' => [
                    'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                ],
            ],
        ];
        $sheet->getStyle('A1:D'.($lastRow + 2))->applyFromArray($styleArray);
        
        return [];
    }

    /**
     * @return string
     */
    public function title(): string
    {
        return 'Grading Report';
    }
}
