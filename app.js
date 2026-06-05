import * as THREE from 'three';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// --- State Variables ---
let scene, camera, renderer, torusKnot, particleSystem;
let pointLight1, pointLight2;
const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
let scrollY = 0;
let explosionActive = false;
let explosionTime = 0;
let originalParticlePositions = [];

// Typewriter Roles Array for Soham Khot
const roles = ["Building Products"];
let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typingDelay = 50000;
let erasingDelay = 50000;
let newTextDelay = 2000;

// --- Initialize Application ---
function init() {
  initThree();
  initSceneObjects();
  initEvents();
  initAnimations();
  initContactForm();
  initNavbar();
  initTypewriter();
  initThemeToggle();
  initBackToTop();
  initProjectFilters();
  initLeetCodeCircle();
  
  // Hide preloader once resources load
  window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    preloader.classList.add('fade-out');
  });
  
  // Backup: hide preloader after 2 seconds anyway in case window load doesn't fire
  setTimeout(() => {
    const preloader = document.getElementById('preloader');
    if (!preloader.classList.contains('fade-out')) {
      preloader.classList.add('fade-out');
    }
  }, 2000);
  
  animate(0);
}

// --- Setup Three.js Canvas ---
function initThree() {
  const container = document.getElementById('webgl-container');
  
  // Scene
  scene = new THREE.Scene();
  
  // Camera
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 8;
  
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);
}

// --- Generate Custom Particle Glow Texture ---
function createCircleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  
  const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(0, 242, 254, 0.8)');
  gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.2)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 16, 16);
  return new THREE.CanvasTexture(canvas);
}

// --- Build Scene Objects ---
function initSceneObjects() {
  // 1. Lights
  const ambientLight = new THREE.AmbientLight(0x0a0a20, 1.5);
  scene.add(ambientLight);
  
  // Cyan glowing light
  pointLight1 = new THREE.PointLight(0x00f2fe, 12, 40);
  pointLight1.position.set(5, 5, 5);
  scene.add(pointLight1);
  
  // Purple glowing light
  pointLight2 = new THREE.PointLight(0xa855f7, 10, 40);
  pointLight2.position.set(-5, -5, -5);
  scene.add(pointLight2);
  
  // 2. Glass Torus Knot
  const isMobile = window.innerWidth < 768;
  const radius = isMobile ? 1.2 : 1.8;
  const tube = isMobile ? 0.35 : 0.55;
  const geom = new THREE.TorusKnotGeometry(radius, tube, 180, 20, 2, 3);
  
  // Physical Material yielding glass-like refraction
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    emissive: 0x0a1030,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 1.0,
    ior: 1.52,
    thickness: 1.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    side: THREE.DoubleSide
  });
  
  torusKnot = new THREE.Mesh(geom, glassMaterial);
  torusKnot.position.x = isMobile ? 0 : 2;
  scene.add(torusKnot);
  
  // 3. Particle Field (Swarm)
  const particleCount = isMobile ? 1500 : 3000;
  const particleGeom = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  originalParticlePositions = [];
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    const radius = 10 + Math.random() * 20;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    
    positions[i] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i + 2] = radius * Math.cos(phi);
    
    originalParticlePositions.push({
      x: positions[i],
      y: positions[i + 1],
      z: positions[i + 2],
      vx: (Math.random() - 0.5) * 0.02,
      vy: (Math.random() - 0.5) * 0.02,
      vz: (Math.random() - 0.5) * 0.02
    });
  }
  
  particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const particleMat = new THREE.PointsMaterial({
    size: 0.22,
    map: createCircleTexture(),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  particleSystem = new THREE.Points(particleGeom, particleMat);
  scene.add(particleSystem);
}

// --- Event Listeners ---
function initEvents() {
  window.addEventListener('resize', onWindowResize);
  
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  });
  
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  });
}

function onWindowResize() {
  const isMobile = window.innerWidth < 768;
  
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  if (torusKnot) {
    torusKnot.position.x = isMobile ? 0 : 2;
    const scale = isMobile ? 0.7 : 1.0;
    torusKnot.scale.set(scale, scale, scale);
  }
}

// --- GSAP Scrolling and Load Animations ---
function initAnimations() {
  // Initial page entry animations
  gsap.to('.hero-content', {
    opacity: 1,
    y: 0,
    duration: 1.2,
    ease: 'power3.out',
    delay: 0.4
  });
  
  gsap.from('.hero-avatar-container', {
    opacity: 0,
    scale: 0.8,
    duration: 1.5,
    ease: 'elastic.out(1, 0.75)',
    delay: 0.6
  });
  
  // Reveal animations for Sections on scroll
  const sections = ['#about', '#skills', '#projects', '#journey', '#leetcode', '#achievements', '#contact'];
  
  sections.forEach((sec) => {
    gsap.from(`${sec} .section-header`, {
      scrollTrigger: {
        trigger: sec,
        start: 'top 80%',
        toggleActions: 'play none none none'
      },
      opacity: 0,
      y: 30,
      duration: 0.8,
      ease: 'power2.out'
    });
  });
  
  // Reveal and Fill Skills progress bars on scroll
  gsap.to('#skills .bar-fill', {
    scrollTrigger: {
      trigger: '#skills',
      start: 'top 75%'
    },
    width: (index, target) => target.getAttribute('data-width'),
    duration: 1.6,
    stagger: 0.08,
    ease: 'power2.out'
  });
  
  // Stagger reveal project cards
  gsap.from('#projects .project-card', {
    scrollTrigger: {
      trigger: '#projects .projects-grid',
      start: 'top 80%'
    },
    opacity: 0,
    y: 40,
    stagger: 0.15,
    duration: 0.8,
    ease: 'power2.out'
  });
  
  // Stagger reveal timeline cards in Journey
  gsap.from('#journey .timeline-item', {
    scrollTrigger: {
      trigger: '#journey',
      start: 'top 75%'
    },
    opacity: 0,
    x: (index) => (index % 2 === 0 ? -40 : 40),
    stagger: 0.2,
    duration: 0.8,
    ease: 'power2.out'
  });
  
  // Numerical Stats Counter
  gsap.from('#stats-counter .stat-num', {
    scrollTrigger: {
      trigger: '#stats-counter',
      start: 'top 80%'
    },
    textContent: 0,
    duration: 2.2,
    snap: { textContent: 1 },
    stagger: 0.1,
    ease: 'power1.out'
  });
  
  // Stagger achievements lists
  gsap.from('#achievements .achievement-card-upgraded', {
    scrollTrigger: {
      trigger: '#achievements',
      start: 'top 75%'
    },
    opacity: 0,
    y: 20,
    stagger: 0.15,
    duration: 0.6,
    ease: 'power2.out'
  });
}

// --- Typewriter Effect ---
function initTypewriter() {
  const typewriter = document.getElementById('typewriter');
  if (!typewriter) return;
  
  function type() {
    const currentRole = roles[roleIndex];
    if (isDeleting) {
      typewriter.textContent = currentRole.substring(0, charIndex - 1);
      charIndex--;
      setTimeout(type, erasingDelay);
    } else {
      typewriter.textContent = currentRole.substring(0, charIndex + 1);
      charIndex++;
      setTimeout(type, typingDelay);
    }
    
    if (!isDeleting && charIndex === currentRole.length) {
      isDeleting = true;
      setTimeout(type, newTextDelay);
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      setTimeout(type, 500);
    }
  }
  
  setTimeout(type, 1000);
}

// --- Light & Dark Theme Controller ---
function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  const body = document.body;
  
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    body.classList.add('light-theme');
    toggleBtn.querySelector('i').className = 'fa-solid fa-sun';
    setTimeout(() => updateThemeLights(true), 500);
  }
  
  toggleBtn.addEventListener('click', () => {
    body.classList.toggle('light-theme');
    const isLight = body.classList.contains('light-theme');
    
    const icon = toggleBtn.querySelector('i');
    if (isLight) {
      icon.className = 'fa-solid fa-sun';
      localStorage.setItem('theme', 'light');
    } else {
      icon.className = 'fa-solid fa-moon';
      localStorage.setItem('theme', 'dark');
    }
    
    updateThemeLights(isLight);
  });
}

function updateThemeLights(isLight) {
  if (!pointLight1 || !pointLight2) return;
  
  if (isLight) {
    pointLight1.color.setHex(0x1d4ed8);
    pointLight2.color.setHex(0x7c3aed);
    pointLight1.intensity = 18;
    pointLight2.intensity = 16;
    if (torusKnot) {
      torusKnot.material.emissive.setHex(0x151025);
    }
  } else {
    pointLight1.color.setHex(0x00f2fe);
    pointLight2.color.setHex(0xa855f7);
    pointLight1.intensity = 12;
    pointLight2.intensity = 10;
    if (torusKnot) {
      torusKnot.material.emissive.setHex(0x0a1030);
    }
  }
}

// --- Back to Top Button ---
function initBackToTop() {
  const btt = document.getElementById('back-to-top');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 600) {
      btt.classList.add('show');
    } else {
      btt.classList.remove('show');
    }
  });
  
  btt.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// --- Resume Download Handler ---


// --- Project Filtering ---
function initProjectFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filterValue = btn.getAttribute('data-filter');
      
      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        
        if (filterValue === 'all' || category === filterValue) {
          gsap.killTweensOf(card);
          card.style.display = 'flex';
          gsap.to(card, {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            ease: 'power2.out',
            clearProps: 'transform'
          });
        } else {
          gsap.killTweensOf(card);
          gsap.to(card, {
            opacity: 0,
            scale: 0.85,
            duration: 0.4,
            ease: 'power2.in',
            onComplete: () => {
              card.style.display = 'none';
            }
          });
        }
      });
    });
  });
}

// --- LeetCode Circular Progress ring ---
function initLeetCodeCircle() {
  const progressCircle = document.querySelector('.circular-progress');
  if (!progressCircle) return;
  
  const tweenVal = { val: 0 };
  gsap.to(tweenVal, {
    scrollTrigger: {
      trigger: '#leetcode',
      start: 'top 75%'
    },
    val: 280, // 280 degrees matching 315/400 approx ratio
    duration: 2.0,
    ease: 'power2.out',
    onUpdate: () => {
      progressCircle.style.background = `conic-gradient(#ffa116 ${tweenVal.val}deg, rgba(255, 255, 255, 0.04) 0deg)`;
    }
  });
}

// --- Navigation Operations ---
function initNavbar() {
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');
  const links = navLinks.querySelectorAll('a');
  const sections = document.querySelectorAll('section');
  
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const icon = menuToggle.querySelector('i');
    if (navLinks.classList.contains('active')) {
      icon.className = 'fa-solid fa-xmark';
    } else {
      icon.className = 'fa-solid fa-bars-staggered';
    }
  });
  
  links.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      menuToggle.querySelector('i').className = 'fa-solid fa-bars-staggered';
    });
  });
  
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      if (window.scrollY >= sectionTop - 150) {
        current = section.getAttribute('id');
      }
    });
    
    links.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

// --- Contact Form Submission & WebGL Particle Burst ---
function initContactForm() {
  const form = document.getElementById('contact-form');
  const statusDiv = document.getElementById('form-status');
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Sending... <i class="fa-solid fa-circle-notch fa-spin"></i>';
    submitBtn.disabled = true;
    
    setTimeout(() => {
      triggerParticleExplosion();
      
      statusDiv.className = 'form-status success';
      statusDiv.innerHTML = '<i class="fa-solid fa-circle-check"></i> Thanks Soham Khot! Your message has been sent successfully.';
      statusDiv.style.display = 'flex';
      
      form.reset();
      submitBtn.innerHTML = originalBtnHTML;
      submitBtn.disabled = false;
      
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 5000);
    }, 1200);
  });
}

function triggerParticleExplosion() {
  explosionActive = true;
  explosionTime = 0;
}

// --- Animation Loop ---
function animate(timestamp) {
  requestAnimationFrame(animate);
  
  const time = timestamp * 0.001;
  
  mouse.x += (mouse.targetX - mouse.x) * 0.05;
  mouse.y += (mouse.targetY - mouse.y) * 0.05;
  
  if (torusKnot) {
    torusKnot.rotation.y = time * 0.15 + mouse.x * 0.3;
    torusKnot.rotation.x = time * 0.1 + mouse.y * 0.3;
    
    const targetCamY = -scrollY * 0.006;
    camera.position.y += (targetCamY - camera.position.y) * 0.1;
    
    torusKnot.position.y = Math.sin(time * 1.5) * 0.15;
  }
  
  if (pointLight1 && pointLight2) {
    pointLight1.position.x = Math.sin(time * 0.5) * 6;
    pointLight1.position.z = Math.cos(time * 0.5) * 6;
    
    pointLight2.position.x = -Math.sin(time * 0.4) * 6;
    pointLight2.position.y = Math.cos(time * 0.4) * 6;
  }
  
  if (particleSystem) {
    const positions = particleSystem.geometry.attributes.position.array;
    
    if (explosionActive) {
      explosionTime += 0.015;
      
      for (let i = 0; i < positions.length / 3; i++) {
        const i3 = i * 3;
        const orig = originalParticlePositions[i];
        
        const dx = orig.x;
        const dy = orig.y;
        const dz = orig.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        const nx = dx / dist;
        const ny = dy / dist;
        const nz = dz / dist;
        
        const force = Math.sin(explosionTime * Math.PI) * 12.0 * (1 / (dist * 0.1 + 0.1));
        
        positions[i3] = orig.x + nx * force + Math.sin(time + orig.x) * 0.1;
        positions[i3 + 1] = orig.y + ny * force + Math.cos(time + orig.y) * 0.1;
        positions[i3 + 2] = orig.z + nz * force;
      }
      
      if (explosionTime >= 1.0) {
        explosionActive = false;
      }
    } else {
      for (let i = 0; i < positions.length / 3; i++) {
        const i3 = i * 3;
        const orig = originalParticlePositions[i];
        
        positions[i3] = orig.x + Math.sin(time * 0.5 + orig.y * 0.1) * 0.4;
        positions[i3 + 1] = orig.y + Math.cos(time * 0.4 + orig.x * 0.1) * 0.4;
        positions[i3 + 2] = orig.z + Math.sin(time * 0.3 + orig.z * 0.1) * 0.4;
      }
    }
    
    particleSystem.rotation.y = time * 0.02 + mouse.x * 0.08;
    particleSystem.rotation.x = time * 0.01 + mouse.y * 0.08;
    
    particleSystem.geometry.attributes.position.needsUpdate = true;
  }
  
  renderer.render(scene, camera);
}

// Start app
window.addEventListener('DOMContentLoaded', init);
