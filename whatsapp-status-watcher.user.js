// ==UserScript==
// @name         WhatsApp Online Status Watcher
// @namespace    https://github.com/InvictusNavarchus/whatsapp-status-watcher
// @downloadURL  https://raw.githubusercontent.com/InvictusNavarchus/whatsapp-status-watcher/master/whatsapp-status-watcher.user.js
// @updateURL    https://raw.githubusercontent.com/InvictusNavarchus/whatsapp-status-watcher/master/whatsapp-status-watcher.user.js
// @version      0.1.0
// @description  Tracks and records a user's online status on WhatsApp Web
// @author       Invictus
// @match        https://web.whatsapp.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=whatsapp.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// @grant        GM_download
// ==/UserScript==

(function() {
    'use strict';

    // Wait for the page to fully load
    const RETRY_DELAY = 2000;
    let lastStatus = '';
    let statusCheckInterval;
    
    // Initialize the script after DOM is loaded
    function init() {
        if (!document.querySelector('header')) {
            console.log('WhatsApp Status Watcher: Headers not found yet. Retrying...');
            setTimeout(init, RETRY_DELAY);
            return;
        }
        
        setupMutationObserver();
        createExportButton();
        
        // Start periodic status checks as a backup
        statusCheckInterval = setInterval(checkStatus, 5000);
    }
    
    // Setup the mutation observer
    function setupMutationObserver() {
        const config = {
            childList: true,  // Observe additions/removals of direct children
            subtree: true,    // Observe changes in descendants as well
            attributes: true, // Observe attribute changes
        };
        
        const observer = new MutationObserver(() => {
            checkStatus();
        });
        
        // Start observing the whole page for changes
        observer.observe(document.body, config);
    }
    
    // Check the status and save if changed
    function checkStatus() {
        const headers = document.querySelectorAll('header');
        if (headers.length >= 4) {
            const statusHeader = headers[3];
            if (statusHeader) {
                const currentStatus = statusHeader.innerText;
                
                if (currentStatus !== lastStatus && currentStatus.trim() !== '') {
                    lastStatus = currentStatus;
                    saveStatus(currentStatus);
                }
            }
        }
    }
    
    // Save status to storage with timestamp
    function saveStatus(status) {
        const timestamp = new Date().toISOString();
        const key = `status_${timestamp}`;
        const data = {
            timestamp: timestamp,
            status: status
        };
        
        GM_setValue(key, JSON.stringify(data));
        console.log(`Saved status: ${status} at ${timestamp}`);
    }
    
    // Create a button for exporting data
    function createExportButton() {
        const button = document.createElement('button');
        button.textContent = 'Export Status Data';
        button.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            padding: 8px 12px;
            background-color: #00a884;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        `;
        
        button.addEventListener('click', exportStatusData);
        document.body.appendChild(button);
    }
    
    // Export status data as CSV
    function exportStatusData() {
        const keys = GM_listValues();
        const statusEntries = [];
        
        keys.forEach(key => {
            if (key.startsWith('status_')) {
                const entry = JSON.parse(GM_getValue(key));
                statusEntries.push(entry);
            }
        });
        
        // Sort by timestamp
        statusEntries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Convert to CSV
        let csv = 'Timestamp (Local),Status\n';
        statusEntries.forEach(entry => {
            // Convert ISO timestamp to local date/time format
            const localTime = new Date(entry.timestamp).toLocaleString();
            // Escape any commas in the status
            const escapedStatus = entry.status.replace(/"/g, '""');
            csv += `"${localTime}","${escapedStatus}"\n`;
        });
        
        // Download the CSV file
        const filename = `whatsapp-status-history-${new Date().toISOString().slice(0, 10)}.csv`;
        GM_download({
            url: `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`,
            name: filename
        });
    }
    
    // Add a function to clear old data (optional, can be called manually)
    function clearOldData(daysToKeep = 30) {
        const keys = GM_listValues();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        
        keys.forEach(key => {
            if (key.startsWith('status_')) {
                const entry = JSON.parse(GM_getValue(key));
                const entryDate = new Date(entry.timestamp);
                
                if (entryDate < cutoffDate) {
                    GM_deleteValue(key);
                    console.log(`Deleted old status entry from ${entryDate.toLocaleDateString()}`);
                }
            }
        });
    }
    
    // Add menu items for data management
    function addContextMenu() {
        GM_registerMenuCommand("Clear Data Older Than 30 Days", () => clearOldData(30));
        GM_registerMenuCommand("Export Status Data", exportStatusData);
    }
    
    // Start the script
    init();
})();
