import fs from 'node:fs';
import path from 'node:path';

const SCHEMA_PATH = path.join(process.cwd(), 'src/db/schema.ts');
const DRIZZLE_DIR = path.join(process.cwd(), 'drizzle');

function parseCommentsFromSchema(schemaPath: string): Map<string, string> {
  const content = fs.readFileSync(schemaPath, 'utf-8');
  const lines = content.split('\n');

  const columnComments = new Map<string, string>();
  let lastComment = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('//')) {
      lastComment = line.replace(/^\/\/\s*/, '').trim();
    } else if (line.startsWith('/*') || line.startsWith('*')) {
      const cleaned = line
        .replace(/^\/\*\*?\s*/, '')
        .replace(/\*\/$/, '')
        .replace(/^\*\s*/, '')
        .trim();
      if (cleaned) lastComment = cleaned;
    } else if (lastComment && line.includes(':')) {
      const fieldMatch = line.match(
        /^([a-zA-Z0-9_]+)\s*:\s*[a-zA-Z0-9_]+\(\s*['"]([^'"]+)['"]/,
      );
      if (fieldMatch) {
        const dbColumnName = fieldMatch[2];
        columnComments.set(dbColumnName, lastComment);
        lastComment = '';
      } else {
        const simpleFieldMatch = line.match(/^([a-zA-Z0-9_]+)\s*:/);
        if (simpleFieldMatch) {
          const fieldName = simpleFieldMatch[1];
          const snakeCaseName = fieldName.replace(
            /[A-Z]/g,
            (letter) => `_${letter.toLowerCase()}`,
          );
          columnComments.set(snakeCaseName, lastComment);
          lastComment = '';
        }
      }
    } else if (
      line !== '' &&
      !line.startsWith('//') &&
      !line.startsWith('/*') &&
      !line.startsWith('*')
    ) {
      lastComment = '';
    }
  }

  return columnComments;
}

function processSqlFiles() {
  if (!fs.existsSync(DRIZZLE_DIR)) {
    console.log('No drizzle directory found.');
    return;
  }

  const commentsMap = parseCommentsFromSchema(SCHEMA_PATH);
  if (commentsMap.size === 0) {
    console.log('No comments found in schema.ts');
    return;
  }

  const sqlFiles = fs
    .readdirSync(DRIZZLE_DIR)
    .filter((file) => file.endsWith('.sql'))
    .map((file) => path.join(DRIZZLE_DIR, file));

  for (const sqlFile of sqlFiles) {
    let content = fs.readFileSync(sqlFile, 'utf-8');
    let modified = false;

    for (const [colName, comment] of commentsMap.entries()) {
      const sqlCommentEscaped = comment.replace(/'/g, "''");

      const colRegex = new RegExp(
        `(\`\\b${colName}\\b\`\\s+[^,\\n]+?)(?=(\\s*,|\\s*$))`,
        'g',
      );

      content = content.replace(colRegex, (match, p1) => {
        if (!p1.includes('COMMENT')) {
          modified = true;
          return `${p1} COMMENT '${sqlCommentEscaped}'`;
        }
        return match;
      });
    }

    if (modified) {
      fs.writeFileSync(sqlFile, content, 'utf-8');
      console.log(
        `✅ Added SQL comments to migration file: ${path.basename(sqlFile)}`,
      );
    } else {
      console.log(
        `ℹ️ SQL comments already up to date: ${path.basename(sqlFile)}`,
      );
    }
  }
}

processSqlFiles();
