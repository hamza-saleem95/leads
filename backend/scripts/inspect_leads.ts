import fs from 'fs';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'data', 'app_db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

console.log('Total Leads:', db.leads.length);
db.leads.forEach((l: any, i: number) => {
  console.log(`${i + 1}. [${l.id}] ${l.companyName} | Industry: ${l.industry} | City: ${l.city} | Website: ${l.website} | Phone: ${l.phone}`);
});
