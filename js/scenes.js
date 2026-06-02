/* ============================================================
   scenes.js — Three.js HeroScene + StageScene (AR / fallback 3D)
   Pixel-art / mainline-game vibe.
   ============================================================ */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { audio } from './audio.js';

/* SimplePhysics ----------------------------------------------------- */
export class SimplePhysics{
  constructor(opts={}){
    this.gravity = opts.gravity ?? -2.4;
    this.groundY = opts.groundY ?? 0;
    this.bounds  = opts.bounds  ?? 1.8;
  }
  step(body, dt, props=[]){
    body.vy += this.gravity * dt;
    body.x += body.vx * dt;
    body.y += body.vy * dt;
    body.z += body.vz * dt;
    if(body.y <= this.groundY + body.r){
      body.y = this.groundY + body.r;
      if(body.vy < 0) body.vy = -body.vy * 0.4;
      body.vx *= 0.86; body.vz *= 0.86;
      if(Math.abs(body.vy) < 0.4) body.vy = 0;
    }
    const b = this.bounds;
    if(Math.abs(body.x) > b){ body.x = Math.sign(body.x)*b; body.vx = -body.vx*0.5; }
    if(Math.abs(body.z) > b){ body.z = Math.sign(body.z)*b; body.vz = -body.vz*0.5; }
    for(const p of props){
      const dx = body.x - p.x, dz = body.z - p.z;
      const d = Math.hypot(dx,dz);
      const minD = (p.r||0.15) + body.r;
      if(d < minD && body.y < (p.h||0.3)){
        const nx = dx/(d||1), nz = dz/(d||1);
        body.x = p.x + nx*minD; body.z = p.z + nz*minD;
        body.vx = -body.vx*0.4; body.vz = -body.vz*0.4;
      }
    }
  }
}

/* CreatureSprite --------------------------------------------------- */
export class CreatureSprite{
  constructor(scene, pokemon, opts){
    this.scene = scene;
    this.pokemon = pokemon;
    this.opts = opts;
    this.types = pokemon.types?.map(t=>t.type?.name || t) || ['normal'];
    this.height = pokemon.height ? pokemon.height/10 : 0.5;
    this.group = new THREE.Group();
    this.body = { x:0, y:0.001, z:0, vx:0, vy:0, vz:0, r:0.1 };
    this.spawnTime = performance.now();
    this.state = 'idle';
    this._build();
  }
  _build(){
    const tex = this.opts.texture;
    if(tex){
      const aspect = (tex.image?.width) ? (tex.image.width / tex.image.height) : 1;
      const targetH = THREE.MathUtils.clamp(this.height * 1.4, 0.32, 1.4);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent:true, alphaTest:0.05, depthWrite:false });
      this.sprite = new THREE.Sprite(mat);
      this.sprite.scale.set(targetH*aspect, targetH, 1);
      this.sprite.position.y = targetH*0.5;
      this.group.add(this.sprite);
      this._spriteH = targetH;
    }
    const shGeo = new THREE.CircleGeometry(0.20, 32);
    const shMat = new THREE.MeshBasicMaterial({ color:0x1B2154, transparent:true, opacity:0.42 });
    this.shadow = new THREE.Mesh(shGeo, shMat);
    this.shadow.rotation.x = -Math.PI/2;
    this.shadow.position.y = 0.003;
    this.group.add(this.shadow);
    const auraC = this._typeColor();
    const ringGeo = new THREE.RingGeometry(0.22, 0.28, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color:auraC, transparent:true, opacity:0.55, side:THREE.DoubleSide });
    this.aura = new THREE.Mesh(ringGeo, ringMat);
    this.aura.rotation.x = -Math.PI/2;
    this.aura.position.y = 0.005;
    this.group.add(this.aura);
    this.particles = this._makeParticles(auraC);
    this.group.add(this.particles);
    this.scene.add(this.group);
  }
  _typeColor(){
    const map = { fire:0xee8130, water:0x6390f0, electric:0xf7d02c, grass:0x7ac74c, ice:0x96d9d6,
      fighting:0xc22e28, poison:0xa33ea1, ground:0xe2bf65, flying:0xa98ff3, psychic:0xf95587, bug:0xa6b91a,
      rock:0xb6a136, ghost:0x735797, dragon:0x6f35fc, dark:0x705746, steel:0xb7b7ce, fairy:0xd685ad, normal:0xa8a77a };
    return map[this.types[0]] || 0x9aaedd;
  }
  _makeParticles(color){
    const N = 22, g = new THREE.BufferGeometry();
    const pos = new Float32Array(N*3);
    for(let i=0;i<N;i++){
      const a = Math.random()*Math.PI*2;
      const r = 0.25 + Math.random()*0.25;
      pos[i*3]=Math.cos(a)*r; pos[i*3+1]=Math.random()*0.5; pos[i*3+2]=Math.sin(a)*r;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos,3));
    return new THREE.Points(g, new THREE.PointsMaterial({ color, size:0.04, transparent:true, opacity:0.85, depthWrite:false, blending:THREE.AdditiveBlending }));
  }
  jump(){ this.body.vy = 1.6; this.body.vx = (Math.random()-0.5)*0.5; this.body.vz = (Math.random()-0.5)*0.5; this.state='jump'; }
  shake(){ this.state='shake'; this._shakeEnd = performance.now()+400; }
  flee(){ this.state='flee'; this.body.vy = 2.4; this.body.vx = (Math.random()-0.5)*3; this.body.vz = (Math.random()-0.5)*3; }
  setPosition(x,y,z){ this.body.x=x; this.body.y=y; this.body.z=z; this.group.position.set(x,y,z); }
  update(dt, props, physics){
    physics.step(this.body, dt, props||[]);
    const t = (performance.now() - this.spawnTime)*0.001;
    const bob = (this.state==='idle') ? Math.sin(t*3.2)*0.025 : 0;
    this.group.position.set(this.body.x, this.body.y + bob, this.body.z);
    this.shadow.position.set(0, 0.003 - this.body.y, 0);
    const shScale = Math.max(0.3, 1 - this.body.y*0.6);
    this.shadow.scale.set(shScale, shScale, 1);
    if(this.aura){
      this.aura.position.set(0, 0.005 - this.body.y, 0);
      this.aura.scale.setScalar(1 + Math.sin(t*2.5)*0.08);
      this.aura.material.opacity = 0.35 + Math.sin(t*3)*0.18;
    }
    if(this.state==='shake' && this.sprite){
      this.sprite.position.x = (Math.random()-0.5)*0.06;
      if(performance.now()>this._shakeEnd){ this.state='idle'; this.sprite.position.x=0; }
    }
    this.particles.rotation.y += dt*0.6;
  }
  removeFromScene(){ this.scene.remove(this.group); this.group.traverse(o=>{ o.geometry?.dispose?.(); o.material?.dispose?.(); }); }
}

/* HeroScene -------------------------------------------------------- */
export class HeroScene{
  constructor(canvas){
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.set(0, 1.4, 5);
    this._mouse = {x:0,y:0};
    this._build();
    this._resize();
    new ResizeObserver(()=>this._resize()).observe(canvas);
    this.renderer.setAnimationLoop((t)=>this._tick(t));
    canvas.addEventListener('mousemove', e=>{
      const r = canvas.getBoundingClientRect();
      this._mouse.x = ((e.clientX-r.left)/r.width)*2 -1;
      this._mouse.y = ((e.clientY-r.top)/r.height)*2 -1;
    });
  }
  _build(){
    this.scene.add(new THREE.AmbientLight(0xfffbf0, 0.85));
    const dl = new THREE.DirectionalLight(0xfff7d0, 0.8); dl.position.set(3,5,2); this.scene.add(dl);
    this.islands = [];
    const regs = [
      { name:'KANTO', x:-1.6, y:0.5, z:-0.4, c:0xE63946 },
      { name:'JOHTO', x:1.6,  y:0.9, z:-0.8, c:0xF2B939 },
      { name:'HOENN', x:0.0,  y:1.5, z:-1.8, c:0x2D5BD1 },
      { name:'SINNOH',x:-2.4, y:1.6, z:-2.4, c:0x735797 },
      { name:'UNOVA', x:2.5,  y:0.1, z:-1.6, c:0x6F35FC },
    ];
    regs.forEach(r=>{
      const island = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.18, 0.32, 7), new THREE.MeshLambertMaterial({ color:0xB07644 }));
      base.position.y = -0.16; island.add(base);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16), new THREE.MeshLambertMaterial({ color:0x6FB04D }));
      top.position.y = 0.05; island.add(top);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.18, 7), new THREE.MeshLambertMaterial({ color:0x7A5230 }));
      trunk.position.set(0.2, 0.18, 0); island.add(trunk);
      const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 0), new THREE.MeshLambertMaterial({ color:0x4F9E3D }));
      leaves.position.set(0.2, 0.36, 0); island.add(leaves);
      const sign = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.02), new THREE.MeshBasicMaterial({ color:r.c }));
      sign.position.set(-0.18, 0.22, 0.1); island.add(sign);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,0.2), new THREE.MeshLambertMaterial({ color:0x4A3622 }));
      pole.position.set(-0.18, 0.15, 0.1); island.add(pole);
      island.position.set(r.x, r.y, r.z);
      island.userData = r;
      this.scene.add(island);
      this.islands.push(island);
    });
    const N = 80, pg = new THREE.BufferGeometry();
    const pos = new Float32Array(N*3);
    for(let i=0;i<N;i++){
      pos[i*3]=(Math.random()-0.5)*6;
      pos[i*3+1]=Math.random()*4-0.5;
      pos[i*3+2]=(Math.random()-0.5)*4-1;
    }
    pg.setAttribute('position', new THREE.BufferAttribute(pos,3));
    this.particles = new THREE.Points(pg, new THREE.PointsMaterial({ size:0.06, color:0xFFE36B, transparent:true, opacity:0.9, blending:THREE.AdditiveBlending, depthWrite:false }));
    this.scene.add(this.particles);
    const cluster = new THREE.Group();
    for(let i=0;i<4;i++){
      const c = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.16+Math.random()*0.08, 0),
        new THREE.MeshStandardMaterial({
          color: [0xDC3545,0xF2B939,0x2D5BD1][i%3],
          emissive:[0xDC3545,0xF2B939,0x2D5BD1][i%3],
          emissiveIntensity:0.25, metalness:0.4, roughness:0.3, transparent:true, opacity:0.92
        }));
      c.position.set((Math.random()-0.5)*0.6, 0.5+Math.random()*0.2, (Math.random()-0.5)*0.3);
      cluster.add(c);
    }
    this.cluster = cluster; this.scene.add(cluster);
  }
  _resize(){
    const r = this.canvas.getBoundingClientRect();
    this.renderer.setSize(r.width, r.height, false);
    this.camera.aspect = r.width / r.height;
    this.camera.updateProjectionMatrix();
  }
  _tick(t){
    const s = t*0.001;
    this.particles.rotation.y = s*0.05;
    this.cluster.rotation.y = s*0.4;
    this.cluster.children.forEach((c,i)=>{ c.rotation.x = s*(0.3+i*0.1); c.position.y = 0.5 + Math.sin(s*1.2 + i)*0.06; });
    this.islands.forEach((isl,i)=>{
      isl.position.y = isl.userData.y + Math.sin(s*0.8 + i)*0.1;
      isl.rotation.y = s*0.2 + i;
    });
    const tx = this._mouse.x*0.4, ty = -this._mouse.y*0.3;
    this.camera.position.x += (tx - this.camera.position.x)*0.04;
    this.camera.position.y += (1.4 + ty - this.camera.position.y)*0.04;
    this.camera.lookAt(0, 0.6, -1);
    this.renderer.render(this.scene, this.camera);
  }
  dispose(){
    this.renderer.setAnimationLoop(null);
    this.renderer.dispose();
  }
}

/* StageScene — pixel-art battle scene + AR fallback ------------- */
export class StageScene{
  constructor(canvas){
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    this.renderer.xr.enabled = true;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(48, 1, 0.05, 60);
    this.camera.position.set(0, 1.0, 3.2);
    this.camera.lookAt(0, 0.4, 0);
    this.physics = new SimplePhysics({ groundY:0, bounds:2 });
    this.creature = null;
    this.props = [];
    this.showColliders = false; this.showMesh = false; this.occlusion = false;
    this.mode = 'fallback';
    this.hitTestSource = null; this.hitTestSourceRequested = false;
    this._build();
    this._resize();
    new ResizeObserver(()=>this._resize()).observe(canvas);
    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop((t,frame)=>this._tick(t,frame));
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.set(0, 0.4, 0);
    this.controls.enableDamping = true; this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 1.8; this.controls.maxDistance = 5;
    this.controls.maxPolarAngle = Math.PI*0.49; this.controls.minPolarAngle = Math.PI*0.15;
    this.controls.enablePan = false; this.controls.update();
    canvas.addEventListener('click', (e)=> this._onCanvasClick(e));
  }
  _build(){
    this.scene.add(new THREE.AmbientLight(0xfffbf0, 0.95));
    const dl = new THREE.DirectionalLight(0xfff7d0, 0.7); dl.position.set(2,5,2); this.scene.add(dl);
    this.world = new THREE.Group(); this.scene.add(this.world);
    const gridMat = new THREE.ShaderMaterial({
      uniforms:{ uTime:{value:0}, uOpacity:{value:0.0} }, transparent:true,
      vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader:`varying vec2 vUv; uniform float uTime; uniform float uOpacity;
        void main(){
          vec2 g = abs(fract(vUv*16.0)-0.5);
          float l = smoothstep(0.46,0.5, max(g.x,g.y));
          float d = distance(vUv, vec2(0.5));
          float ring = smoothstep(0.02, 0.0, abs(d - mod(uTime*0.15, 0.5)));
          float fade = smoothstep(0.7, 0.0, d);
          vec3 col = vec3(0.18, 0.36, 0.82);
          gl_FragColor = vec4(col, (l*0.55 + ring*0.4)*fade*uOpacity);
        }`
    });
    this.gridMesh = new THREE.Mesh(new THREE.PlaneGeometry(4,4), gridMat);
    this.gridMesh.rotation.x = -Math.PI/2; this.gridMesh.position.y = 0.003;
    this.world.add(this.gridMesh);

    const plat = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.85, 64),
      new THREE.MeshBasicMaterial({ color:0x8E6E45, transparent:true, opacity:0.32, side:THREE.DoubleSide })
    );
    plat.rotation.x = -Math.PI/2; plat.position.y = 0.004; this.world.add(plat);

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(10,10), new THREE.MeshBasicMaterial({ transparent:true, opacity:0 }));
    this.ground.rotation.x = -Math.PI/2; this.world.add(this.ground);

    this._buildProps();
    // reticle
    const retGeo = new THREE.RingGeometry(0.12, 0.16, 32).rotateX(-Math.PI/2);
    this.reticle = new THREE.Mesh(retGeo, new THREE.MeshBasicMaterial({ color:0xDC3545, transparent:true, opacity:0.95, side:THREE.DoubleSide }));
    this.reticle.matrixAutoUpdate = false; this.reticle.visible = false;
    this.scene.add(this.reticle);
    this.reticleInner = new THREE.Mesh(
      new THREE.RingGeometry(0.04, 0.06, 32).rotateX(-Math.PI/2),
      new THREE.MeshBasicMaterial({ color:0xF2B939, transparent:true, opacity:0.95, side:THREE.DoubleSide })
    );
    this.reticle.add(this.reticleInner);
    this.controller = this.renderer.xr.getController(0);
    this.controller.addEventListener('select', ()=>this._onARSelect());
    this.scene.add(this.controller);
  }
  _buildProps(){
    const propSpec = [
      ...Array.from({length:6}, ()=>({ type:'grass', r:0.08, h:0.18 })),
      ...Array.from({length:3}, ()=>({ type:'rock',  r:0.16, h:0.22 })),
      ...Array.from({length:2}, ()=>({ type:'bush',  r:0.18, h:0.28 })),
      { type:'sign', r:0.1, h:0.4 },
    ];
    this.propGroup = new THREE.Group(); this.world.add(this.propGroup);
    this.props = [];
    for(const p of propSpec){
      const ang = Math.random()*Math.PI*2, dist = 1.0 + Math.random()*0.7;
      const x = Math.cos(ang)*dist, z = Math.sin(ang)*dist;
      let mesh;
      if(p.type==='grass'){
        mesh = new THREE.Group();
        for(let i=0;i<4;i++){
          const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.18), new THREE.MeshBasicMaterial({ color:0x6FB04D, side:THREE.DoubleSide }));
          blade.position.y = 0.09; blade.rotation.y = i*Math.PI/2; mesh.add(blade);
        }
      } else if(p.type==='rock'){
        mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13 + Math.random()*0.06, 0), new THREE.MeshLambertMaterial({ color:0x7C8090 }));
        mesh.position.y = 0.1;
      } else if(p.type==='bush'){
        mesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), new THREE.MeshLambertMaterial({ color:0x4F9E3D }));
        mesh.position.y = 0.18;
      } else {
        mesh = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.4), new THREE.MeshLambertMaterial({ color:0x7A5230 }));
        pole.position.y = 0.2; mesh.add(pole);
        const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.25,0.16), new THREE.MeshBasicMaterial({ color:0xDC3545, side:THREE.DoubleSide }));
        plate.position.set(0,0.34,0); mesh.add(plate);
      }
      mesh.position.x = x; mesh.position.z = z;
      this.propGroup.add(mesh);
      const colViz = new THREE.Mesh(new THREE.CylinderGeometry(p.r,p.r,p.h,12), new THREE.MeshBasicMaterial({ color:0xDC3545, wireframe:true, transparent:true, opacity:0.6 }));
      colViz.position.set(x, p.h/2, z); colViz.visible = false;
      this.propGroup.add(colViz);
      this.props.push({ x, z, r:p.r, h:p.h, type:p.type, mesh, colViz });
    }
  }
  _resize(){
    const r = this.canvas.getBoundingClientRect();
    if(r.width===0||r.height===0) return;
    this.renderer.setSize(r.width, r.height, false);
    this.camera.aspect = r.width / r.height;
    this.camera.updateProjectionMatrix();
  }
  toggleColliders(){ this.showColliders = !this.showColliders; this.props.forEach(p=>p.colViz.visible = this.showColliders); return this.showColliders; }
  toggleMesh(){ this.showMesh = !this.showMesh; this.gridMesh.material.uniforms.uOpacity.value = this.showMesh? 0.7 : 0; return this.showMesh; }
  toggleOcclusion(){
    this.occlusion = !this.occlusion;
    if(this.creature?.sprite){
      this.creature.sprite.material.depthTest = this.occlusion;
      this.creature.sprite.material.needsUpdate = true;
    }
    return this.occlusion;
  }
  setCreature(pokemon, texture, opts={}){
    if(this.creature){ this.creature.removeFromScene(); this.creature = null; }
    this.creature = new CreatureSprite(this.world, pokemon, { texture, ...opts });
    this.creature.setPosition(0, 0.3, 0);
    this.creature.body.vy = 1.2;
    return this.creature;
  }
  _onCanvasClick(e){
    if(this.mode==='ar' || !this.creature) return;
    const r = this.canvas.getBoundingClientRect();
    const mx = ((e.clientX-r.left)/r.width)*2 -1;
    const my = -((e.clientY-r.top)/r.height)*2 +1;
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(mx,my), this.camera);
    const hits = ray.intersectObject(this.ground);
    if(hits.length){
      const p = hits[0].point;
      this.creature.body.vy = 1.6; this.creature.body.x = p.x; this.creature.body.z = p.z;
    }
  }
  _onARSelect(){
    if(!this.reticle.visible) return;
    if(this.creature){
      const pos = new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().fromArray(this.reticle.matrix.elements));
      this.creature.body.x = pos.x; this.creature.body.y = pos.y + 0.05; this.creature.body.z = pos.z;
      this.creature.body.vy = 1.2;
    }
  }
  async startAR(onState){
    if(!navigator.xr){ onState('unavailable'); return false; }
    try{
      const supported = await navigator.xr.isSessionSupported('immersive-ar');
      if(!supported){ onState('unavailable'); return false; }
      const sess = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures:['hit-test'],
        optionalFeatures:['dom-overlay','anchors','light-estimation'],
        domOverlay:{ root: document.body }
      });
      await this.renderer.xr.setSession(sess);
      this.mode='ar'; this.controls.enabled=false; this.reticle.visible=true;
      onState('searching');
      sess.addEventListener('end', ()=>{
        this.mode='fallback'; this.controls.enabled=true; this.reticle.visible=false;
        onState('ended'); this.hitTestSource = null; this.hitTestSourceRequested = false;
      });
      return true;
    }catch(err){
      console.warn('[xr]', err);
      onState('error');
      return false;
    }
  }
  _tick(t, frame){
    const dt = Math.min(0.05, this.clock.getDelta());
    if(this.gridMesh) this.gridMesh.material.uniforms.uTime.value = t*0.001;
    this.props.forEach(p=>{
      if(p.type==='sign') p.mesh.rotation.y += dt*0.4;
      if(p.type==='grass'){ p.mesh.rotation.y = Math.sin(t*0.001 + p.x)*0.2; }
    });
    if(this.reticleInner) this.reticleInner.rotation.z = t*0.002;
    if(this.renderer.xr.isPresenting && frame){
      const refSpace = this.renderer.xr.getReferenceSpace();
      const session  = this.renderer.xr.getSession();
      if(!this.hitTestSourceRequested){
        this.hitTestSourceRequested = true;
        session.requestReferenceSpace('viewer').then(viewerSpace=>{
          session.requestHitTestSource({ space:viewerSpace }).then(src=>{ this.hitTestSource = src; });
        });
      }
      if(this.hitTestSource){
        const hits = frame.getHitTestResults(this.hitTestSource);
        if(hits.length){
          const pose = hits[0].getPose(refSpace);
          this.reticle.visible = true;
          this.reticle.matrix.fromArray(pose.transform.matrix);
        }else{ this.reticle.visible = false; }
      }
    }
    if(this.creature){
      this.creature.update(dt, this.props, this.physics);
      if(this.creature.state==='idle' && Math.random()<0.004 && this.creature.body.y < 0.15){
        this.creature.jump();
        audio.playSfx('jump');
      }
    }
    if(this.controls) this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
  dispose(){
    try{ this.renderer.setAnimationLoop(null); }catch{}
    this.renderer.dispose();
    if(this.creature) this.creature.removeFromScene();
  }
}
