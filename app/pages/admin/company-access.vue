<template><NuxtLayout><h1>Administration — Company Access</h1>
<p class="muted">Grant users access only to the companies they manage. The global user role is the maximum permission. Company permissions can only restrict it. Changing access signs out the affected user.</p>
<p v-if="error" class="error" role="alert">{{error}}</p><p v-if="notice" class="muted">{{notice}}</p>
<section class="panel"><h2>Assign company permissions</h2><div class="fields">
<label>User<select v-model.number="form.user_id"><option :value="0">Choose user</option><option v-for="u in users" :key="u.id" :value="Number(u.id)">{{u.display_name}} — {{u.email}}</option></select></label>
<label>Company<select v-model.number="form.company_id"><option :value="0">Choose company</option><option v-for="c in companies" :key="c.id" :value="Number(c.id)">{{c.name}}</option></select></label>
<label>Permission<select v-model="form.role"><option value="viewer">Viewer</option><option value="editor">Editor</option><option value="admin">Company Admin</option><option value="remove">Remove access</option></select></label></div>
<button :disabled="busy||!form.user_id||!form.company_id" @click="save">Save company access</button></section>
<section class="panel"><h2>Current assignments</h2><div class="table-wrap"><table><thead><tr><th>Company</th><th>User</th><th>Global role</th><th>Company role</th><th>Effective access</th></tr></thead><tbody><tr v-for="a in assignments" :key="a.company_id+'-'+a.user_id"><td>{{a.company_name}}</td><td>{{a.display_name}}</td><td>{{a.global_role}}</td><td>{{a.role}}</td><td><strong>{{a.effective_role}}</strong></td></tr></tbody></table></div></section>
</NuxtLayout></template>
<script setup lang="ts">
const auth=useAuth();if(!auth.value?.is_super_admin)await navigateTo('/')
const {data:users}=await useFetch<any[]>('/api/admin/users',{default:()=>[]})
const {data:companies}=await useFetch<any[]>('/api/companies',{default:()=>[]})
const {data:assignments,refresh}=await useFetch<any[]>('/api/admin/company-access',{default:()=>[]})
const form=reactive({user_id:0,company_id:0,role:'viewer'}),busy=ref(false),error=ref(''),notice=ref('')
async function save(){busy.value=true;error.value='';notice.value='';try{await $fetch('/api/admin/company-access',{method:'PUT',body:{user_id:form.user_id,company_id:form.company_id,role:form.role==='remove'?null:form.role}});await refresh();notice.value='Access updated; affected user must sign in again'}catch(e:any){error.value=e?.data?.statusMessage||e?.message||'Unable to update access'}finally{busy.value=false}}
</script>
