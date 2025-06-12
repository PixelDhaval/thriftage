import{t as d}from"./index-DpybBKEl.js";function v(g){return new Promise((o,p)=>{var b,w;const{bags:n,partyName:s,containerNo:i,movementDate:f,weightValue:l,title:m,isSingle:r=!1}=g;let t=null;try{t=window.open("","_blank","width=800,height=600,scrollbars=yes,resizable=yes")}catch(e){console.error("Failed to open popup window:",e)}if(!t||t.closed){if(!window.confirm("Print window was blocked by your browser. Please allow popups for this site and try again. Click OK to retry or Cancel to skip printing.")){o();return}try{t=window.open("","_blank","width=800,height=600,scrollbars=yes,resizable=yes")}catch(a){console.error("Second attempt failed:",a)}if(!t||t.closed){d.error("Unable to open print window. Please check your popup blocker settings."),p(new Error("Failed to open print window"));return}}const u=n.map(e=>`
            <div class="barcode-label">
                <div class="label-header">
                    <div class="weight-info">WT: ${l} kg</div>
                    <div class="barcode-text">${e.barcode}</div>
                </div>
                
                <div class="barcode-container">
                    <svg id="barcode-${e.barcode}"></svg>
                </div>
                
                <div class="supplier-name">${s}</div>
                
                <div class="container-info">
                    ${i?`<div class="container-no">${i}</div>`:""}
                    ${f?`<div class="movement-date">${new Date(f).toLocaleDateString()}</div>`:""}
                </div>
            </div>
        `).join(""),h=m||(r?`Barcode Label - ${(b=n[0])==null?void 0:b.barcode}`:`All Barcode Labels - ${n.length} items`),y=r?`Single label for ${s} - ${l} kg - ${(w=n[0])==null?void 0:w.barcode}`:`${n.length} labels for ${s} - ${l} kg`,k=`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${h}</title>
                <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
                <style>
                    @page {
                        size: 4in 3in;
                        margin: 0.1in;
                    }
                    
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        background: white;
                    }
                    
                    .barcode-label {
                        width: 3.8in;
                        height: 2.8in;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        page-break-after: always;
                        border: 1px solid #ddd;
                        padding: 0.1in;
                        box-sizing: border-box;
                        position: relative;
                    }
                    
                    .barcode-label:last-child {
                        page-break-after: auto;
                    }
                    
                    .label-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 0.05in;
                    }
                    
                    .weight-info {
                        font-size: 12px;
                        font-weight: bold;
                        color: #333;
                    }
                    
                    .barcode-text {
                        font-family: monospace;
                        font-size: 10px;
                        font-weight: bold;
                        color: #333;
                    }
                    
                    .barcode-container {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        flex: 1;
                        margin: 0.05in 0;
                        border: 2px solid #333;
                        border-radius: 4px;
                        padding: 0.05in;
                        background: #fff;
                    }
                    
                    .barcode-container svg {
                        max-width: 3.0in;
                        max-height: 1in;
                        height: auto;
                        width: auto;
                    }
                    
                    .supplier-name {
                        font-weight: bold;
                        font-size: 18px;
                        text-align: center;
                        word-wrap: break-word;
                        line-height: 1.1;
                        color: #000;
                        margin: 0.05in 0;
                    }
                    
                    .container-info {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 12px;
                        font-weight: bold;
                        color: #333;
                        border-top: 1px solid #ddd;
                        padding-top: 0.05in;
                        margin-top: 0.05in;
                    }
                    
                    .container-no, .movement-date {
                        font-weight: bold;
                        font-size: 12px;
                    }
                    
                    .print-controls {
                        position: fixed;
                        top: 10px;
                        right: 10px;
                        background: #f0f0f0;
                        padding: 15px;
                        border: 2px solid #333;
                        border-radius: 8px;
                        z-index: 1000;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    
                    .print-controls button {
                        padding: 8px 16px;
                        margin: 0 5px;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    }
                    
                    #printBtn {
                        background: #007bff;
                        color: white;
                    }
                    
                    #completeBtn {
                        background: #28a745;
                        color: white;
                    }
                    
                    #skipBtn {
                        background: #6c757d;
                        color: white;
                    }
                    
                    .batch-info {
                        background: #e9ecef;
                        padding: 10px;
                        margin: 10px;
                        border-radius: 5px;
                        text-align: center;
                        font-weight: bold;
                    }
                    
                    @media print {
                        .print-controls, .batch-info { display: none; }
                        body { margin: 0; }
                        .barcode-label { 
                            border: none; 
                            page-break-after: always; 
                        }
                    }
                </style>
            </head>
            <body>
                <div class="batch-info">
                    ${y}${i?` - Container: ${i}`:""}
                </div>
                
                <div class="print-controls">
                    <button onclick="window.print()" id="printBtn">🖨️ Print ${r?"Label":"All Labels"}</button>
                    <button onclick="confirmPrintComplete()" id="completeBtn">✅ Print Complete</button>
                    <button onclick="skipPrint()" id="skipBtn">⏭️ ${r?"Close":"Skip & Continue"}</button>
                </div>
                
                ${u}
                
                <script>
                    let isPrintComplete = false;
                    let printSkipped = false;
                    
                    window.onload = function() {
                        try {
                            ${n.map(e=>`
                                JsBarcode("#barcode-${e.barcode}", "${e.barcode}", {
                                    format: "CODE128",
                                    width: 2,
                                    height: 50,
                                    displayValue: true,
                                    margin: 5,
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
        `;try{t.document.write(k),t.document.close(),t.focus()}catch(e){console.error("Error writing to print window:",e),t.close(),p(new Error("Failed to write content to print window"));return}const c=e=>{if(e.data&&e.data.type==="printComplete"){window.removeEventListener("message",c);const a=e.data.action;a==="printComplete"?o():a==="printSkipped"?(d.info("Print skipped."),o()):(d.warning("Print was cancelled."),o())}};window.addEventListener("message",c),setTimeout(()=>{window.removeEventListener("message",c),d.warning("Print timeout reached."),o()},6e4)})}export{v as p};
