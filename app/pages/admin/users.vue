<template>
<NuxtLayout>
  <h1>Administration — Users</h1>
  <p class="muted">Manage accounts and permissions. Changes are recorded in the audit log.</p>
  <div v-if="error" class="panel error" role="alert">{{ error }}</div>
  <div v-if="notice" class="panel success">{{ notice }}</div>
  <section class="panel">
    <h2>Create user</h2>
    <form @submit.prevent="createUser">
      <div class="fields">
        <label>Display name<input v-model="form.display_name" required maxlength="120" /></label>
        <label>Email<input v-model="form.email" type="email" required /></label>
        <label>Temporary password<input v-model="form.password" type="password" required minlength="12" autocomplete="new-password" /></label>
        <label>Role<select v-model="form.role"><option value="viewer">Viewer</option><option value="editor">Editor</option><option value="admin">Administrator</option></select></label>
      </div>
      <button :disabled="busy">Create account</button>
    </form>
  </section>
  <section class="panel">
    <h2>Accounts</h2>
    <div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
      <tbody><tr v-for="u in users" :key="u.id"><td>{{ u.display_name }}</td><td>{{ u.email }}</td><td>{{ u.role }}</td><td>{{ u.is_active ? 'Active' : 'Disabled' }}</td><td><button @click="openEdit(u)">Manage</button></td></tr></tbody>
    </table></div>
  </section>
  <div v-if="editing" class="iv-overlay" @click.self="editing=null">
    <section class="panel iv-dialog" role="dialog" aria-modal="true" aria-label="Manage user">
      <h2>Manage {{ editing.email }}</h2>
      <form @submit.prevent="saveUser">
        <div class="fields">
          <label>Display name<input v-model="edit.display_name" required maxlength="120" /></label>
          <label>Role<select v-model="edit.role" :disabled="editing.id===auth?.id"><option value="viewer">Viewer</option><option value="editor">Editor</option><option value="admin">Administrator</option></select></label>
          <label>New password (leave blank to keep)<input v-model="edit.password" type="password" minlength="12" autocomplete="new-password" /></label>
          <label>Status<select v-model="edit.is_active" :disabled="editing.id===auth?.id"><option :value="true">Active</option><option :value="false">Disabled</option></select></label>
        </div>
        <p class="muted">Changing a role, password or disabling an account signs out its existing sessions.</p>
        <div style="display:flex;gap:10px"><button :disabled="busy">Save changes</button><button type="button" @click="editing=null">Cancel</button></div>
      </form>
    </section>
  </div>
</NuxtLayout>
</template>
<script setup lang="ts">
const auth=useAuth()
if(auth.value?.role!=='admin') await navigateTo('/')
const {data:users,refresh}=await useFetch<any[]>('/api/admin/users',{default:()=>[]})
const form=reactive({display_name:'',email:'',password:'',role:'viewer'})
const edit=reactive({display_name:'',role:'viewer',password:'',is_active:true})
const editing=ref<any>(null),busy=ref(false),error=ref(''),notice=ref('')
function message(e:any){return e?.data?.statusMessage||e?.data?.message||e?.message||'Request failed'}
async function createUser(){error.value='';notice.value='';busy.value=true;try{await $fetch('/api/admin/users',{method:'POST',body:form});form.display_name='';form.email='';form.password='';form.role='viewer';await refresh();notice.value='Account created'}catch(e){error.value=message(e)}finally{busy.value=false}}
function openEdit(u:any){editing.value=u;Object.assign(edit,{display_name:u.display_name,role:u.role,password:'',is_active:u.is_active})}
async function saveUser(){if(!editing.value)return;error.value='';notice.value='';busy.value=true;try{const body:any={display_name:edit.display_name,role:edit.role,is_active:edit.is_active};if(edit.password)body.password=edit.password;await $fetch('/api/admin/users/'+editing.value.id,{method:'PATCH',body});editing.value=null;edit.password='';await refresh();notice.value='Account updated'}catch(e){error.value=message(e)}finally{busy.value=false}}
</script>
<style scoped>.iv-overlay{position:fixed;inset:0;background:#000b;display:flex;align-items:center;justify-content:center;padding:20px;z-index:100}.iv-dialog{width:min(650px,100%);max-height:90vh;overflow:auto}</style>
