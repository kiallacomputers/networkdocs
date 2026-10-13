<template>
<NuxtLayout>
 <h1>Administration — Companies & Sites</h1>
 <p class="muted">Organise companies, sites and buildings. Building permissions inherit from their company.</p>
 <p v-if="error" class="panel error" role="alert">{{ error }}</p>
 <p v-if="notice" class="panel success">{{ notice }}</p>
 <section class="panel"><h2>Create company</h2>
  <form @submit.prevent="createCompany"><div class="fields">
   <label>Company name<input v-model="name" required maxlength="160" placeholder="St Joseph's College" /></label>
   <label>Description<input v-model="description" maxlength="1000" /></label>
  </div><button :disabled="busy">Create company</button></form>
 </section>
 <section class="panel"><h2>Companies</h2>
  <div v-if="!companies.length" class="muted">No companies yet.</div>
  <div v-for="company in companies" :key="company.id" style="margin-bottom:14px">
   <strong>{{ company.name }}</strong> <span class="muted">({{ company.site_count }} sites)</span>
   <div v-for="site in sites.filter(s=>Number(s.company_id)===Number(company.id))" :key="site.id" style="padding-left:24px;margin-top:7px">↳ {{ site.name }}
    <div v-for="building in buildings.filter(b=>Number(b.site_id)===Number(site.id))" :key="building.id" style="padding-left:26px;margin-top:6px">↳ {{building.name}} <span class="muted">{{building.code}}</span><button style="margin-left:10px" @click="editBuilding(building)">Edit</button></div>
    <form class="fields" style="padding-left:26px;margin-top:8px" @submit.prevent="createBuilding(site.id)"><label>New building<input v-model="buildingNames[site.id]" maxlength="120" required placeholder="Building 1" /></label><label>Code (optional)<input v-model="buildingCodes[site.id]" maxlength="40" placeholder="B1" /></label><button :disabled="busy" style="align-self:end">Add building</button></form>
   </div>
  </div>
 </section>
 <section class="panel"><h2>Assign existing sites</h2>
  <p class="muted">Choose the correct customer for each existing site. Nothing is assigned automatically.</p>
  <div v-for="site in sites" :key="site.id" class="fields" style="align-items:end;margin-bottom:10px">
   <label>{{ site.name }}<select :value="site.company_id ?? ''" @change="selectCompany(site.id,$event)" :disabled="busy">
    <option value="">Unassigned</option><option v-for="company in companies" :key="company.id" :value="company.id">{{ company.name }}</option>
   </select></label>
  </div>
 </section>
</NuxtLayout>
</template>
<script setup lang="ts">
const {data:companies,refresh:refreshCompanies}=await useFetch<any[]>('/api/admin/companies',{default:()=>[]})
const {data:sites,refresh:refreshSites}=await useFetch<any[]>('/api/admin/companies/sites',{default:()=>[]})
const {data:buildings,refresh:refreshBuildings}=await useFetch<any[]>('/api/buildings',{default:()=>[]})
const buildingNames=reactive<Record<number,string>>({}),buildingCodes=reactive<Record<number,string>>({})
const name=ref(''),description=ref(''),error=ref(''),notice=ref(''),busy=ref(false)
async function createCompany(){error.value='';notice.value='';busy.value=true;try{
 await $fetch('/api/admin/companies',{method:'POST',body:{name:name.value,description:description.value}})
 name.value='';description.value='';await refreshCompanies();notice.value='Company created'
}catch(e:any){error.value=e?.data?.statusMessage||e?.message||'Unable to create company'}finally{busy.value=false}}
async function selectCompany(siteId:number,event:Event){const target=event.target as HTMLSelectElement;const value=Number(target.value);if(!value){error.value='Choose a company to assign this site';await refreshSites();return}
 error.value='';notice.value='';busy.value=true;try{await $fetch('/api/admin/companies/assign-site',{method:'PATCH',body:{site_id:Number(siteId),company_id:value}});await Promise.all([refreshSites(),refreshCompanies()]);notice.value='Site assigned'}catch(e:any){error.value=e?.data?.statusMessage||e?.message||'Assignment failed';await refreshSites()}finally{busy.value=false}}
async function createBuilding(siteId:number){error.value='';notice.value='';busy.value=true;try{await $fetch('/api/buildings',{method:'POST',body:{site_id:siteId,name:buildingNames[siteId],code:buildingCodes[siteId]||'',description:''}});buildingNames[siteId]='';buildingCodes[siteId]='';await refreshBuildings();notice.value='Building created'}catch(e:any){error.value=e?.data?.statusMessage||e?.message||'Unable to create building'}finally{busy.value=false}}
async function editBuilding(building:any){const name=window.prompt('Building name',building.name);if(name===null||!name.trim())return;const code=window.prompt('Building code',building.code||'');if(code===null)return;error.value='';notice.value='';try{await $fetch(`/api/buildings/${building.id}`,{method:'PATCH',body:{name:name.trim(),code:code.trim(),description:building.description||''}});await refreshBuildings();notice.value='Building updated'}catch(e:any){error.value=e?.data?.statusMessage||e?.message||'Unable to update building'}}
</script>

