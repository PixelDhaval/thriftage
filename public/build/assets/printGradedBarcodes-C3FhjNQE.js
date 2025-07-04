import{t as a}from"./index-CtjZe5nG.js";function S(u){return new Promise((o,c)=>{var f,g;const{bags:i,partyName:C,containerNo:$,movementDate:E,weightValue:d,itemName:s,itemSection:h,gradeName:p,title:x,isSingle:r=!1}=u;let t=null;try{t=window.open("","_blank","width=800,height=600,scrollbars=yes,resizable=yes")}catch(e){console.error("Failed to open popup window:",e)}if(!t||t.closed){if(!window.confirm("Print window was blocked by your browser. Please allow popups for this site and try again. Click OK to retry or Cancel to skip printing.")){o();return}try{t=window.open("","_blank","width=800,height=600,scrollbars=yes,resizable=yes")}catch(n){console.error("Second attempt failed:",n)}if(!t||t.closed){a.error("Unable to open print window. Please check your popup blocker settings."),c(new Error("Failed to open print window"));return}}const y=i.map(e=>{var n,m,b,w;return`
            <div class="barcode-label-container">
                <div class="top-row">
                    <div class="weight-corner">
                        <span class="weight-label">Weight</span>
                        <span class="weight-value">${((n=e.weight)==null?void 0:n.weight)||d} kg</span>
                    </div>
                   <div class="section-corner">
                        <span class="section-label">Section</span>
                        <span class="section-value">${((b=(m=e.item)==null?void 0:m.section)==null?void 0:b.name)||h||"N/A"}</span>
                    </div>
                </div>
                
                <div class="item-name-section">
                    <div class="item-name">${((w=e.item)==null?void 0:w.name)||s}</div>
                </div>
                
                <div class="barcode-container">
                    <svg id="barcode-${e.barcode}"></svg>
                </div>
                
            </div>
        `}).join(""),k=x||(r?`Graded Barcode Label - ${(f=i[0])==null?void 0:f.barcode}`:`All Graded Barcode Labels - ${i.length} items`),v=r?`Single graded label for ${s} - ${p} - ${d} kg - ${(g=i[0])==null?void 0:g.barcode}`:`${i.length} graded labels for ${s} - ${p} - ${d} kg`,P=`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${k}</title>
                <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
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
                    ${v}
                </div>
                
                <div class="print-controls">
                    <button onclick="window.print()" id="printBtn">🖨️ Print ${r?"Label":"All Labels"}</button>
                    <button onclick="confirmPrintComplete()" id="completeBtn">✅ Print Complete</button>
                    <button onclick="skipPrint()" id="skipBtn">⏭️ ${r?"Close":"Skip & Continue"}</button>
                </div>
                
                ${y}
                
                <script>
                    let isPrintComplete = false;
                    let printSkipped = false;
                    
                    window.onload = function() {
                        try {
                            ${i.map(e=>`
                                JsBarcode("#barcode-${e.barcode}", "${e.barcode}", {
                                    format: "CODE128",
                                    width: 2,
                                    height: 35,
                                    displayValue: true,
                                    margin: 2,
                                    background: "#ffffff",
                                    lineColor: "#000000"
                                });
                            `).join("")}
                            
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
                <\/script>
            </body>
            </html>
        `;try{t.document.write(P),t.document.close(),t.focus()}catch(e){console.error("Error writing to print window:",e),t.close(),c(new Error("Failed to write content to print window"));return}const l=e=>{if(e.data&&e.data.type==="printComplete"){window.removeEventListener("message",l);const n=e.data.action;n==="printComplete"?o():n==="printSkipped"?(a.info("Print skipped."),o()):(a.warning("Print was cancelled."),o())}};window.addEventListener("message",l),setTimeout(()=>{window.removeEventListener("message",l),a.warning("Print timeout reached."),o()},6e4)})}export{S as p};
