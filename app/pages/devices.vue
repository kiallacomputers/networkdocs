<template>
  <NuxtLayout>
    <h1>Device Inventory</h1>
    <div class="panel">
      <h2>Add device</h2>
      <div class="fields">
        <label>Company<select v-model.number="newDeviceCompany"><option :value="0">Choose company</option><option v-for="c in companies" :key="c.id" :value="Number(c.id)">{{c.name}}</option></select></label>
        <label>Name<input v-model="form.name" placeholder="SW-CORE-01"></label>
        <label>Type<select v-model="form.device_type"><option v-for="t in types" :key="t" :value="t">{{ t }}</option></select></label>
        <label>Manufacturer<input v-model="form.manufacturer"></label>
        <label>Model<input v-model="form.model"></label>
        <label>Serial<input v-model="form.serial"></label>
        <label>IP address<input v-model="form.ip_address"></label>
        <label>VLAN / Management VLAN<input v-model="form.vlan"></label>
        <label>Rack<select v-model="rackChoice"><option value="">Unplaced</option><option v-for="r in racks" :key="r.id" :value="String(r.id)">{{ r.site_name }} — {{ r.building_name || "Unassigned building" }} — {{ r.name }}</option></select></label>
        <label>Start U<input v-model="position" type="number" min="1" max="60" placeholder="Optional"></label>
        <label>Rack height (U)<input v-model.number="form.rack_height" type="number" min="1" max="60"></label>
        <label>Number of ports<input v-model.number="form.port_count" type="number" min="0" max="192"></label>
        <label>Notes<input v-model="form.notes"></label>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <button :disabled="!editable" @click="add">Create device</button>
    </div>
    <section class="panel">
      <h2>All devices ({{ devices.length }})</h2>
      <input v-model="search" placeholder="Search devices, serials, IPs…" style="width:100%;margin-bottom:12px">
      <div class="iv-filters"><label>Company<select v-model="filterCompany"><option value="">All companies</option><option v-for="c in companies" :key="c.id" :value="String(c.id)">{{c.name}}</option></select></label><label>Site<select v-model="filterSite"><option value="">All sites</option><option v-for="s in filterSites" :key="s.id" :value="String(s.id)">{{s.name}}</option></select></label><label>Building<select v-model="filterBuilding"><option value="">All buildings</option><option v-for="b in filterBuildings" :key="b.id" :value="String(b.id)">{{b.name}}</option></select></label><label>Floor<input v-model="filterFloor" placeholder="All floors"></label><label>Room<input v-model="filterRoom" placeholder="All rooms"></label></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Name</th><th>Type</th><th>Model</th><th>IP</th><th>Site / Building / Floor / Room / Rack</th><th>U</th><th>Ports</th><th v-if="editable">Action</th></tr></thead>
        <tbody><tr v-for="d in filtered" :key="d.id">
          <td><strong>{{ d.name }}</strong><div class="muted">{{ d.serial }}</div></td>
          <td>{{ d.device_type }}</td><td>{{ d.manufacturer }} {{ d.model }}</td><td>{{ d.ip_address }}</td>
          <td>{{ d.site_name || '—' }} / {{ d.building_name || '—' }} / {{ d.floor || '—' }} / {{ d.room || '—' }} / {{ d.rack_name || 'Unplaced' }}</td><td>{{ d.rack_u || '—' }}</td><td>{{ d.port_count }}</td>
          <td v-if="editable"><button type="button" @click="openEdit(d)">Edit</button> <button type="button" @click="openLocation(d)">Location</button></td>
        </tr></tbody>
      </table></div>
    </section>
    <div v-if="moving" class="iv-overlay" @click.self="closeLocation"><section class="panel iv-dialog" role="dialog" aria-modal="true" aria-labelledby="location-heading"><h2 id="location-heading">Device location — {{moving.name}}</h2><p class="muted">Rack-mounted devices inherit their site and building from the selected rack. Existing ports and patch connections are preserved.</p>
      <div class="fields"><label>Site<select v-model="locationForm.site_id" :disabled="!!locationForm.rack_id"><option :value="null">Unassigned site</option><option v-for="s in locationSites" :key="s.id" :value="Number(s.id)">{{s.name}}</option></select></label>
      <label>Building<select v-model="locationForm.building_id" :disabled="!!locationForm.rack_id || !locationForm.site_id"><option :value="null">Unassigned building</option><option v-for="b in locationBuildings" :key="b.id" :value="Number(b.id)">{{b.name}}</option></select></label>
      <label>Rack<select v-model="locationForm.rack_id"><option :value="null">Unracked device</option><option v-for="r in locationRacks" :key="r.id" :value="Number(r.id)">{{r.site_name}} / {{r.building_name || 'No building'}} / {{r.name}}</option></select></label>
      <label>Rack U<input v-model.number="locationForm.rack_u" type="number" min="1" max="60" :disabled="!locationForm.rack_id" placeholder="Required for rack placement"></label>
      <label>Floor<input v-model="locationForm.floor" maxlength="80" placeholder="e.g. Ground floor"></label><label>Room<input v-model="locationForm.room" maxlength="160" placeholder="e.g. ICT Office"></label></div>
      <p v-if="locationError" class="error" role="alert">{{locationError}}</p><div class="iv-actions"><button type="button" :disabled="locationSaving" @click="closeLocation">Cancel</button><button type="button" :disabled="locationSaving || (!!locationForm.rack_id && !locationForm.rack_u)" @click="saveLocation">{{locationSaving?'Saving…':'Save location'}}</button></div></section></div>
    <div v-if="editing" class="iv-overlay" @click.self="closeEdit">
      <section class="panel iv-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-device-heading">
        <h2 id="edit-device-heading">Edit device — {{ editing.name }}</h2>
        <p class="muted">Rack position and port count are managed separately to protect existing connections.</p>
        <div class="fields">
          <label>Name<input v-model="editForm.name" maxlength="120"></label>
          <label>Type<select v-model="editForm.device_type"><option v-for="t in types" :key="t" :value="t">{{ t }}</option></select></label>
          <label>Manufacturer<input v-model="editForm.manufacturer" maxlength="120"></label>
          <label>Model<input v-model="editForm.model" maxlength="120"></label>
          <label>Serial<input v-model="editForm.serial" maxlength="120"></label>
          <label>IP address<input v-model="editForm.ip_address" maxlength="80"></label>
          <label>VLAN / Management VLAN<input v-model="editForm.vlan" maxlength="80"></label>
          <label>Notes<textarea v-model="editForm.notes" maxlength="3000" rows="4"></textarea></label>
        </div>
        <p v-if="editError" class="error" role="alert">{{ editError }}</p>
        <div class="iv-actions"><button type="button" :disabled="saving" @click="closeEdit">Cancel</button><button type="button" :disabled="saving || !editForm.name.trim()" @click="saveEdit">{{ saving ? 'Saving…' : 'Save changes' }}</button></div>
      </section>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
const {data:companies}=await useFetch<any[]>('/api/companies',{default:()=>[]})
const newDeviceCompany=ref(0)
const {data:sites}=await useFetch<any[]>('/api/sites',{default:()=>[]})
const {data:buildings}=await useFetch<any[]>('/api/buildings',{default:()=>[]})
const filterCompany=ref(''),filterSite=ref(''),filterBuilding=ref(''),filterFloor=ref(''),filterRoom=ref('')
const filterSites=computed(()=>sites.value.filter(s=>!filterCompany.value||String(s.company_id)===filterCompany.value))
const filterBuildings=computed(()=>buildings.value.filter(b=>!filterSite.value?(!filterCompany.value||filterSites.value.some(s=>Number(s.id)===Number(b.site_id))):String(b.site_id)===filterSite.value))
watch(filterCompany,()=>{filterSite.value='';filterBuilding.value=''})
watch(filterSite,()=>{filterBuilding.value=''})
const auth = useAuth()
const editable = computed(() => ['admin', 'editor'].includes(auth.value?.role))
const { data: racks } = await useFetch<any[]>('/api/racks', { default: () => [] })
const { data: devices, refresh } = await useFetch<any[]>('/api/devices', { default: () => [] })
const types = ['switch', 'patch_panel', 'server', 'router', 'firewall', 'ups', 'other']
const form = reactive({ name: '', device_type: 'switch', manufacturer: '', model: '', serial: '', ip_address: '', vlan: '', notes: '', rack_height: 1, port_count: 24 })
const rackChoice = ref('')
const position = ref('')
const search = ref('')
const error = ref('')
const filtered = computed(() => devices.value.filter(d =>
 JSON.stringify(d).toLowerCase().includes(search.value.toLowerCase()) &&
 (!filterCompany.value||String(d.company_id)===filterCompany.value) &&
 (!filterSite.value||String(d.site_id)===filterSite.value) &&
 (!filterBuilding.value||String(d.building_id)===filterBuilding.value) &&
 (!filterFloor.value||String(d.floor||'').toLowerCase().includes(filterFloor.value.toLowerCase())) &&
 (!filterRoom.value||String(d.room||'').toLowerCase().includes(filterRoom.value.toLowerCase()))
))
const moving=ref<any>(null),locationSaving=ref(false),locationError=ref('')
const locationForm=reactive<{site_id:number|null;building_id:number|null;rack_id:number|null;rack_u:number|null;floor:string;room:string}>({site_id:null,building_id:null,rack_id:null,rack_u:null,floor:'',room:''})
const locationSites=computed(()=>sites.value.filter(s=>Number(s.company_id)===Number(moving.value?.company_id)))
const locationBuildings=computed(()=>buildings.value.filter(b=>Number(b.site_id)===Number(locationForm.site_id)))
const locationRacks=computed(()=>racks.value.filter(r=>locationSites.value.some(s=>Number(s.id)===Number(r.site_id))))
watch(()=>locationForm.site_id,()=>{if(!locationForm.rack_id&&!locationBuildings.value.some(b=>Number(b.id)===Number(locationForm.building_id)))locationForm.building_id=null})
watch(()=>locationForm.rack_id,(id)=>{if(id){const rack=racks.value.find(r=>Number(r.id)===Number(id));if(rack){locationForm.site_id=Number(rack.site_id);locationForm.building_id=rack.building_id==null?null:Number(rack.building_id)}}else locationForm.rack_u=null})
function openLocation(d:any){if(!editable.value)return;moving.value=d;locationError.value='';Object.assign(locationForm,{site_id:d.site_id==null?null:Number(d.site_id),building_id:d.building_id==null?null:Number(d.building_id),rack_id:d.rack_id==null?null:Number(d.rack_id),rack_u:d.rack_u==null?null:Number(d.rack_u),floor:d.floor||'',room:d.room||''})}
function closeLocation(){if(!locationSaving.value)moving.value=null}
async function saveLocation(){if(!moving.value||locationSaving.value)return;locationSaving.value=true;locationError.value='';try{await $fetch(`/api/devices/${moving.value.id}/location`,{method:'PATCH',body:{...locationForm}});await refresh();moving.value=null}catch(e:any){locationError.value=e?.data?.statusMessage||e?.data?.message||'Could not move device'}finally{locationSaving.value=false}}
async function add() {
  error.value = ''
  try {
    await $fetch('/api/devices', { method: 'POST', body: { ...form, company_id:newDeviceCompany.value, rack_id: rackChoice.value ? Number(rackChoice.value) : null, rack_u: position.value ? Number(position.value) : null } })
    form.name = ''; form.serial = ''; form.ip_address = ''
    await refresh()
  } catch (e: any) { error.value = e?.data?.statusMessage || 'Could not add device' }
}

type EditFields = { name: string; device_type: string; manufacturer: string; model: string; serial: string; ip_address: string; vlan: string; notes: string }
const editing = ref<any>(null)
const editForm = reactive<EditFields>({ name: '', device_type: 'switch', manufacturer: '', model: '', serial: '', ip_address: '', vlan: '', notes: '' })
const saving = ref(false)
const editError = ref('')
function openEdit(device: any) {
  if (!editable.value) return
  editing.value = device
  editError.value = ''
  for (const key of Object.keys(editForm) as (keyof EditFields)[]) editForm[key] = String(device[key] ?? '')
}
function closeEdit() { if (!saving.value) editing.value = null }
async function saveEdit() {
  if (!editing.value || !editable.value || saving.value) return
  saving.value = true
  editError.value = ''
  try {
    await $fetch(`/api/devices/${editing.value.id}/details`, { method: 'PATCH', body: { ...editForm } })
    await refresh()
    editing.value = null
  } catch (e: any) {
    editError.value = e?.data?.statusMessage || e?.data?.message || 'Could not update device'
  } finally { saving.value = false }
}
</script>

<style scoped>
.iv-filters { display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:14px; }
.iv-filters label { display:flex;flex-direction:column;gap:5px; }
.iv-overlay { position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,.72); display: flex; align-items: center; justify-content: center; padding: 20px; overflow: auto; }
.iv-dialog { width: min(900px,100%); max-height: 90vh; overflow-y: auto; margin: auto; }
.iv-dialog textarea { width: 100%; }
.iv-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
</style>
