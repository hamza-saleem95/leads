import fs from 'fs';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'data', 'app_db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const out = db.leads.map((l: any, i: number) => ({
  index: i + 1,
  id: l.id,
  name: l.companyName,
  industry: l.industry,
  website: l.website,
  phone: l.phone,
  city: l.city,
  country: l.country
}));

fs.writeFileSync(path.resolve(process.cwd(), 'scripts', 'leads_dump.json'), JSON.stringify(out, null, 2), 'utf8');
console.log('Saved', out.length, 'leads to scripts/leads_dump.json');
