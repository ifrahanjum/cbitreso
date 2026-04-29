const { PdfReader } = require('pdfreader');
const fs = require('fs');

let pages = [];
let currentPageY = {};

new PdfReader().parseFileItems("R22A-Schema-Syllabus-BECSE-I-VIII-Semesters-Open-Electives.pdf", function(err, item) {
  if (err) console.error(err);
  else if (!item) {
    if (Object.keys(currentPageY).length > 0) pages.push(currentPageY);
    processText();
  } else if (item.page) {
    if (Object.keys(currentPageY).length > 0) pages.push(currentPageY);
    currentPageY = {};
  } else if (item.text) {
      if (!currentPageY[item.y]) currentPageY[item.y] = [];
      currentPageY[item.y].push(item.text);
  }
});

function processText() {
    let lines = [];
    for (let p of pages) {
        Object.keys(p).sort((a, b) => parseFloat(a) - parseFloat(b)).forEach(y => {
            lines.push(p[y].join(' ').trim());
        });
    }

    let courses = {};
    let currentCourseCode = null;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        let codeMatch = line.match(/^(22[A-Z]{3,4}[0-9]{2,3}[A-Z]?|22CSExx|22xxxxx)/);
        if (codeMatch && line.length < 25) {
            currentCourseCode = codeMatch[1];
            if (currentCourseCode === '22CSExx' || currentCourseCode === '22xxxxx') continue;
            if (!courses[currentCourseCode]) courses[currentCourseCode] = [];
        }

        if (currentCourseCode && courses[currentCourseCode]) {
            if (line.match(/^UNIT\s*[-–]?\s*[IVX1-5]+/i) || line.match(/^MODULE\s*[-–]?\s*[0-9]+/i) || line.startsWith("LIST OF EXPERIMENTS") || line.startsWith("LIST OF PROGRAMS") || line.startsWith("LABORATORY / PRACTICAL EXPERIMENTS") || line.startsWith("LIST OF LABORATORY EXPERIMENTS")) {
                let unitTitle = line;
                let unitContent = "";
                let j = i + 1;
                while (j < lines.length) {
                    let innerLine = lines[j].trim();
                    if (innerLine.match(/^UNIT\s*[-–]?\s*[IVX1-5]+/i) || innerLine.match(/^MODULE\s*[-–]?\s*[0-9]+/i) || innerLine.startsWith("TEXT BOOKS") || innerLine.startsWith("SUGGESTED READING") || innerLine.startsWith("ONLINE RESOURCES")) {
                        break;
                    }
                    if (innerLine) {
                        unitContent += innerLine + " ";
                    }
                    j++;
                }
                
                if (unitContent.length > 0) {
                    if (!line.startsWith("LIST")) {
                        let colonIdx = unitContent.indexOf(':');
                        if (colonIdx !== -1 && colonIdx < 100) {
                            unitTitle += " - " + unitContent.substring(0, colonIdx);
                            unitContent = unitContent.substring(colonIdx + 1).trim();
                        }
                    }
                    courses[currentCourseCode].push({ title: unitTitle, content: unitContent.trim() });
                }
                i = j - 1; 
            }
        }
    }

    fs.writeFileSync('parsed_syllabus.json', JSON.stringify(courses, null, 2));
    console.log("Extracted successfully.");
}
