import { format } from 'date-fns';
import { toast } from 'sonner';

export interface GradedBarcodeItem {
    barcode: string;
    id?: string | number;
    party?: { name: string };
    weight?: { weight: string };
    item?: { name: string; section?: { name: string } };
    grade?: { name: string };
}

export interface PrintGradedBarcodeOptions {
    bags: GradedBarcodeItem[];
    partyName: string;
    containerNo?: string;
    movementDate?: string;
    weightValue: string;
    itemName: string;
    itemSection?: string;
    gradeName: string;
    title?: string;
    isSingle?: boolean;
}

export function printGradedBarcodes(options: PrintGradedBarcodeOptions): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const { 
            bags, 
            partyName, 
            containerNo, 
            movementDate, 
            weightValue, 
            itemName, 
            itemSection, 
            gradeName, 
            title, 
            isSingle = false 
        } = options;
        
        // Try to open print window
        let printWindow: Window | null = null;
        
        try {
            printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
        } catch (error) {
            console.error('Failed to open popup window:', error);
        }
        
        if (!printWindow || printWindow.closed) {
            // Fallback: Show alert and try again
            const userWantsToTry = window.confirm(
                'Print window was blocked by your browser. Please allow popups for this site and try again. ' +
                'Click OK to retry or Cancel to skip printing.'
            );
            
            if (!userWantsToTry) {
                resolve(); // User chose to skip printing
                return;
            }
            
            // Try again after user confirmation
            try {
                printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
            } catch (error) {
                console.error('Second attempt failed:', error);
            }
            
            if (!printWindow || printWindow.closed) {
                toast.error('Unable to open print window. Please check your popup blocker settings.');
                reject(new Error('Failed to open print window'));
                return;
            }
        }

        // Generate thermal printer optimized HTML for graded bags
        const barcodeElements = bags.map(bag => `
            <div class="barcode-label-container">
                <div class="top-row">
                    <div class="weight-corner">
                        <span class="weight-label">Weight</span>
                        <span class="weight-value">${bag.weight?.weight || weightValue} kg</span>
                    </div>
                   <div class="section-corner">
                        <span class="section-label">Section</span>
                        <span class="section-value">${bag.item?.section?.name || itemSection || 'N/A'}</span>
                    </div>
                </div>
                
                <div class="item-name-section">
                    <div class="item-name">${bag.item?.name || itemName}</div>
                </div>
                
                <div class="barcode-container">
                    <svg id="barcode-${bag.barcode}"></svg>
                </div>
                
            </div>
        `).join('');

        const pageTitle = title || (isSingle ? `Graded Barcode Label - ${bags[0]?.barcode}` : `All Graded Barcode Labels - ${bags.length} items`);
        const batchInfo = isSingle 
            ? `Single graded label for ${itemName} - ${gradeName} - ${weightValue} kg - ${bags[0]?.barcode}`
            : `${bags.length} graded labels for ${itemName} - ${gradeName} - ${weightValue} kg`;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${pageTitle}</title>
                <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                <style>
                    @page {
                        size: 4in 3in;
                        margin: 0.05in;
                    }
                    
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        background: white;
                    }
                    
                    .barcode-label-container {
                        width: 3.9in;
                        height: 2.9in;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        page-break-after: always;
                        border: 2px solid #000;
                        padding: 0.05in;
                        box-sizing: border-box;
                        position: relative;
                        background: white;
                    }
                    
                    .barcode-label:last-child {
                        page-break-after: auto;
                    }
                    
                    .top-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 0.05in;
                    }
                    
                    .weight-corner, .grade-corner {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                        padding: 0.02in;
                        border: 1px solid #000;
                        border-radius: 3px;
                        background: #fff;
                        min-width: 0.8in;
                    }
                    
                    .weight-label, .grade-label {
                        font-size: 8px;
                        color: #000;
                        margin-bottom: 0.01in;
                        text-transform: uppercase;
                    }
                    
                    .weight-value, .grade-value {
                        font-size: 11px;
                        font-weight: bold;
                        color: #000;
                        line-height: 1;
                    }
                    
                    .item-name-section {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        margin: 0.1in 0;
                        flex: 1;
                    }
                    
                    .item-name {
                        font-size: 28px;
                        font-weight: bold;
                        color: #000;
                        text-align: center;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        line-height: 1.1;
                        padding: 0.05in;
                        background: #fff;
                        max-width: 3.5in;
                        word-wrap: break-word;
                    }
                    
                    .barcode-container {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        margin: 0.05in 0;
                        border: 1px solid #000;
                        border-radius: 3px;
                        padding: 0.02in;
                        background: #fff;
                        height: 0.6in;
                    }
                    
                    .barcode-container svg {
                        max-width: 3.5in;
                        max-height: 0.55in;
                        height: auto;
                        width: auto;
                    }
                    
                    .bottom-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                        margin-top: 0.05in;
                    }
                    
                    .section-corner, .barcode-corner {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                        padding: 0.02in;
                        border: 1px solid #000;
                        border-radius: 3px;
                        background: #fff;
                        min-width: 0.8in;
                    }
                    
                    .section-label, .barcode-label {
                        font-size: 8px;
                        color: #000;
                        margin-bottom: 0.01in;
                        text-transform: uppercase;
                    }
                    
                    .section-value {
                        font-size: 10px;
                        font-weight: bold;
                        color: #000;
                        line-height: 1;
                    }
                    
                    .barcode-text {
                        font-family: monospace;
                        font-size: 9px;
                        font-weight: bold;
                        color: #000;
                        line-height: 1;
                    }
                    
                    .print-controls {
                        position: fixed;
                        top: 10px;
                        right: 10px;
                        background: #fff;
                        padding: 15px;
                        border: 2px solid #000;
                        border-radius: 8px;
                        z-index: 1000;
                    }
                    
                    .print-controls button {
                        padding: 8px 16px;
                        margin: 0 5px;
                        border: 1px solid #000;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                        background: #fff;
                        color: #000;
                    }
                    
                    #printBtn {
                        background: #000;
                        color: #fff;
                    }
                    
                    #completeBtn {
                        background: #000;
                        color: #fff;
                    }
                    
                    #skipBtn {
                        background: #fff;
                        color: #000;
                    }
                    
                    .batch-info {
                        background: #fff;
                        border: 1px solid #000;
                        padding: 10px;
                        margin: 10px;
                        border-radius: 5px;
                        text-align: center;
                        font-weight: bold;
                        color: #000;
                    }
                    
                    @media print {
                        .print-controls, .batch-info { display: none; }
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="batch-info">
                    ${batchInfo}
                </div>
                
                <div class="print-controls">
                    <button onclick="window.print()" id="printBtn">🖨️ Print ${isSingle ? 'Label' : 'All Labels'}</button>
                    <button onclick="confirmPrintComplete()" id="completeBtn">✅ Print Complete</button>
                    <button onclick="skipPrint()" id="skipBtn">⏭️ ${isSingle ? 'Close' : 'Skip & Continue'}</button>
                </div>
                
                ${barcodeElements}
                
                <script>
                    let isPrintComplete = false;
                    let printSkipped = false;
                    
                    window.onload = function() {
                        try {
                            ${bags.map(bag => `
                                JsBarcode("#barcode-${bag.barcode}", "${bag.barcode}", {
                                    format: "CODE128",
                                    width: 2,
                                    height: 35,
                                    displayValue: true,
                                    margin: 2,
                                    background: "#ffffff",
                                    lineColor: "#000000"
                                });
                            `).join('')}
                            
                            // Auto-focus the print button
                            document.getElementById('printBtn').focus();
                        } catch (error) {
                            console.error('Error generating barcodes:', error);
                            alert('Error generating barcodes: ' + error.message);
                        }
                    };
                    
                    function confirmPrintComplete() {
                        isPrintComplete = true;
                        notifyParent('printComplete');
                        window.close();
                    }
                    
                    function skipPrint() {
                        printSkipped = true;
                        notifyParent('printSkipped');
                        window.close();
                    }
                    
                    function notifyParent(action) {
                        if (window.opener && !window.opener.closed) {
                            window.opener.postMessage({
                                type: 'printComplete',
                                action: action,
                                completed: isPrintComplete || printSkipped
                            }, '*');
                        }
                    }
                    
                    // Listen for print events
                    window.addEventListener('beforeprint', function() {
                        console.log('Print dialog opened');
                    });
                    
                    window.addEventListener('afterprint', function() {
                        console.log('Print dialog closed');
                        setTimeout(() => {
                            if (!isPrintComplete && !printSkipped) {
                                isPrintComplete = true;
                                notifyParent('printComplete');
                                window.close();
                            }
                        }, 1000);
                    });
                    
                    // Handle window close
                    window.addEventListener('beforeunload', function() {
                        if (!isPrintComplete && !printSkipped) {
                            notifyParent('printCancelled');
                        }
                    });
                    
                    // Keyboard shortcuts
                    document.addEventListener('keydown', function(e) {
                        if (e.ctrlKey && e.key === 'p') {
                            e.preventDefault();
                            window.print();
                        } else if (e.key === 'Enter') {
                            confirmPrintComplete();
                        } else if (e.key === 'Escape') {
                            skipPrint();
                        }
                    });
                </script>
            </body>
            </html>
        `;

        try {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.focus();
        } catch (error) {
            console.error('Error writing to print window:', error);
            printWindow.close();
            reject(new Error('Failed to write content to print window'));
            return;
        }
        
        // Listen for messages from the print window
        const messageHandler = (event: MessageEvent) => {
            if (event.data && event.data.type === 'printComplete') {
                window.removeEventListener('message', messageHandler);
                
                const action = event.data.action;
                if (action === 'printComplete') {
                    resolve();
                } else if (action === 'printSkipped') {
                    toast.info('Print skipped.');
                    resolve();
                } else {
                    toast.warning('Print was cancelled.');
                    resolve();
                }
            }
        };
        
        window.addEventListener('message', messageHandler);
        
        // Fallback timeout
        setTimeout(() => {
            window.removeEventListener('message', messageHandler);
            toast.warning('Print timeout reached.');
            resolve();
        }, 60000);
    });
}
