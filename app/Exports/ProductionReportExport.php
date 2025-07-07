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

class ProductionReportExport implements 
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
            'Item',
            'Section',
            'Grade',
            'Weight / Pairs',
            'Total Bags',
            'Total Weight (kg)'
        ];
    }

    /**
     * @param mixed $row
     * @return array
     */
    public function map($row): array
    {
        return [
            $row->item?->name ?? 'N/A',
            $row->item?->section?->name ?? 'N/A',
            $row->grade?->name ?? 'N/A',
            ($row->weight?->weight_type === 'pair') 
                ? $row->weight?->weight . ' pairs' 
                : $row->weight?->weight . ' kg',
            $row->total_bags,
            number_format($row->total_weight, 2) . ' kg'
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
        $totalBags = $this->data->sum('total_bags');
        $totalWeight = $this->data->sum('total_weight');
        
        // Add a summary row at the end
        $sheet->setCellValue('A' . ($lastRow + 2), 'TOTAL:');
        $sheet->setCellValue('E' . ($lastRow + 2), $totalBags);
        $sheet->setCellValue('F' . ($lastRow + 2), number_format($totalWeight, 2) . ' kg');
        
        // Apply styles
        $sheet->getStyle('A1:F1')->getFont()->setBold(true);
        $sheet->getStyle('A1:F1')->getFill()
            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setRGB('DDEBF7');
            
        $sheet->getStyle('A' . ($lastRow + 2) . ':F' . ($lastRow + 2))->getFont()->setBold(true);
        $sheet->getStyle('A' . ($lastRow + 2) . ':F' . ($lastRow + 2))->getFill()
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
        $sheet->getStyle('A1:F'.($lastRow + 2))->applyFromArray($styleArray);
        
        return [];
    }

    /**
     * @return string
     */
    public function title(): string
    {
        return 'Production Report';
    }
}
