const jsPDF = require('jspdf');
const bootstrap = require('bootstrap');
const $ = require('jquery');

var btnNewBBox = document.getElementById('btn-new-bbox');
var btnSaveBBox = document.getElementById('btn-save-bbox');
var btnPreviewBBox = document.getElementById('btn-preview-bbox');
var btnExportBBox = document.getElementById('btn-export-bbox');

var config = {
    categoryCount: 5,
    goalCount: 3,
    statusOnes: [
        '',
        'Qtr 1',
        'Qtr 2',
        'Qtr 3',
        'Qtr 4'
    ],
    statusTwos: [
        '',
        'YTD'
    ],
    yards: [
        'Kaley',
        'Orlando',
        'St. Pete',
        'Tampa'
    ],
    colors: [
        { description: 'Light Blue', textColor: '#000000', backgroundColor: '#b9d3ed', pdfColor: [185, 211, 237], pdfTextColor: [0, 0, 0] },
        { description: 'Blue', textColor: '#ffffff', backgroundColor: '#6097d4', pdfColor: [96, 151, 212], pdfTextColor: [255, 255, 255] }
    ]
};

var year = new Date().getFullYear();
var emptyGoal = { title: '', status1: '', status2: '' };

var stored = '{}';
try {
    stored = localStorage.getItem('tmr.bbox.files') || '{}';
}
catch (e) {
}
var bbox_files = JSON.parse(stored);
var blank = { year: year, yard: '', status1: 1, status2: 0, categories: [ { title: '', color: 0, goals: [emptyGoal, emptyGoal, emptyGoal] }, { title: '', color: 1, goals: [emptyGoal, emptyGoal, emptyGoal] }, { title: '', color: 1, goals: [emptyGoal, emptyGoal, emptyGoal] }, { title: '', color: 1, goals: [emptyGoal, emptyGoal, emptyGoal] }, { title: '', color: 1, goals: [emptyGoal, emptyGoal, emptyGoal] } ] };
bbox_files['2018 Kaley'] = {
    year: 2018,
    yard: 'Kaley',
    status1: 0,
    status2: 0,
    categories: [
        {
            title: 'Safety',
            color: 0,
            goals: [
                { title: 'Achieve the Nucor Safety and Environmental Awards', status1: '', status2: '' },
                { title: 'Zero OSHA Recordables', status1: '', status2: '' },
                { title: '', status1: '', status2: '' }
            ]
        },
        {
            title: 'Transportation Services',
            color: 1,
            goals: [
                { title: 'Increase average shred transfer weights by 2 GT ($18,000 in trucking savings)', status1: '', status2: '' },
                { title: 'Reduce average load time for shred trucks to 40 minutes', status1: '', status2: '' },
                { title: 'No trailer damage', status1: '', status2: '' }
            ]
        },
        {
            title: 'Commercial Excellence',
            color: 1,
            goals: [
                { title: 'Increase NF Purchasing by 15% (at 2017 margin equals $230,000 increase)', status1: '', status2: '' },
                { title: 'Increase shred purchasing by 5% ($35,000 increase)', status1: '', status2: '' },
                { title: '', status1: '', status2: '' }
            ]
        },
        {
            title: 'Operational Excellence',
            color: 1,
            goals: [
                { title: 'Decrease labor expence per GT produced by $4 (by increasing production and controlling overtime)', status1: '', status2: '' },
                { title: 'Keep scheduled maintenance on baler to help prevent unexpected downtime', status1: '', status2: '' },
                { title: '', status1: '', status2: '' }
            ]
        },
        {
            title: 'Hire, Develop & Retain',
            color: 1,
            goals: [
                { title: 'Hire and retain new Kiosk Operator', status1: '', status2: '' },
                { title: 'Cross train another baler operator and material handler operator', status1: '', status2: '' },
                { title: '', status1: '', status2: '' }
            ]
        }
    ]
};/**/

btnNewBBox.addEventListener('click', function(e) {
    e.preventDefault();
    newBBoxPage();
}, false);

btnSaveBBox.addEventListener('click', function(e) {
    e.preventDefault();
    var report = getReport();
    if (report) {
        saveReport(report);
    }
});

btnPreviewBBox.addEventListener('click', function(e) {
    e.preventDefault();
    showPreview();
});

btnExportBBox.addEventListener('click', function(e) {
    e.preventDefault();
    exportPDF();
});

var syncedSelectors = {};
var syncedToggleable = {};
var ss = document.querySelectorAll('select[data-sync]');
for (var i = 0; i < ss.length; i++) {
    var id = ss[i].getAttribute('data-sync');
    syncedSelectors[id] = syncedSelectors[id] || [];
    syncedSelectors[id].push(ss[i]);
    ss[i].addEventListener('change', function(e) {
        var id = this.getAttribute('data-sync');
        var value = this.options[this.selectedIndex].value;
        var others = syncedSelectors[id];
        for (var i = 0; i < others.length; i++) {
            others[i].selectedIndex = this.selectedIndex;
        }
        var toggle = syncedToggleable[id];
        if (toggle) {
            for (var i = 0; i < toggle.length; i++) {
                toggle[i].disabled = value.length == 0;
            }
        }
    }, false);
}
ss = null;

var ts = document.querySelectorAll('input[data-toggle]');
for (var i = 0; i < ts.length; i++) {
    var id = ts[i].getAttribute('data-toggle');
    syncedToggleable[id] = syncedToggleable[id] || [];
    syncedToggleable[id].push(ts[i]);
}
ts = null;

function newBBoxPage() {
    var newPage = showPage('pg-new-bbox');

    btnNewBBox.disabled = true;
    btnSaveBBox.disabled = true;
    btnPreviewBBox.disabled = true;
    btnExportBBox.disabled = true;

    var list = newPage.querySelector('.bbox-preview-list');
    while (list.children.length > 0) {
        list.removeChild(list.lastChild);
    }
    var files = Object.getOwnPropertyNames(bbox_files);
    var col = document.createElement('div');
    col.className = 'col col-6';
    var a = document.createElement('a');
    a.href = '#';
    a.className = 'bbox-preview bbox-preview-blank';
    a.addEventListener('click', editBBoxFunction(blank));
    var content = document.createElement('span');
    content.className = 'bbox-preview-content';
    content.innerText = 'Blank';
    a.appendChild(content);
    col.appendChild(a);
    list.appendChild(col);
    for (var i = 0; i < files.length; i++) {
        var bbox = bbox_files[files[i]];
        col = document.createElement('div');
        col.className = 'col col-6';
        a = makeSmallPreview(bbox, files[i]);
        col.appendChild(a);
        list.appendChild(col);
    }
}

function editBBoxFunction(report) {
    return function(e) { e.preventDefault(); editBBoxPage(report); };
}

function editBBoxPage(report) {
    var opt;
    var editPage = showPage('pg-edit-bbox');

    btnNewBBox.disabled = false;
    btnSaveBBox.disabled = false;
    btnPreviewBBox.disabled = false;
    btnExportBBox.disabled = false;

    var yearSelector = editPage.querySelector('#bbox_year');
    while (yearSelector.children.length > 0) {
        yearSelector.removeChild(yearSelector.lastChild);
    }
    var year = new Date().getFullYear();
    var minYear = Math.min(report.year, year - 2);
    var maxYear = Math.max(report.year, year + 2);
    if (maxYear < minYear) {
        var temp = maxYear;
        maxYear = minYear;
        minYear = temp;
    }
    for (var y = maxYear; y >= minYear; y--) {
        opt = document.createElement('option');
        opt.value = y;
        opt.innerText = y;
        if (y == report.year) {
            opt.selected = true;
        }
        yearSelector.appendChild(opt);
    }

    var yardSelector = editPage.querySelector('#bbox_yard');
    while (yardSelector.children.length > 0) {
        yardSelector.removeChild(yardSelector.lastChild);
    }
    if (report.yard == '') {
        var blank = document.createElement('option');
        yardSelector.appendChild(blank);
        var remove = function(e) {
            if (blank && yardSelector.options[yardSelector.selectedIndex].value != '') {
                yardSelector.removeChild(blank);
                blank = null;
            }
            if (!blank) {
                yardSelector.removeEventListener('change', remove, false);
            }
        };
        yardSelector.addEventListener('change', remove, false);
    }
    for (var i = 0; i < config.yards.length; i++) {
        opt = document.createElement('option');
        opt.value = config.yards[i];
        opt.innerText = config.yards[i];
        if (config.yards[i] == report.yard) {
            opt.selected = true;
        }
        yardSelector.appendChild(opt);
    }

    var status1s = document.querySelectorAll('input[data-toggle="status-1"]');
    for (var i = 0; i < status1s.length; i++) {
        status1s[i].disabled = report.status1 == 0;
    }
    var status2s = document.querySelectorAll('input[data-toggle="status-2"]');
    for (var i = 0; i < status2s.length; i++) {
        status2s[i].disabled = report.status2 == 0;
    }
    var status1selectors = document.querySelectorAll('select[data-sync="status-1"]');
    for (var i = 0; i < status1selectors.length; i++) {
        status1selectors[i].selectedIndex = report.status1;
    }
    var status2selectors = document.querySelectorAll('select[data-sync="status-2"]');
    for (var i = 0; i < status2selectors.length; i++) {
        status2selectors[i].selectedIndex = report.status2;
    }

    for (var i = 0; i < config.categoryCount; i++) {
        var title = document.getElementById('category-' + i + '-title');
        var color = document.getElementById('category-' + i + '-color');
        title.value = report.categories[i].title;
        color.setAttribute('data-value', report.categories[i].color);
        color.style.backgroundColor = config.colors[report.categories[i].color].backgroundColor;
        color.querySelector('span').innerText = config.colors[report.categories[i].color].description;
        for (var j = 0; j < config.goalCount; j++) {
            var goal = document.getElementById('category-' + i + '-goal-' + j);
            goal.value = report.categories[i].goals[j].title;
            var stat1 = document.getElementById('category-' + i + '-goal-' + j + '-status-1');
            stat1.value = report.status1 > 0 ? report.categories[i].goals[j].status1 : '';
            var stat2 = document.getElementById('category-' + i + '-goal-' + j + '-status-2');
            stat2.value = report.status2 > 0 ? report.categories[i].goals[j].status2 : '';
        }
    }
}

function makeSmallPreview(report, filename) {
    function makeCategory(category, className) {
        var cat = document.createElement('span');
        cat.className = 'bbox-cat ' + className;
        cat.style.backgroundColor = config.colors[category.color].backgroundColor;
        cat.style.color = config.colors[category.color].textColor;
        var content = document.createElement('span');
        content.className = 'bbox-cat-content';
        content.innerText = category.title;
        cat.appendChild(content);
        return cat;
    }
    var a = document.createElement('a');
    a.href = '#';
    a.className = 'bbox-preview';
    a.addEventListener('click', editBBoxFunction(report));
    var content = document.createElement('span');
    content.className = 'bbox-preview-content';
    var title = document.createElement('span');
    title.className = 'bbox-preview-title';
    title.innerText = filename;
    content.appendChild(title);
    content.appendChild(makeCategory(report.categories[1], 'top left'));
    content.appendChild(makeCategory(report.categories[2], 'top right'));
    content.appendChild(makeCategory(report.categories[3], 'bottom left'));
    content.appendChild(makeCategory(report.categories[4], 'bottom right'));
    content.appendChild(makeCategory(report.categories[0], 'center'));
    a.appendChild(content);
    return a;
}

function showPage(id) {
    var page = document.getElementById(id);
    var pages = document.getElementsByClassName('page');
    for (var i = 0; i < pages.length; i++) {
        pages[i].classList.remove('active');
    }
    page.classList.add('active');
    return page;
}

function getReport() {
    var report = { year: year, yard: '', status1: 0, status2: 0, categories: [ { title: '', color: 0, goals: [] }, { title: '', color: 1, goals: [] }, { title: '', color: 1, goals: [] }, { title: '', color: 1, goals: [] }, { title: '', color: 1, goals: [] } ] };
    var selectYear = document.getElementById('bbox_year');
    report.year = selectYear.options[selectYear.selectedIndex].value;
    var selectYard = document.getElementById('bbox_yard');
    report.yard = selectYard.options[selectYard.selectedIndex].value;
    if (report.yard == '') {
        showError({ message: 'Please select a yard' }).then(function() {
            selectYard.focus();
            selectYard = null;
        });
        return;
    }
    var selectStatus1 = document.querySelector('select[data-sync="status-1"]');
    report.status1 = selectStatus1.selectedIndex;
    var selectStatus2 = document.querySelector('select[data-sync="status-2"]');
    report.status2 = selectStatus2.selectedIndex;
    for (var i = 0; i < config.categoryCount; i++) {
        var title = document.getElementById('category-' + i + '-title');
        report.categories[i].title = title.value;
        if (title.value.length == 0) {
            showError({ message: 'Please enter a title for category ' + (i+1) }).then(function() {
                title.focus();
                title = null;
            });
            return;
        }
        var color = document.getElementById('category-' + i + '-color');
        report.categories[i].color = parseInt(color.getAttribute('data-value'), 10);
        for (var j = 0; j < config.goalCount; j++) {
            report.categories[i].goals.push({ title: '', status1: '', status2: '' });
            var goal = document.getElementById('category-' + i + '-goal-' + j);
            report.categories[i].goals[j].title = goal.value;
            if (report.status1 > 0) {
                var status1 = document.getElementById('category-' + i + '-goal-' + j + '-status-1');
                report.categories[i].goals[j].status1 = status1.value;
            }
            if (report.status2 > 0) {
                var status2 = document.getElementById('category-' + i + '-goal-' + j + '-status-2');
                report.categories[i].goals[j].status2 = status2.value;
            }
        }
    }
    return report;
}

function saveReport(report) {
    var filename = report.year + ' ' + report.yard;
    if (report.status1 > 0) {
        filename += ' ' + config.statusOnes[report.status1];
    } else if (report.status2 > 0) {
        filename += ' ' + statusTwos[report.status2];
    }
    if (bbox_files.hasOwnProperty(filename)) {
        showConfirm('Do you want to replace the existing "' + filename + '" report?').then(function() {
            bbox_files[filename] = report;
            try {
                localStorage.setItem('tmr.bbox.files', JSON.stringify(bbox_files));
                showMessage({ message: 'Saved ' + filename, title: 'Save' });
            } catch (e) {
                showError({ message: 'Unable to save the report.' });
            }
        }, function() {
            showError({ message: 'Unable to save the report because another report already exists with the same name.', title: 'Save' });
        });
    } else {
        bbox_files[filename] = report;
        try {
            localStorage.setItem('tmr.bbox.files', JSON.stringify(bbox_files));
            showMessage({ message: 'Saved ' + filename, title: 'Save' });
        } catch (e) {
            showError({ message: 'Unable to save the report.' });
        }
    }
}

function showMessage(options) {
    var promise = new Promise(function(resolve, reject) {
        setTimeout(function() {
            alert(options.message);
            resolve();
        }, 0);
    });
    return promise;
}

function showError(options) {
    var promise = new Promise(function(resolve, reject) {
        setTimeout(function() {
            alert(options.message);
            resolve();
        }, 0);
    });
    return promise;
}

function showConfirm(message) {
    var promise = new Promise(function(resolve, reject) {
        setTimeout(function() {
            var result = confirm(message);
            if (result) {
                resolve();
            } else {
                reject();
            }
        }, 0);
    });
    return promise;
}

function makePDF(report) {
    // Landscape, US Letter
    var doc = new jsPDF({
        orientation: 'landscape',
        unit: 'in',
        format: [11, 8.5],
        lineHeight: 1.25
    });
    var pt = 1/72;

    doc.setFont("helvetica");
    //doc.setFontType('bold');
    doc.setFontSize(28);
    doc.text(report.year + ' Strategic Goals', 5.5, 0.75, null, null, 'center');
    doc.setFontSize(12);
    doc.text('Yard: ' + report.yard, 5.5, 1+1/16, null, null, 'center');

    // top left
    var box = report.categories[1];
    var title = box.title;
    var bgColor = config.colors[box.color].pdfColor;
    var color = config.colors[box.color].pdfTextColor;
    var goals = box.goals;
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    drawTopLeftBox(doc, 0.5, 1.5, 5 - pt, 3.25 - pt, 1, 'F');
    drawCenterTextUnderline(doc, title, 2.4, 2, 16, color);
    doc.setTextColor(0, 0, 0);
    drawGoals(doc, goals, 1.0, 2.25, 2.9, 2.3, report.status1, report.status2);

    // top right
    var box = report.categories[2];
    var title = box.title;
    var bgColor = config.colors[box.color].pdfColor;
    var color = config.colors[box.color].pdfTextColor;
    var goals = box.goals;
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    drawTopRightBox(doc, 5.5 + pt, 1.5, 5 - pt, 3.25 - pt, 1, 'F');
    drawCenterTextUnderline(doc, title, 8.6, 2, 16, color);
    doc.setTextColor(0, 0, 0);
    drawGoals(doc, goals, 7.3, 2.25, 2.9, 2.3, report.status1, report.status2);

    // bottom left
    var box = report.categories[3];
    var title = box.title;
    var bgColor = config.colors[box.color].pdfColor;
    var color = config.colors[box.color].pdfTextColor;
    var goals = box.goals;
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    drawBottomLeftBox(doc, 0.5, 4.75 + pt, 5 - pt, 3.25 - pt, 1, 'F');
    drawCenterTextUnderline(doc, title, 2.4, 5.25, 16, color);
    doc.setTextColor(0, 0, 0);
    drawGoals(doc, goals, 1.0, 5.50, 2.9, 2.3, report.status1, report.status2);

    // bottom right
    var box = report.categories[4];
    var title = box.title;
    var bgColor = config.colors[box.color].pdfColor;
    var color = config.colors[box.color].pdfTextColor;
    var goals = box.goals;
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    drawBottomRightBox(doc, 5.5 + pt, 4.75 + pt, 5 - pt, 3.25 - pt, 1, 'F');
    drawCenterTextUnderline(doc, title, 8.6, 5.25, 16, color);
    doc.setTextColor(0, 0, 0);
    drawGoals(doc, goals, 7.3, 5.50, 2.9, 2.3, report.status1, report.status2);

    // center
    var box = report.categories[0];
    var title = box.title;
    var bgColor = config.colors[box.color].pdfColor;
    var color = config.colors[box.color].pdfTextColor;
    var goals = box.goals;
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.roundedRect(4, 3, 3, 3.5, 0.5, 0.5, 'F');
    drawCenterTextUnderline(doc, title, 5.5, 3.5-.125, 16, color);
    doc.setTextColor(0, 0, 0);
    drawGoals(doc, goals, 4.3, 3.75-.125, 2.65, 2.8, report.status1, report.status2);

    return doc;
}

function drawGoals(doc, goals, x, y, maxLineWidth, maxHeight, stat1, stat2) {
    var lineHeight = 1.25,
        fontSize = 10,
        smallFontSize = 8,
        ptsPerInch = 72,
        oneLineHeight = fontSize * lineHeight / ptsPerInch;

    //doc.setDrawColor(0, 0, 0);
    //doc.setLineWidth(1/144);
    //doc.rect(x, y, maxLineWidth, maxHeight, 'S');

    var n = 0;
    y += fontSize / ptsPerInch;
    for (var i = 0; i < goals.length; i++) {
        if (goals[i].title.length == 0) {
            continue;
        }
        // splitTextToSize takes your string and turns it in to an array of strings,
        // each of which can be displayed within the specified maxLineWidth.
        var textLines = doc
            .setFontStyle('normal')
            .setFontSize(fontSize)
            .splitTextToSize(goals[i].title, maxLineWidth);
        // doc.text can now add those lines easily; otherwise, it would have run text off the screen!
        doc.text((++n) + '.', x - (1.5 * fontSize / ptsPerInch), y);
        doc.text(textLines, x, y);
        var textHeight = textLines.length * oneLineHeight;
        y += textHeight;

        if ((stat1 > 0 && goals[i].status1.length > 0) || (stat2 > 0 && goals[i].status2.length > 0)) {
            if (stat1 > 0) {
                doc.setFontStyle('bold').setFontSize(smallFontSize);
                doc.text(config.statusOnes[stat1], x, y);
            }
            if (stat2 > 0) {
                doc.setFontStyle('bold').setFontSize(smallFontSize);
                doc.text(config.statusTwos[stat2], x + (maxLineWidth/2), y);
            }
            y += smallFontSize * lineHeight / ptsPerInch;
            var statlines;
            var textHeight = 0
            if (goals[i].status1.length > 0) {
                statlines = doc
                    .setFontStyle('normal')
                    .setFontSize(smallFontSize)
                    .splitTextToSize(goals[i].status1, (maxLineWidth / 2) - 0.125);
                doc.text(statlines, x, y);
                textHeight = Math.max(textHeight, (statlines.length + 0.25) * smallFontSize * lineHeight / ptsPerInch);
            }
            if (goals[i].status2.length > 0) {
                var statlines = doc
                    .setFontStyle('normal')
                    .setFontSize(smallFontSize)
                    .splitTextToSize(goals[i].status1, (maxLineWidth / 2));
                doc.text(statlines, x + (maxLineWidth/2), y);
                textHeight = Math.max(textHeight, (statlines.length + 0.25) * smallFontSize * lineHeight / ptsPerInch);
            }
            y += textHeight;
        }
        else {
            y += oneLineHeight;
        }

        y += 0.25 * oneLineHeight;
    }
}

function drawCenterTextUnderline(doc, str, x, y, fontsize, color) {
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setFontSize(fontsize);
    doc.setFontStyle('bold');
    var width = (doc.getStringUnitWidth(str) * fontsize) / 72 + (fontsize / 144);
    doc.setLineWidth(1/72);
    var uy = y + (fontsize * 0.125) / 72;
    doc.line(x - width/2, uy, x + width/2, uy);
    doc.text(str, x, y, null, null, 'center');
}

function drawTopLeftBox(doc, x, y, w, h, r, style) {
    doc.circle(x+r, y+r, r, style);
    doc.rect(x+r, y, w-r, h, style);
    doc.rect(x, y+r, w, h-r, style);
}

function drawTopRightBox(doc, x, y, w, h, r, style) {
    doc.circle(x+w-r, y+r, r, style);
    doc.rect(x, y, w-r, h, style);
    doc.rect(x, y+r, w, h-r, style);
}

function drawBottomLeftBox(doc, x, y, w, h, r, style) {
    doc.circle(x+r, y+h-r, r, style);
    doc.rect(x+r, y, w-r, h, style);
    doc.rect(x, y, w, h-r, style);
}

function drawBottomRightBox(doc, x, y, w, h, r, style) {
    doc.circle(x+w-r, y+h-r, r, style);
    doc.rect(x, y, w-r, h, style);
    doc.rect(x, y, w, h-r, style);
}

function showPreview() {
    var report = getReport();
    if (report) {
        var pdf = makePDF(report);
        var iframe = document.getElementById('preview-iframe');
        iframe.src = 'node_modules/electron-pdf-window/pdfjs/web/viewer.html?file=' + pdf.output('bloburl');
        var modal = document.getElementById('preview-dialog');
        $(modal).modal({
            backdrop: 'static',
            keyboard: true,
            focus: true,
            show: true
        });
    }
}

function exportPDF() {
    var report = getReport();
    if (report) {
        var filename = report.year + ' ' + report.yard;
        if (report.status1 > 0) {
            filename += ' ' + config.statusOnes[report.status1];
        } else if (report.status2 > 0) {
            filename += ' ' + statusTwos[report.status2];
        }
        var pdf = makePDF(report);
        pdf.save(filename + '.pdf');
    }
}

newBBoxPage();
