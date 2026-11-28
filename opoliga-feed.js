// Hlášení Opoligy: veřejné čtení, zápis přes přihlášený GitHub účet.
const opoligaPlayers = ["Martin Rosůlek","Vašek Herčík","Walda Havránek","Jana Brzková","Lubošek Ladislav","Milda Konvalina","Láďa Fiala","Borďa Kolář","Petr Rohlíček","Luboš Šťastný"];
function parseReport(issue,players) {
 if(issue?.user?.login?.toLowerCase()!=="1venca69-coder"||issue.pull_request||issue.state!=="open"||!issue.title.startsWith("[OPOLIGA]"))return null;
 const fields={};
 for(const m of (issue.body||"").replace(/\r/g,"").matchAll(/^### ([^\n]+)\n+([\s\S]*?)(?=^### |$(?![\s\S]))/gm)) fields[m[1].trim()]=m[2].trim();
 const date=fields["Datum zápasu"],venue=fields["Místo konání"],a=fields["Hráč 1"],b=fields["Hráč 2"],score=fields["Výsledek"]?.match(/^(\d{1,2})\s*:\s*(\d{1,2})$/);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||"")||!date.startsWith("2026-")||!venue||venue.length>160||venue.includes("\n")||!players.includes(a)||!players.includes(b)||a===b||!score)return null;
 const d=new Date(date+"T00:00:00Z");
 if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==date||date>new Date().toISOString().slice(0,10))return null;
 const x=Number(score[1]),y=Number(score[2]);if(x>25||y>25)return null;
 return {id:issue.number,date,venue,a,b,x,y};
}
async function syncOpoligaReports() {
 const status=document.getElementById("opoliga-sync-status"),table=document.getElementById("liga-results");
 if(!table||!status)return;
 try {
  const issues=[];
  for(let page=1;page<=10;page++){
   const r=await fetch("https://api.github.com/repos/1venca69-coder/carrom-opocnice/issues?state=open&creator=1venca69-coder&per_page=100&page="+page,{cache:"no-store",credentials:"omit",headers:{Accept:"application/vnd.github+json"}});
   if(!r.ok)throw Error("HTTP "+r.status);
   const batch=await r.json();if(!Array.isArray(batch))throw Error("Neplatná odpověď");
   issues.push(...batch);if(batch.length<100)break;if(page===10)throw Error("Příliš mnoho hlášení");
  }
  const reports=issues.map(i=>parseReport(i,opoligaPlayers)).filter(Boolean).sort((a,b)=>a.date.localeCompare(b.date)||a.id-b.id);
  for(const old of table.querySelectorAll("tr[data-report-id]"))old.remove();
  const key=(date,a,b,x,y)=>JSON.stringify([date,...(a.localeCompare(b)<0?[a,b,x,y]:[b,a,y,x])]);
  const seen=new Set();
  for(const row of table.rows){const t=row.querySelector("time[datetime]");if(!t||row.cells.length!==4)continue;const s=row.cells[3].textContent.match(/^(\d+)\s*:\s*(\d+)$/);if(s)seen.add(key(t.dateTime,row.cells[1].textContent.trim(),row.cells[2].textContent.trim(),+s[1],+s[2]));}
  let count=0,duplicates=0;
  for(const m of reports){
   const k=key(m.date,m.a,m.b,m.x,m.y);if(seen.has(k)){duplicates++;continue;}seen.add(k);
   const row=table.insertRow();row.dataset.reportId=String(m.id);row.title="Místo: "+m.venue;
   const t=document.createElement("time");t.dateTime=m.date;t.textContent=m.date.split("-").reverse().map(Number).join(". ")+".";
   row.insertCell().append(t);
   for(const v of [m.a,m.b,m.x+" : "+m.y])row.insertCell().textContent=v;
   count++;
  }
  recalculateLeague();latestLeague();
  status.textContent="Synchronizováno: "+count+" nových zápisů"+(duplicates?", "+duplicates+" shodných zápisů vynecháno":"")+".";
 }catch(e){status.textContent="Online hlášení se nepodařilo načíst. Zobrazené výsledky mohou být neaktuální.";}
}
window.addEventListener("DOMContentLoaded",()=>{syncOpoligaReports();let last=Date.now();document.addEventListener("visibilitychange",()=>{if(!document.hidden&&Date.now()-last>60000){last=Date.now();syncOpoligaReports();}});});
