function executeQuery() {
    const query = document.getElementById('sqlInput').value;
    const results = document.getElementById('results');
    
    if (!query.trim()) return;
    
    if (query.toLowerCase().includes('describe') || query.toLowerCase().includes('desc')) {
        const tableName = extractTableName(query);
        showDynamicDescribeResult(results, tableName);
    } else {
        fetch(`/api/query?q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    results.innerHTML = `<div style="padding: 20px; color: red;">Error: ${data.error}</div>`;
                } else {
                    showRealSelectResult(results, data);
                }
            })
            .catch(error => {
                results.innerHTML = `<div style="padding: 20px; color: red;">Error: ${error.message}</div>`;
            });
    }
}

function showDynamicDescribeResult(results, tableName) {
    fetch(`/api/query?q=${encodeURIComponent(`SELECT * FROM ${tableName} LIMIT 1`)}`)
        .then(response => response.json())
        .then(data => {
            if (data.error || !data.length) {
                results.innerHTML = `<div style="padding: 20px; color: red;">Error: Could not describe table ${tableName}</div>`;
                return;
            }
            
            const columns = Object.keys(data[0]);
            const describeData = columns.map(col => ({
                Field: col,
                Type: typeof data[0][col] === 'number' ? 'numeric' : 'character',
                Null: 'YES',
                Key: '',
                Default: null,
                Extra: ''
            }));
            
            results.innerHTML = `
                <div style="padding: 10px; background: #f0f9ff; border-bottom: 1px solid #e2e8f0;">
                    <strong>Table structure for '${tableName}'</strong>
                </div>
                <table>
                    <thead>
                        <tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>
                    </thead>
                    <tbody>
                        ${describeData.map(row => `<tr><td><strong>${row.Field}</strong></td><td>${row.Type}</td><td>${row.Null}</td><td>${row.Key}</td><td>${row.Default || 'NULL'}</td><td>${row.Extra}</td></tr>`).join('')}
                    </tbody>
                </table>
            `;
        })
        .catch(error => {
            results.innerHTML = `<div style="padding: 20px; color: red;">Error: ${error.message}</div>`;
        });
}

function extractTableName(query) {
    const match = query.toLowerCase().match(/(?:from|describe|desc)\s+(\w+)/);
    return match ? match[1] : null;
}

function showRealSelectResult(results, data) {
    if (!data || data.length === 0) {
        results.innerHTML = '<div style="padding: 20px; color: #666;">No data found</div>';
        return;
    }
    
    const columns = Object.keys(data[0]);
    
    results.innerHTML = `
        <div style="padding: 10px; background: #f0f9ff; border-bottom: 1px solid #e2e8f0;">
            <strong>Query executed successfully. ${data.length} rows returned.</strong>
        </div>
        <table>
            <thead>
                <tr>${columns.map(col => `<th>${col}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${data.map(row => `<tr>${columns.map(col => `<td>${row[col] || ''}</td>`).join('')}</tr>`).join('')}
            </tbody>
        </table>
    `;
}

function showDescribeResult(results) {
    const describeData = [
        { Field: 'id', Type: 'int(11)', Null: 'NO', Key: 'PRI', Default: null, Extra: 'auto_increment' },
        { Field: 'name', Type: 'varchar(255)', Null: 'NO', Key: '', Default: null, Extra: '' },
        { Field: 'email', Type: 'varchar(255)', Null: 'NO', Key: 'UNI', Default: null, Extra: '' },
        { Field: 'created_at', Type: 'timestamp', Null: 'YES', Key: '', Default: 'CURRENT_TIMESTAMP', Extra: '' }
    ];
    
    results.innerHTML = `
        <div style="padding: 10px; background: #f0f9ff; border-bottom: 1px solid #e2e8f0;">
            <strong>Table structure for 'users'</strong>
        </div>
        <table>
            <thead>
                <tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>
            </thead>
            <tbody>
                ${describeData.map(row => `<tr><td><strong>${row.Field}</strong></td><td>${row.Type}</td><td>${row.Null}</td><td>${row.Key}</td><td>${row.Default || 'NULL'}</td><td>${row.Extra}</td></tr>`).join('')}
            </tbody>
        </table>
    `;
}

function clearEditor() {
    document.getElementById('sqlInput').value = '';
    document.getElementById('results').innerHTML = '<p style="padding: 20px; color: #666;">Results will appear here...</p>';
}

function loadTables() {
    fetch('/api/tables')
        .then(response => response.json())
        .then(tables => {
            const tableList = document.getElementById('tableList');
            tableList.innerHTML = tables.map(table => 
                `<li onclick="selectTable('${table}')">
                    ${table}
                    <div class="export-menu">
                        <button class="export-btn" onclick="event.stopPropagation(); exportCSV('${table}')">Export CSV</button> </br>
                        <button class="export-btn" onclick="event.stopPropagation(); exportJSON('${table}')">Convert to JSON</button>
                    </div>
                </li>`
            ).join('');
        })
        .catch(() => {
            document.getElementById('tableList').innerHTML = '<li>No tables found</li>';
        });
}

function exportJSON(tableName) {
    fetch(`/api/query?q=${encodeURIComponent(`SELECT * FROM ${tableName}`)}`)
        .then(response => response.json())
        .then(data => {
            if (data.error || !data.length) return;
            
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${tableName}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
}

function exportCSV(tableName) {
    fetch(`/api/query?q=${encodeURIComponent(`SELECT * FROM ${tableName}`)}`)
        .then(response => response.json())
        .then(data => {
            if (data.error || !data.length) return;
            
            const columns = Object.keys(data[0]);
            const csv = [columns.join(','), ...data.map(row => columns.map(col => `"${row[col] || ''}"`).join(','))].join('\n');
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${tableName}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        });
}

function selectTable(tableName) {
    insertTable(tableName);
    updateQueryHint(tableName);
}

function updateQueryHint(tableName) {
    const qhint = document.getElementById('qhint');
    qhint.innerHTML = `Try: SELECT * FROM ${tableName} | DESCRIBE ${tableName}`;
}

function insertTable(tableName) {
    const input = document.getElementById('sqlInput');
    const cursorPos = input.selectionStart;
    const textBefore = input.value.substring(0, cursorPos);
    const textAfter = input.value.substring(cursorPos);
    input.value = textBefore + tableName + textAfter;
    input.focus();
    input.setSelectionRange(cursorPos + tableName.length, cursorPos + tableName.length);
}

let isResizing = false;

function initResizer() {
    const resizer = document.getElementById('resizer');
    const sqlInput = document.getElementById('sqlInput');
    const results = document.getElementById('results');
    
    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize);
    });
    
    function handleResize(e) {
        if (!isResizing) return;
        const container = document.querySelector('.editor');
        const rect = container.getBoundingClientRect();
        const newHeight = e.clientY - rect.top - 60; // Adjust for toolbar height
        
        if (newHeight > 100 && newHeight < rect.height - 150) {
            sqlInput.style.height = newHeight + 'px';
            sqlInput.style.flex = 'none';
        }
    }
    
    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
    }
}

window.onload = () => {
    loadTables();
    initResizer();
};
