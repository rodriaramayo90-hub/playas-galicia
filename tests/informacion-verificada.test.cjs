const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('ficha-playa-base.js','utf8');
const context={};vm.createContext(context);
vm.runInContext('const NO_DISPONIBLE="Información no disponible";'+source.slice(source.indexOf('function aplicarInformacionVerificada'),source.indexOf('async function iniciarFicha')),context);
const apply=context.aplicarInformacionVerificada;
const data=JSON.parse(fs.readFileSync('data/playas-detalle.json'));
const research=JSON.parse(fs.readFileSync('data/informacion-verificada.json'));
test('Cada dato tiene una playa válida, fecha y fuente HTTPS',()=>{
 for(const update of research.actualizaciones){assert(data.playas.some(p=>p.slug===update.slug),update.slug);assert.equal(new URL(update.url).protocol,'https:');assert.match(update.fecha,/^\d{4}-\d{2}-\d{2}$/);assert(update.nombre);}
});
test('Completa huecos sin sustituir revisiones y es idempotente',()=>{
 const update=research.actualizaciones[0];const playa={slug:update.slug,servicios:{chiringuito:'Revisión manual posterior',restaurantes:null}};
 apply(playa,research);assert.equal(playa.servicios.chiringuito,'Revisión manual posterior');assert.match(playa.servicios.restaurantes,/Tanxil/);
 const snapshot=JSON.stringify(playa);apply(playa,research);assert.equal(JSON.stringify(playa),snapshot);
});
test('Tanxil incluye establecimientos y conserva perros como pendiente',()=>{
 const beach=data.playas.find(b=>b.slug==='praia-de-tanxil');assert.match(beach.servicios.chiringuito,/NaAuga/i);assert.match(beach.servicios.restaurantes,/Tanxil/);assert.equal(beach.normas.perros,null);
});
test('La ausencia del suplemento no impide cargar la ficha',()=>{
 const beach={slug:'otra',servicios:{chiringuito:null}};assert.equal(apply(beach,null),beach);assert.equal(beach.servicios.chiringuito,null);
});
test('Xiorto tiene normas concisas y conserva las excepciones verificadas',()=>{
 const beach=structuredClone(data.playas.find(b=>b.slug==='praia-de-xiorto'));
 apply(beach,research);
 for(const value of Object.values(beach.normas)){assert(value);assert(value.length<80);}
 assert.match(beach.normas.perros,/1\/6 al 30\/9/);
 assert.match(beach.normas.perros,/guía/);
 assert.equal(beach.normas.nudismo,'No');
 assert.match(beach.normas.accesoVehiculos,/autorización/);
 assert.match(beach.normas.deportesAcuaticos,/balizado/);
 assert(beach.fuentes.some(f=>f.nota.includes('no confirma una zona deportiva')));
});
