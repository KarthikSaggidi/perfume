import assert from 'node:assert/strict';
import {test} from 'node:test';
import {currentBrandImage,currentStoreName} from '../lib/brand';

test('saved legacy store names adopt ALORA while merchant custom names remain editable',()=>{
 assert.equal(currentStoreName('Velora'),'ALORA');
 assert.equal(currentStoreName(' VELORA Fragrances '),'ALORA');
 assert.equal(currentStoreName('A bespoke fragrance studio'),'A bespoke fragrance studio');
});
test('legacy bundled artwork resolves to branded replacements without rewriting custom media',()=>{
 assert.equal(currentBrandImage('/images/velora-bloom.webp'),'/images/alora-bloom.webp');
 assert.equal(currentBrandImage('/api/media/00000000-0000-0000-0000-000000000001'),'/api/media/00000000-0000-0000-0000-000000000001');
 assert.equal(currentBrandImage('https://example.com/images/velora-bloom.webp'),'https://example.com/images/velora-bloom.webp');
});
