'use client';
import { useState } from 'react';
import { API_BASE } from '../../lib/api';
import { getToken } from '../../lib/auth';


export default function Uploads(){
const [file, setFile] = useState<File | null>(null);
async function upload(e: React.FormEvent){
e.preventDefault();
if(!file) return alert('choose file');
const fd = new FormData();
fd.append('file', file);
const token = getToken();
const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: fd, headers: token ? { Authorization: `Bearer ${token}` } : undefined });
if(!res.ok) throw new Error('upload failed');
alert('Uploaded');
}
return (
<div>
<h1>Upload</h1>
<form onSubmit={upload} className="flex flex-col gap-2">
<input type="file" onChange={e=>setFile(e.target.files?.[0]||null)} />
<button className="btn">Upload profile pic</button>
</form>
</div>
);
}
