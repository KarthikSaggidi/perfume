'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { Pause, Play } from 'lucide-react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import Bottle from './Bottle';

function bottleGeometry(width: number, height: number, depth: number, radius: number) {
  const x = -width / 2, y = -height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 5, steps: 1, bevelSize: .055, bevelThickness: .055, curveSegments: 12 });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

export default function HeroBottle({ name, color, active }: { name: string; color: string; active: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [fallback, setFallback] = useState(false);
  const playback = useRef({ active, paused, reduced: Boolean(reduced) });
  useEffect(() => { playback.current = { active, paused, reduced: Boolean(reduced) }; }, [active, paused, reduced]);

  useEffect(() => {
    const element = host.current;
    if (!element || !active) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); }
    catch { setFallback(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.transmissionResolutionScale = .65;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .85;
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
    camera.position.set(0, .6, 6.65);
    camera.lookAt(0, .34, 0);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, .04);
    scene.environment = environment.texture;
    room.dispose();
    const bottle = new THREE.Group();
    bottle.rotation.set(.04, -.3, -.07);
    scene.add(bottle);
    const glass = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(color).lerp(new THREE.Color('#d9edf8'), .72), attenuationColor: new THREE.Color(color), attenuationDistance: 2.4, metalness: 0, roughness: .035, transmission: 1, thickness: .32, ior: 1.48, clearcoat: 1, clearcoatRoughness: .03, envMapIntensity: 1.1 });
    const body = new THREE.Mesh(bottleGeometry(1.35, 1.8, .66, .14), glass);
    bottle.add(body);
    const liquid = new THREE.Mesh(bottleGeometry(1.17, 1.35, .49, .1), new THREE.MeshPhysicalMaterial({ color: new THREE.Color(color), metalness: .04, roughness: .13, clearcoat: 1, clearcoatRoughness: .07 }));
    liquid.position.y = -.15;
    bottle.add(liquid);
    const foot = new THREE.Mesh(bottleGeometry(1.24, .09, .56, .035), new THREE.MeshPhysicalMaterial({ color: '#f6ead8', metalness: .08, roughness: .08, transmission: .6, thickness: .2, ior: 1.48, clearcoat: 1 }));
    foot.position.y = -.85; bottle.add(foot);
    const gold = new THREE.MeshStandardMaterial({ color: '#d6b77b', metalness: 1, roughness: .2 });
    const dark = new THREE.MeshStandardMaterial({ color: '#292422', metalness: .55, roughness: .23 });
    const part = (radius: number, height: number, y: number, material: THREE.Material) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 64), material);
      mesh.position.y = y; bottle.add(mesh); return mesh;
    };
    part(.24, .14, 1.02, gold);
    part(.185, .19, 1.17, gold);
    part(.17, .18, 1.34, gold);
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(.038, .038, .018, 20), dark);
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(0, 1.34, .175);
    bottle.add(nozzle);
    // The dip tube remains visible through the real transmissive glass.
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 1.65, 12), new THREE.MeshPhysicalMaterial({ color: '#f3e4c9', transparent: true, opacity: .45, roughness: .2 }));
    tube.position.y = -.05; bottle.add(tube);
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 900;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 768, 900);
    ctx.strokeStyle = '#e9cd92'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(365,100); ctx.lineTo(384,64); ctx.lineTo(403,100); ctx.closePath(); ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillStyle = '#e8c98e';
    ctx.font = '74px Georgia'; ctx.fillText('AURÉALIS', 384, 185);
    ctx.font = '19px Arial'; ctx.fillText('L ’ A R T   D U   P A R F U M', 384, 245);
    ctx.fillStyle = '#a88b60'; ctx.fillRect(325, 340, 118, 2);
    ctx.fillStyle = '#e8c98e'; ctx.font = '76px Georgia';
    (({ 'Noir Legacy':'NOIR', 'Amber Command':'EMBER', 'Verde Essence':'VERDE', 'Titan':'TITAN', 'Velvet Bloom':'VELVET BLOOM' } as Record<string,string>)[name]||name.toUpperCase()).split(' ').forEach((word, i) => ctx.fillText(word, 384, 460 + i * 60));
    ctx.font = '19px Arial'; ctx.fillText('E A U   D E   P A R F U M', 384, 730);
    ctx.font = '17px Arial'; ctx.fillText('50 ML  /  1.7 FL.OZ.', 384, 790);
    const labelTexture = new THREE.CanvasTexture(canvas); labelTexture.colorSpace = THREE.SRGBColorSpace;
    labelTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const label = new THREE.Mesh(new THREE.PlaneGeometry(.94, 1.12), new THREE.MeshBasicMaterial({ map: labelTexture, toneMapped: false, transparent: true, depthWrite: false }));
    label.position.set(0, -.03, .39); bottle.add(label);
    const rear = new THREE.Mesh(new THREE.PlaneGeometry(.3, .2), new THREE.MeshStandardMaterial({ color: '#b99a66', roughness: .7 }));
    rear.position.set(0, -.12, -.39); rear.rotation.y = Math.PI; bottle.add(rear);
    // The diamond-cut cap stays seated throughout the uninterrupted product turn.
    const gripCanvas=document.createElement('canvas');gripCanvas.width=gripCanvas.height=256;
    const grip=gripCanvas.getContext('2d')!;grip.fillStyle='#666';grip.fillRect(0,0,256,256);
    grip.strokeStyle='#ddd';grip.lineWidth=2;
    for(let i=-256;i<512;i+=12){grip.beginPath();grip.moveTo(i,0);grip.lineTo(i+256,256);grip.stroke();grip.beginPath();grip.moveTo(i,0);grip.lineTo(i-256,256);grip.stroke()}
    const gripTexture=new THREE.CanvasTexture(gripCanvas);gripTexture.wrapS=gripTexture.wrapT=THREE.RepeatWrapping;gripTexture.repeat.set(3,1);
    const capMaterial=new THREE.MeshStandardMaterial({color:name==='Amber Command'?'#b6965b':'#2b3032',metalness:.9,roughness:.35,bumpMap:gripTexture,bumpScale:.065});
    const cap=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.48,64),capMaterial);cap.position.set(0,1.28,0);bottle.add(cap);
    const capTop=new THREE.Mesh(new THREE.CylinderGeometry(.315,.315,.018,64),dark);capTop.position.set(0,1.527,0);bottle.add(capTop);
    scene.add(new THREE.HemisphereLight('#fff2e4', '#8f6c50', .7));
    const key = new THREE.DirectionalLight('#fff3df', 1.7); key.position.set(-3, 4, 5); scene.add(key);
    const rim = new THREE.DirectionalLight('#fff9f2', 2); rim.position.set(3, 2, -3); scene.add(rim);
    // Very small, irregular beads catch the light without obscuring the label.
    const droplets = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshPhysicalMaterial({color:'#a8bec6',roughness:.08,metalness:0,transmission:.8,thickness:.01,ior:1.33,clearcoat:1}),24);
    const dropletMatrix=new THREE.Object3D();
    const sample=(i:number)=>{const n=Math.sin(i*12.9898+78.233)*43758.5453;return n-Math.floor(n)};
    for(let i=0;i<24;i++){
      const x=(i%2===0?1:-1)*(.49+sample(i+1)*.12);
      const y=-.7+sample(i+71)*1.4;
      const radius=.002+sample(i+131)*.003;
      dropletMatrix.position.set(x,y,.391);dropletMatrix.scale.set(radius,radius*1.2,radius*.5);dropletMatrix.updateMatrix();droplets.setMatrixAt(i,dropletMatrix.matrix);
    }
    bottle.add(droplets);
    const fill=new THREE.DirectionalLight('#b9d9f0',1.15);fill.position.set(-4,1,2);scene.add(fill);
    let frame = 0, last = 0, time = 0, needsRender = true;
    let visible = true;
    const resize = new ResizeObserver(() => { const w = element.clientWidth, h = element.clientHeight; if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); needsRender = true; });
    resize.observe(element);
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; needsRender = true; }); observer.observe(element);
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now - last < 1000 / 30) return;
      const dt = Math.min((now - last) / 1000, .08); last = now;
      const state = playback.current;
      if (!state.active || !visible || document.hidden) return;
      const moving = !state.paused && !state.reduced;
      if (moving) {
        time += dt;
        bottle.rotation.y = -.3 + time * Math.PI * 2 / 60;
        // No floating parts, lift animation, or spray: a grounded, continuous turn.
        bottle.position.y = 0;
      }
      if (!moving && !needsRender) return;
      renderer.render(scene, camera);
      needsRender = false;
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame); resize.disconnect(); observer.disconnect();
      scene.traverse(object => { if (object instanceof THREE.Mesh || object instanceof THREE.Points) { object.geometry.dispose(); const mats = Array.isArray(object.material) ? object.material : [object.material]; mats.forEach(material => material.dispose()); } });
      labelTexture.dispose(); gripTexture.dispose(); environment.dispose(); pmrem.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, [name, color, active]);

  return <div className="hero-product-stage">
    <div className="studio-halo" />
    <div className="webgl-bottle" ref={host} role="img" aria-label={`Three-dimensional ${name} perfume bottle, slowly rotating with a closed textured cap`} />
    {fallback && <div className="webgl-fallback"><Bottle name={name.toUpperCase()} color={color} /><small>3D preview requires WebGL</small></div>}
    <div className="studio-pedestal" />
    <div className="hero-product-caption"><span>EXTRAIT OF A MOMENT</span><strong>{name}</strong></div>
    {!reduced && !fallback && <div className="bottle-controls"><button onClick={() => setPaused(p => !p)} aria-label={paused ? 'Resume bottle rotation' : 'Pause bottle rotation'}>{paused ? <Play size={13} /> : <Pause size={13} />}{paused ? 'Resume' : 'Pause'}</button><span className="bottle-turn-speed">360° / 60 SEC</span></div>}
  </div>;
}
