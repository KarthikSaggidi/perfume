import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../lib/server/store';
import {adminRecords,assertAdminResourceAccess} from '../lib/server/admin-records';

test('printed/exported product records honor the table search fields and include all matching pages',()=>{
 const state=initialState(),base=state.products[0];
 state.products=Array.from({length:24},(_,index)=>({...base,id:'print-'+index,sku:'PRINT-'+index,name:'Print fragrance '+index,description:'Private extra description',status:index%2?'draft' as const:'active' as const}));
 assert.equal(adminRecords(state,'products',new URLSearchParams()).length,24);
 assert.equal(adminRecords(state,'products',new URLSearchParams('status=draft')).length,12);
 assert.equal(adminRecords(state,'products',new URLSearchParams('q=private')).length,0,'Description text does not expand the UI name/SKU/family search');
 assert.equal(adminRecords(state,'products',new URLSearchParams('q=Print+fragrance+23')).length,1);
 assert.equal(adminRecords(state,'products',new URLSearchParams('id=print-23'))[0].id,'print-23');
});
test('print resource permissions and staff projections omit credential material',()=>{
 for(const resource of ['orders','customers','leads','activity'])assert.doesNotThrow(()=>assertAdminResourceAccess(resource,'support'));
 for(const resource of ['products','inventory','posters','settings','team'])assert.throws(()=>assertAdminResourceAccess(resource,'support'));
 assert.throws(()=>assertAdminResourceAccess('team','manager'));assert.throws(()=>assertAdminResourceAccess('__proto__','owner'));
 const state=initialState(),now=new Date().toISOString();state.admins=[{id:'print-owner',name:'Print Owner',email:'owner@example.test',role:'owner',passwordHash:'must-not-be-printed',active:true,createdAt:now,updatedAt:now}];
 const rows=adminRecords(state,'team',new URLSearchParams());assert.equal('passwordHash' in rows[0],false);assert.equal(JSON.stringify(rows).includes('must-not-be-printed'),false);
});
