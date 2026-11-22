'use client';
import { useState } from 'react';
import { apiFetch } from '../../lib/api';


export default function BlockPage(){
const [id, setId] = useState('');
async function block(){ await apiFetch(`/block/${id}`, { method: 'POST' }); alert('Blocked'); }
async function unblock(){ await apiFetch(`/block/${id}/unblock`, { method: 'POST' }); alert('Unblocked'); }
return (
<div>
<h1>Block / Unblock</h1>
<input value={id} onChange={e=>setId(e.target.value)} className="p-2 border" placeholder="User ID" />
<div className="flex gap-2 mt-2">
<button onClick={block} className="btn">Block</button>
<button onClick={unblock} className="px-3 py-1 rounded border">Unblock</button>
</div>
</div>
);
}
