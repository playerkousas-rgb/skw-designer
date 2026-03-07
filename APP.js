import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, Palette, Image as ImageIcon, Box, Sliders,
  UploadCloud, Shuffle, Maximize2, Copy, Check,
  Info, Globe, Layers, Gift, PlusCircle, Loader2, Sparkles, Download, Wand2, X, Lock, Unlock, Users, Trash2, FileCode, FileType, Eye, EyeOff
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, collection, deleteDoc, query, getDocs } from 'firebase/firestore';




// --- Firebase 配置 ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'scout-design-app';




// --- 常量與管理員配置 ---
const ADMIN_EMAIL = 'ai@skwscout.org.hk';
const VERSION = 'V2.4.9';


// --- 巾圈深度定義 (核心概念注入) ---
const WOGGLE_CORE_DEFINITION = `You are an expert in scouting uniform accessories. A scout woggle (also called neckerchief slide or scarf slide) is a FUNCTIONAL RING-SHAPED HOLDER specifically designed to secure a triangular scout neckerchief/scarf around the neck. It is ALWAYS a cylindrical, tubular, or looped structure with a central hole/channel large enough for the rolled/folded neckerchief ends to pass through and slide/adjust. It is NOT a flat pin, badge, brooch, medal, lapel pin, clip, or any back-attached jewelry. The design must emphasize 3D ring form, depth, thickness (usually 1-2cm thick/deep), smooth inner surface for sliding, and realistic holding of a fabric scarf.`;


// --- 多語言字典 ---
const TRANSLATIONS = {
  zh: {
    title: `童設計 ${VERSION}`,
    tabs: { idea: '理念', color: '色彩', ref: '參考', craft: '工藝', tweak: '微調' },
    fields: {
      eventName: '活動名稱', textZh: '文字輸入欄(中)', textEn: '文字輸入欄(英)',
      style: '風格', concept: '設計概念', colorControl: '色彩控制',
      randomColor: '隨機色彩', refItem: '參考項目', upload: '上載檔案 (MAX 3)',
      refPlaceholder: '輸入參考描述...', craftMenu: '工藝選單',
      shapeMenu: '形狀選單', souvenirShapeMenu: '標誌形狀', souvenirType: '種類選單', custom: '自訂',
      preciseLabel: '精確指示欄目', precisePlaceholder: '請輸入具體的修改指令...',
      preciseExample: '💡 精確指示範例：', preciseTip: '「眼神更兇惡一點」、「爪更利一點」、「牙更長一點」、「字體更小一點」',
      customCraftPlaceholder: '請自行輸入特定工藝...', customShapePlaceholder: '請自行輸入特定形狀...',
      customTypePlaceholder: '請自行輸入特定種類...',
      aiExpand: 'AI 視覺聯想', aiDraw: 'AI 繪圖'
    },
    categories: { badge: '徽章', necker: '巾圈', souvenir: '紀念品', custom: '自訂' },
    buttons: {
      genDesign: '生成設計圖', genMockup: '成品模擬', tweakDesign: '設計微調',
      tweakMockup: '成品微調', viewDesign: '設計圖', viewMockup: '成品模擬',
      view3d: '3D 預覽', gen3d: '3D 製作', waiting: '等待生成視圖', processing: 'AI 正在計算中...'
    },
    prompts: { design: '設計圖prompt', mockup: 'Mockup Prompt' }
  },
  en: {
    title: `Scout Design ${VERSION}`,
    tabs: { idea: 'Idea', color: 'Color', ref: 'Ref', craft: 'Craft', tweak: 'Adjust' },
    fields: {
      eventName: 'Event Name', textZh: 'Text (ZH)', textEn: 'Text (EN)',
      style: 'Style', concept: 'Design Concept', colorControl: 'Color Control',
      randomColor: 'Randomize', refItem: 'Reference Item', upload: 'Upload (MAX 3)',
      refPlaceholder: 'Enter description...', craftMenu: 'Craft Menu',
      shapeMenu: 'Shape Menu', souvenirShapeMenu: 'Logo Shape', souvenirType: 'Type Menu', custom: 'Custom',
      preciseLabel: 'Precise Instructions', precisePlaceholder: 'Enter specific instructions...',
      preciseExample: '💡 Example:', preciseTip: '"Fiercer eyes", "Sharper claws", "Longer teeth", "Smaller font"',
      customCraftPlaceholder: 'Type custom craft...', customShapePlaceholder: 'Type custom shape...',
      customTypePlaceholder: 'Type custom type...',
      aiExpand: 'AI Visual Expansion', aiDraw: 'AI Drawing'
    },
    categories: { badge: 'Badge', necker: 'Woggle', souvenir: 'Souvenir', custom: 'Custom' },
    buttons: {
      genDesign: 'Generate Design', genMockup: 'Generate Mockup', tweakDesign: 'Tweak Design',
      tweakMockup: 'Tweak Mockup', viewDesign: 'Design', viewMockup: 'Mockup',
      view3d: '3D View', gen3d: '3D Maker', waiting: 'Waiting for Preview', processing: 'AI Processing...'
    },
    prompts: { design: 'Design Prompt', mockup: 'Mockup Prompt' }
  }
};




const SHAPE_OPTIONS = ['圓形', '盾形/徽章形', '方形/矩形', '五角形', '異形/不規則形', '自訂'];




const CATEGORY_CONFIG = {
  badge: {
    crafts: ['機繡/電腦刺繡', '織嘜/織布章', '滴膠/軟膠徽章', '金屬實色琺瑯', '印刷布章', '自訂'],
    shapes: SHAPE_OPTIONS,
    types: ['徽章']
  },
  necker: {
    crafts: ['Metal Plated (金屬鍍層)', 'Hard Enamel (硬琺瑯工藝)', 'Embossed Leather (真皮壓紋)', 'PVC Soft Touch (軟膠滴膠)', '3D Printed Resin (3D 打印樹脂)', '自訂'],
    types: [
      'Minimalist Mobius Loop (極簡莫比烏斯環)',
      'Parametric Fluid Geometry (參數化流體幾何)',
      'Bio-Organic Sculptural (仿生有機雕塑感)',
      'Tectonic Layered Relief (構造層次浮雕)',
      'Classical Cylindrical Ring (經典圓柱環)',
      'Lattice Mesh Structure (網格交織結構)',
      'Totemic Embossed totem (圖騰壓印)',
      'Mechanical Clamp-lock (機械夾式結構)',
      '自訂'
    ],
    shapes: ['Cylindrical Tube (圓柱管狀)', 'Hollow Ring (中空環形)', 'Tubular Holder (管狀固定器)', 'Möbius Loop (莫比烏斯環狀)', '自訂']
  },
  souvenir: {
    crafts: ['絲網印刷 / 移印', '雷射雕刻', '熱轉印 / 數位直噴', '滴膠 / 軟琺瑯', '燙金 / 燙銀', 'UV 印刷', '沖壓 + 電鍍', '內雕 / 噴砂', '自訂'],
    types: ['帆布袋 / 購物袋', '保溫瓶 / 水瓶', '原子筆 / 鋼珠筆', '鑰匙圈 / 匙扣', '環保吸管 / 餐具組', '筆記本 / 記事本', '手機支架 / 指環扣', '彩色胸章 / 徽章', '證件套 / 卡套', '杯墊 / 吸水墊', '隨身碟 / USB', '開瓶器 / 多功能工具', '水晶 / 玻璃擺飾', '利是封 / 揮春', '自訂'],
    shapes: SHAPE_OPTIONS
  },
  custom: {
    crafts: ['自訂'],
    shapes: ['自訂'],
    types: ['自訂']
  }
};




const API_KEY = "";




// 指數退避請求
const fetchWithRetry = async (url, options, retries = 5, backoff = 1000) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(errorBody)}`);
    }
    return await response.json();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
};




export default function App() {
  const [user, setUser] = useState(null);
  const [tier, setTier] = useState('low');
  const [activeTab, setActiveTab] = useState('path1');
  const [viewMode, setViewMode] = useState('clean');
  const [language, setLanguage] = useState('zh');
  const [selectedCategory, setSelectedCategory] = useState('badge');
  const [colorCount, setColorCount] = useState(8);
  const [colors, setColors] = useState(['#6366F1', '#3B82F6', '#2DD4BF', '#F472B6', '#E2E8F0', '#0F172A', '#F59E0B', '#EF4444', '#10B981', '#F97316', '#8B5CF6', '#EC4899', '#64748B', '#78350F', '#065F46', '#1E3A8A']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [designImage, setDesignImage] = useState(null);
  const [mockupImage, setMockupImage] = useState(null);
  const [threeDImage, setThreeDImage] = useState(null);
  const [designPrompt, setDesignPrompt] = useState('');
  const [mockupPrompt, setMockupPrompt] = useState('');
  const [useAIExpansion, setUseAIExpansion] = useState(true);
  const [allowAIDraw, setAllowAIDraw] = useState(true); // 新增生圖開關
 
  // 白名單與管理員狀態
  const [whitelist, setWhitelist] = useState([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [newWhitelistedEmail, setNewWhitelistedEmail] = useState('');




  const canvasRef = useRef(null);
  const t = TRANSLATIONS[language];




  // 強制鎖定設計區結構數據，避免報錯
  const [formData, setFormData] = useState({
    path1: { eventName: '', style: '', idea: '', textZh: '', textEn: '' },
    path3: { files: [null, null, null], fileBase64s: [null, null, null], inputs: ['', '', ''] },
    path4: { craft: '機繡/電腦刺繡', shape: '圓形', type: '徽章', customCraft: '', customShape: '', customType: '' },
    path5: { preciseInstruction: '' }
  });




  // --- Auth 邏輯 ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error("Auth error", e); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currUser) => {
      setUser(currUser);
      if (currUser && !currUser.isAnonymous && currUser.email) {
        if (currUser.email === ADMIN_EMAIL) {
          setTier('high');
        } else {
          try {
            const wlRef = doc(db, 'artifacts', appId, 'public', 'whitelist', currUser.email);
            const wlDoc = await getDoc(wlRef);
            setTier(wlDoc.exists() ? 'high' : 'low');
          } catch (e) { setTier('low'); }
        }
      } else { setTier('low'); }
    });
    return () => unsubscribe();
  }, []);




  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) {
      const q = collection(db, 'artifacts', appId, 'public', 'whitelist');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setWhitelist(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (err) => console.error("Whitelist sync error", err));
      return () => unsubscribe();
    }
  }, [user]);




  const addToWhitelist = async () => {
    if (!newWhitelistedEmail || user?.email !== ADMIN_EMAIL) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'whitelist', newWhitelistedEmail.trim().toLowerCase()), {
        addedAt: new Date().toISOString(),
        addedBy: user.email
      });
      setNewWhitelistedEmail('');
    } catch (err) { console.error("Add failed", err); }
  };




  const removeFromWhitelist = async (email) => {
    if (user?.email !== ADMIN_EMAIL) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'whitelist', email));
    } catch (err) { console.error("Remove failed", err); }
  };




  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) { console.error("Login failed", err); }
  };




  const handleLogout = () => signOut(auth);




  useEffect(() => {
    if (viewMode === '3d' && (threeDImage || mockupImage || designImage)) {
      initThreeD();
    }
  }, [viewMode, threeDImage, mockupImage, designImage]);




  const initThreeD = async () => {
    if (!window.THREE) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = renderThreeD;
      document.head.appendChild(script);
    } else {
      renderThreeD();
    }
  };




  const renderThreeD = () => {
    if (!canvasRef.current) return;
    const THREE = window.THREE;
    const width = canvasRef.current.clientWidth;
    const height = canvasRef.current.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    canvasRef.current.innerHTML = '';
    canvasRef.current.appendChild(renderer.domElement);
    const textureLoader = new THREE.TextureLoader();
    const textureSource = threeDImage || mockupImage || designImage;
    if (!textureSource) return;
    const map = textureLoader.load(textureSource);
    const geometry = new THREE.BoxGeometry(3, 3, 0.2);
    const material = [
      new THREE.MeshStandardMaterial({ color: 0x333333 }),
      new THREE.MeshStandardMaterial({ color: 0x333333 }),
      new THREE.MeshStandardMaterial({ color: 0x333333 }),
      new THREE.MeshStandardMaterial({ color: 0x333333 }),
      new THREE.MeshStandardMaterial({ map: map }),
      new THREE.MeshStandardMaterial({ color: 0x111111 }),
    ];
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(5, 5, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));
    camera.position.z = 5;
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    renderer.domElement.addEventListener('mousedown', () => { isDragging = true; });
    renderer.domElement.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaMove = { x: e.offsetX - previousMousePosition.x, y: e.offsetY - previousMousePosition.y };
      mesh.rotation.y += deltaMove.x * 0.01;
      mesh.rotation.x += deltaMove.y * 0.01;
      previousMousePosition = { x: e.offsetX, y: e.offsetY };
    });
    window.addEventListener('mouseup', () => { isDragging = false; });
    const animate = () => {
      requestAnimationFrame(animate);
      if (!isDragging) mesh.rotation.y += 0.005;
      renderer.render(scene, camera);
    };
    animate();
  };




  const handleFileUpload = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newBase64s = [...formData.path3.fileBase64s];
        newBase64s[index] = reader.result.split(',')[1];
        const newFiles = [...formData.path3.files];
        newFiles[index] = file;
        setFormData({ ...formData, path3: { ...formData.path3, files: newFiles, fileBase64s: newBase64s } });
      };
      reader.readAsDataURL(file);
    }
  };




  const removeFile = (index) => {
    const newBase64s = [...formData.path3.fileBase64s];
    newBase64s[index] = null;
    const newFiles = [...formData.path3.files];
    newFiles[index] = null;
    setFormData({ ...formData, path3: { ...formData.path3, files: newFiles, fileBase64s: newBase64s } });
  };




  const copyToClipboard = (text) => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };




  const downloadAsPNG = (dataUrl, name) => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${name}_${Date.now()}.png`;
    link.click();
  };




  const downloadAsSVG = (dataUrl, name) => {
    if (!dataUrl) return;
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><image href="${dataUrl}" width="1024" height="1024" /></svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}_${Date.now()}.svg`;
    link.click();
  };




  const downloadAsSTL = (name) => {
    const dummySTL = `solid design\nfacet normal 0 0 0\nouter loop\nvertex 0 0 0\nvertex 1 0 0\nvertex 0 1 0\nendloop\nendfacet\nendsolid design`;
    const blob = new Blob([dummySTL], { type: 'application/sla' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}_${Date.now()}.stl`;
    link.click();
  };




  const downloadAsHTMLReport = () => {
    if (!designImage) return;
    const hexColors = colors.slice(0, colorCount);
    const colorSection = hexColors.map(c => `
      <div style="display:flex; align-items:center; margin-bottom:8px;">
        <div style="width:40px; height:40px; background:${c}; border-radius:4px; margin-right:12px;"></div>
        <div>
          <b style="font-size:12px;">HEX: ${c}</b><br/>
          <span style="font-size:10px; color:#666;">RGB: ${parseInt(c.slice(1,3),16)}, ${parseInt(c.slice(3,5),16)}, ${parseInt(c.slice(5,7),16)}</span>
        </div>
      </div>`).join('');




    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Scout Design Production Report</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
          .container { max-width: 800px; margin: auto; }
          .img-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin: 20px 0; }
          img { width: 100%; border-radius: 8px; border: 1px solid #ddd; }
          .section { margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
          h1 { color: #1e293b; }
          .label { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>設計生產報告 - ${formData.path1.eventName || '未命名活動'}</h1>
          <p>生成日期: ${new Date().toLocaleString()}</p>
          <div class="img-grid">
            <div><p class="label">設計圖</p><img src="${designImage}"/></div>
            <div><p class="label">成品模擬圖</p><img src="${mockupImage || designImage}"/></div>
          </div>
          <div class="section">
            <p class="label">配色方案 (Color Swatches - Pantone Equivalent)</p>
            <div style="display:grid; grid-template-cols: repeat(4, 1fr); gap:10px;">${colorSection}</div>
          </div>
          <div class="section">
            <p class="label">設計參數與物理規格 (Specs)</p>
            <ul>
              <li><b>種類:</b> ${selectedCategory}</li>
              <li><b>生產工藝:</b> ${formData.path4.craft}</li>
              <li><b>物理結構:</b> ${formData.path4.shape}</li>
              <li><b>中文內容:</b> ${formData.path1.textZh || '無'}</li>
              <li><b>英文內容:</b> ${formData.path1.textEn || '無'}</li>
            </ul>
          </div>
          <div class="section">
            <p class="label">AI 生成提示詞 (Prompts)</p>
            <p style="font-size:10px; font-family:monospace; background:#f8fafc; padding:10px; border-radius:4px;">${designPrompt}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Report_${Date.now()}.html`;
    link.click();
  };




  const generateImageAI = async (prompt, model = "imagen-4.0-generate-001") => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${API_KEY}`;
    const payload = { instances: { prompt: prompt }, parameters: { sampleCount: 1 } };
    const result = await fetchWithRetry(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const base64 = result.predictions?.[0]?.bytesBase64Encoded;
    return base64 ? `data:image/png;base64,${base64}` : null;
  };




  const handleGenerateDesign = async () => {
    setIsProcessing(true); setViewMode('clean');
    const selectedColors = colors.slice(0, colorCount).join(', ');
    const currentShape = formData.path4.shape === '自訂' ? (formData.path4.customShape || 'Custom') : formData.path4.shape;
    const currentType = formData.path4.type === '自訂' ? (formData.path4.customType || selectedCategory) : (formData.path4.type || selectedCategory);
   
    let enrichedConcept = formData.path1.idea || "a unique design";
    if (useAIExpansion && formData.path1.idea) {
      try {
        const expandUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;
        const expansionPrompt = `Task: Unleash creative potential for ${selectedCategory} design.
        Input Idea: "${formData.path1.idea}".
        Requirement: Deconstruct this idea into 3 layers:
        1. Visual Metaphor (hidden symbols),
        2. Dynamic Composition (how elements flow),
        3. Micro-textures (materials and finishes).
        Synthesize into a rich visual description. Focus on aesthetics. Max 45 words.`;
       
        const expandRes = await fetchWithRetry(expandUrl, { method: 'POST', body: JSON.stringify({ contents: [{ parts: [{ text: expansionPrompt }] }] }) });
        enrichedConcept = expandRes.candidates?.[0]?.content?.parts?.[0]?.text || enrichedConcept;
      } catch (e) { console.error("Expansion failed", e); }
    }
   
    const seed = Math.floor(Math.random() * 1000000);
    const precise = formData.path5.preciseInstruction ? `Precise modification instructions: ${formData.path5.preciseInstruction}.` : "";
   
    const textPrompt = (formData.path1.textZh || formData.path1.textEn)
      ? `High-fidelity typography: explicitly render these characters: "${formData.path1.textZh || ''}" and "${formData.path1.textEn || ''}". Ensure Chinese characters are accurate, legible, and aesthetically integrated into the ${selectedCategory} design. Adjust font weight and style to match the overall theme.`
      : "";
   
    // 巾圈類別專屬邏輯注入
    let promptPrefix = "";
    let negativePrompt = "AVOID: cropping, cut-off edges, bleeding outside frame, color swatches, technical UI elements, watermarks.";
   
    if (selectedCategory === 'necker') {
      promptPrefix = WOGGLE_CORE_DEFINITION;
      const woggleSpecs = `Structure: ${currentShape}, cylindrical tube ring 1.5cm deep with a clear central channel/hole for fabric passage. Presentation: shown holding a rolled triangular scout neckerchief to demonstrate function. Material detail: ${formData.path4.craft}.`;
      enrichedConcept = `${woggleSpecs} Concept: ${enrichedConcept}`;
      negativePrompt += " CRITICAL: NOT a flat pin, NOT a badge, NOT a brooch, NOT a clip, MUST HAVE HOLE, MUST BE RING-SHAPED.";
    } else {
      const safetyMargin = "CRITICAL: Maintain a substantial safety margin around the object. Ensure all design elements are fully contained within the center of the canvas without touching the edges.";
      enrichedConcept = `${safetyMargin} Concept: ${enrichedConcept}`;
    }
   
    const colorAdherence = `STRICT COLOR PALETTE ADHERENCE: Assign the provided HEX colors [${selectedColors}] to specific parts of the design (main body, accents, highlights). Ensure a clean and high-contrast separation between colors. No random blending.`;
   
    let prompt = `[Seed:${seed}] ${promptPrefix} Professional 2D vector production artwork for ${selectedCategory}. Style: ${currentType}. ${textPrompt} ${colorAdherence} Pure white background. Minimalist flat design. ${precise} ${negativePrompt}`;
   
    // 先更新 Prompt 狀態，確保 UI 反饋
    setDesignPrompt(prompt);


    if (!allowAIDraw) {
      setIsProcessing(false);
      return;
    }


    try {
      const activeRefIndex = formData.path3.fileBase64s.findIndex(b => b !== null);
      if (activeRefIndex !== -1) {
        const visionUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${API_KEY}`;
        const res = await fetchWithRetry(visionUrl, { method: 'POST', body: JSON.stringify({ contents: [{ parts: [{ text: `Task: Professional design synthesis. Synthesize visual features from the reference images into a high-quality production design based on this prompt: ${prompt}. Render text precisely and ensure it blends with the design material (e.g. looking like embroidery or carving). Keep all elements centered with clear margins. Follow the color palette exactly.` }, ...formData.path3.fileBase64s.map(b => b ? { inlineData: { mimeType: "image/png", data: b } } : null).filter(Boolean)] }], generationConfig: { responseModalities: ['IMAGE'] } }) });
        const imgData = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
        if (imgData) setDesignImage(`data:image/png;base64,${imgData}`);
      } else {
        const imageUrl = await generateImageAI(prompt, "imagen-4.0-generate-001");
        if (imageUrl) setDesignImage(imageUrl);
      }
    } catch (err) { console.error(err); } finally { setIsProcessing(false); }
  };




  const handleGenerateMockup = async () => {
    if (!designImage && allowAIDraw) return;
    setIsProcessing(true); setViewMode('craft');
    const craft = formData.path4.craft === '自訂' ? formData.path4.customCraft : formData.path4.craft;
    const precise = formData.path5.preciseInstruction ? `Ensure these details: ${formData.path5.preciseInstruction}.` : "";
   
    let promptPrefix = "";
    if (selectedCategory === 'necker') {
      promptPrefix = "This is a 3D scout woggle (neckerchief slide). ";
    }


    let prompt = `${promptPrefix}Apply the provided 2D design onto a physical ${selectedCategory} using ${craft} manufacturing craft. High-end 3D product photography. Showcase realistic textures, material depth, studio lighting. DO NOT change the original 2D graphics or text layout. Ensure the entire object is visible. ${precise}`;
   
    setMockupPrompt(prompt);


    if (!allowAIDraw || !designImage) {
      setIsProcessing(false);
      return;
    }
   
    try {
      const visionUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${API_KEY}`;
      const res = await fetchWithRetry(visionUrl, {
        method: 'POST',
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/png", data: designImage.split(',')[1] } }
            ]
          }],
          generationConfig: { responseModalities: ['IMAGE'] }
        })
      });
      const imgData = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (imgData) setMockupImage(`data:image/png;base64,${imgData}`);
    } catch (err) { console.error(err); } finally { setIsProcessing(false); }
  };




  const handleGenerate3D = async () => {
    const sourceImg = mockupImage || designImage;
    if (!sourceImg) return;
    setIsProcessing(true); setViewMode('3d');
    try {
      const visionUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${API_KEY}`;
      const res = await fetchWithRetry(visionUrl, {
        method: 'POST',
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Generate a precise 3D digital sculpt rendering based on the provided image. Focus on physical depth, embossed text, and technical structure. High precision production model." },
              { inlineData: { mimeType: "image/png", data: sourceImg.split(',')[1] } }
            ]
          }],
          generationConfig: { responseModalities: ['IMAGE'] }
        })
      });
      const imgData = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (imgData) {
        setThreeDImage(`data:image/png;base64,${imgData}`);
        setTimeout(() => {
          if (viewMode === '3d') initThreeD();
        }, 300);
      }
    } catch (err) { console.error(err); } finally { setIsProcessing(false); }
  };




  const canGenMockup = !!designImage || !allowAIDraw;
  const canGen3D = !!designImage || !!mockupImage;




  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans flex flex-col relative overflow-x-hidden">
      {/* 管理員白名單面板 */}
      {showAdminPanel && user?.email === ADMIN_EMAIL && (
        <div className="fixed inset-0 z-[60] bg-slate-950/90 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2"><Users size={16}/> 白名單管理</h2>
              <button onClick={() => setShowAdminPanel(false)} className="p-1 hover:bg-slate-800 rounded-lg"><X size={20}/></button>
            </div>
            <div className="flex gap-2">
              <input type="email" placeholder="輸入用戶 Email" className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-2 text-xs" value={newWhitelistedEmail} onChange={e => setNewWhitelistedEmail(e.target.value)} />
              <button onClick={addToWhitelist} className="bg-cyan-600 px-4 py-2 rounded-xl text-xs font-black">新增</button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar pr-2">
              {whitelist.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                  <span className="text-[10px] font-mono">{item.id}</span>
                  <button onClick={() => removeFromWhitelist(item.id)} className="text-red-400 hover:bg-red-500/10 p-1 rounded"><Trash2 size={12}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}




      <header className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500 p-1.5 rounded-lg shadow-lg"><Shield size={20} /></div>
          <h1 className="text-lg font-black italic uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">{t.title}</h1>
        </div>
       
        <div className="flex items-center gap-4">
          {user?.email === ADMIN_EMAIL && (
            <button onClick={() => setShowAdminPanel(true)} className="p-2 bg-slate-800 rounded-xl border border-slate-700 text-cyan-400 hover:bg-slate-700"><Users size={16}/></button>
          )}




          <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl border border-slate-600">
            <Globe size={14} className="ml-2 text-cyan-400" />
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-transparent text-[10px] font-bold outline-none pr-2 cursor-pointer">
              <option value="zh" className="bg-slate-900 text-white">繁體中文</option>
              <option value="en" className="bg-slate-900 text-white">English</option>
            </select>
          </div>




          <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl border border-slate-600">
            {(!user || user.isAnonymous) ? (
              <button onClick={handleLogin} className="px-3 py-1 text-[10px] font-black text-slate-300">Login</button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-cyan-400 px-2">{user?.displayName || user.email?.split('@')[0]}</span>
                <button onClick={handleLogout} className="px-2 py-1 text-[10px] font-black text-red-400">Exit</button>
              </div>
            )}
          </div>




          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase border ${tier === 'high' ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
            {tier === 'high' ? <Unlock size={12}/> : <Lock size={12}/>}
            {tier === 'high' ? 'Premium' : 'Basic'}
          </div>
        </div>
      </header>




      <main className="max-w-7xl mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 w-full">
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-700 overflow-hidden flex-1 flex flex-col">
            <div className="flex bg-slate-950 p-2 gap-1 border-b border-slate-800">
              {['path1', 'path2', 'path3', 'path4', 'path5'].map((id) => (
                <button key={id} onClick={() => setActiveTab(id)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex flex-col items-center gap-1 ${activeTab === id ? 'bg-slate-800 text-cyan-300 shadow-md' : 'text-slate-400'}`}>
                  {id === 'path1' && <Info size={14}/>} {id === 'path2' && <Palette size={14}/>} {id === 'path3' && <ImageIcon size={14}/>} {id === 'path4' && <Box size={14}/>} {id === 'path5' && <Sliders size={14}/>}
                  {t.tabs[id === 'path1' ? 'idea' : id === 'path2' ? 'color' : id === 'path3' ? 'ref' : id === 'path4' ? 'craft' : 'tweak']}
                </button>
              ))}
            </div>




            <div className="p-6 h-[480px] overflow-y-auto bg-slate-900 custom-scrollbar">
              {activeTab === 'path1' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                      <div className="flex items-center gap-2">
                        <Wand2 size={14} className={useAIExpansion ? 'text-cyan-400' : 'text-slate-500'} />
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{t.fields.aiExpand}</span>
                      </div>
                      <button onClick={() => setUseAIExpansion(!useAIExpansion)} className={`w-10 h-5 rounded-full relative transition-colors ${useAIExpansion ? 'bg-cyan-600' : 'bg-slate-600'}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${useAIExpansion ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                      <div className="flex items-center gap-2">
                        {allowAIDraw ? <Eye size={14} className="text-cyan-400" /> : <EyeOff size={14} className="text-slate-500" />}
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{t.fields.aiDraw}</span>
                      </div>
                      <button onClick={() => setAllowAIDraw(!allowAIDraw)} className={`w-10 h-5 rounded-full relative transition-colors ${allowAIDraw ? 'bg-cyan-600' : 'bg-slate-600'}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${allowAIDraw ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t.fields.eventName}</label><input className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl text-xs text-white" value={formData.path1.eventName} onChange={(e) => setFormData({...formData, path1: {...formData.path1, eventName: e.target.value}})} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t.fields.textZh}</label><input className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl text-xs" value={formData.path1.textZh} onChange={(e) => setFormData({...formData, path1: {...formData.path1, textZh: e.target.value}})} /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t.fields.textEn}</label><input className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl text-xs" value={formData.path1.textEn} onChange={(e) => setFormData({...formData, path1: {...formData.path1, textEn: e.target.value}})} /></div>
                  </div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t.fields.style}</label><input className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl text-xs" value={formData.path1.style} onChange={(e) => setFormData({...formData, path1: {...formData.path1, style: e.target.value}})} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t.fields.concept}</label><textarea className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl text-xs h-24 resize-none" value={formData.path1.idea} onChange={(e) => setFormData({...formData, path1: {...formData.path1, idea: e.target.value}})} /></div>
                </div>
              )}
              {activeTab === 'path2' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col"><label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t.fields.colorControl} ({colorCount})</label><input type="range" min="1" max="16" value={colorCount} onChange={(e) => setColorCount(parseInt(e.target.value))} className="w-32 accent-cyan-400 mt-1" /></div>
                    <button onClick={() => setColors(colors.map(() => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')))} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-[10px] font-black"><Shuffle size={12}/> {t.fields.randomColor}</button>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {colors.map((color, i) => (
                      <div key={i} className={`relative aspect-square rounded-lg border-2 transition-all overflow-hidden ${i < colorCount ? 'border-cyan-400' : 'border-slate-800 opacity-20'}`}>
                        <input type="color" value={color} onChange={(e) => { const newC = [...colors]; newC[i] = e.target.value; setColors(newC); }} className="absolute inset-0 w-full h-full cursor-pointer opacity-0" />
                        <div className="w-full h-full" style={{ backgroundColor: color }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'path3' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="relative aspect-square group">
                        <div onClick={() => !formData.path3.fileBase64s[i] && document.getElementById(`fileInput-${i}`).click()} className="w-full h-full border-2 border-dashed border-slate-700 rounded-xl p-3 text-center hover:border-cyan-500 transition-colors cursor-pointer flex flex-col items-center gap-1 justify-center overflow-hidden">
                          {formData.path3.fileBase64s[i] ? (
                            <img src={`data:image/png;base64,${formData.path3.fileBase64s[i]}`} className="absolute inset-0 w-full h-full object-cover rounded-xl" alt="Ref" />
                          ) : (
                            <>
                              <UploadCloud size={18} className="text-slate-500" />
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight">項目 {i+1}</span>
                            </>
                          )}
                          <input type="file" id={`fileInput-${i}`} className="hidden" onChange={(e) => handleFileUpload(e, i)} accept="image/*" />
                        </div>
                        {formData.path3.fileBase64s[i] && (
                          <button onClick={() => removeFile(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 z-10"><X size={10} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                  {formData.path3.inputs.map((input, i) => (
                    <div key={`input-field-${i}`} className="space-y-1">
                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t.fields.refItem} {i+1}</label>
                      <input className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl text-xs" placeholder={t.fields.refPlaceholder} value={input} onChange={(e) => { const newI = [...formData.path3.inputs]; newI[i] = e.target.value; setFormData({...formData, path3: {...formData.path3, inputs: newI}})}} />
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'path4' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-700">
                    {['badge', 'necker', 'souvenir', 'custom'].map(id => (
                      <button key={id} onClick={() => setSelectedCategory(id)} className={`py-2 rounded-lg text-[10px] font-black ${selectedCategory === id ? 'bg-slate-800 text-cyan-300 shadow-sm' : 'text-slate-400'}`}>{t.categories[id]}</button>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t.fields.craftMenu}</label>
                      {formData.path4.craft === '自訂' || selectedCategory === 'custom' ? (
                        <input className="w-full p-3 bg-slate-800 border border-cyan-500 rounded-xl text-xs text-white" placeholder={t.fields.customCraftPlaceholder} value={formData.path4.customCraft} onChange={(e) => setFormData({...formData, path4: {...formData.path4, customCraft: e.target.value}})} />
                      ) : (
                        <select className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl text-xs font-bold" value={formData.path4.craft} onChange={(e) => setFormData({...formData, path4: {...formData.path4, craft: e.target.value}})}>
                          {CATEGORY_CONFIG[selectedCategory]?.crafts.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{selectedCategory === 'souvenir' ? t.fields.souvenirShapeMenu : t.fields.shapeMenu}</label>
                      {formData.path4.shape === '自訂' || selectedCategory === 'custom' ? (
                        <input className="w-full p-3 bg-slate-800 border border-cyan-500 rounded-xl text-xs text-white" placeholder={t.fields.customShapePlaceholder} value={formData.path4.customShape} onChange={(e) => setFormData({...formData, path4: {...formData.path4, customShape: e.target.value}})} />
                      ) : (
                        <select className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl text-xs font-bold" value={formData.path4.shape} onChange={(e) => setFormData({...formData, path4: {...formData.path4, shape: e.target.value}})}>
                          {CATEGORY_CONFIG[selectedCategory]?.shapes.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
                    </div>
                    {selectedCategory !== 'badge' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t.fields.souvenirType}</label>
                      {formData.path4.type === '自訂' || selectedCategory === 'custom' ? (
                        <input className="w-full p-3 bg-slate-800 border border-cyan-500 rounded-xl text-xs text-white" placeholder={t.fields.customTypePlaceholder} value={formData.path4.customType} onChange={(e) => setFormData({...formData, path4: {...formData.path4, customType: e.target.value}})} />
                      ) : (
                        <select className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl text-xs font-bold" value={formData.path4.type} onChange={(e) => setFormData({...formData, path4: {...formData.path4, type: e.target.value}})}>
                          {CATEGORY_CONFIG[selectedCategory]?.types.map(t_option => <option key={t_option} value={t_option}>{t_option}</option>)}
                        </select>
                      )}
                    </div>
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'path5' && (
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t.fields.preciseLabel}</label>
                      <textarea className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl text-xs h-32" placeholder={t.fields.precisePlaceholder} value={formData.path5.preciseInstruction} onChange={(e) => setFormData({...formData, path5: {...formData.path5, preciseInstruction: e.target.value}})} />
                   </div>
                   <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                      <p className="text-[10px] font-black text-cyan-400 mb-1">{t.fields.preciseExample}</p>
                      <p className="text-[10px] text-slate-400 italic leading-relaxed">{t.fields.preciseTip}</p>
                   </div>
                </div>
              )}
            </div>
          </div>




          <div className="grid grid-cols-2 gap-2 h-[220px]">
            <button onClick={handleGenerateDesign} disabled={isProcessing} className="bg-cyan-600 disabled:opacity-50 text-white rounded-2xl font-black text-[11px] uppercase flex items-center justify-center p-2">{isProcessing ? <Loader2 className="animate-spin" size={16} /> : (allowAIDraw ? t.buttons.genDesign : "僅生成設計 Prompt")}</button>
            <button onClick={handleGenerateMockup} disabled={isProcessing || !canGenMockup} className="bg-indigo-600 disabled:opacity-30 text-white rounded-2xl font-black text-[11px] uppercase flex items-center justify-center p-2">{isProcessing ? <Loader2 className="animate-spin" size={16} /> : (allowAIDraw ? t.buttons.genMockup : "僅生成模擬 Prompt")}</button>
            <button onClick={handleGenerateDesign} disabled={isProcessing || !designImage} className="bg-blue-600 disabled:opacity-30 text-white rounded-2xl font-black text-[11px] uppercase flex items-center justify-center p-2 gap-2"><Sparkles size={14}/> {t.buttons.tweakDesign}</button>
            <button onClick={handleGenerateMockup} disabled={isProcessing || !mockupImage} className="bg-slate-800 disabled:opacity-30 text-white rounded-2xl font-black text-[11px] uppercase border border-slate-600 flex items-center justify-center gap-2"><Maximize2 size={14}/> {t.buttons.tweakMockup}</button>
          </div>
        </div>




        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-slate-900 rounded-[2.5rem] border-[6px] border-slate-800 overflow-hidden h-[560px] flex flex-col relative shadow-2xl">
            <div className="p-6 bg-slate-950/90 backdrop-blur-sm flex flex-col gap-4 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex bg-slate-900 p-1 rounded-full border border-slate-700">
                  <button onClick={() => setViewMode('clean')} className={`px-4 py-2 rounded-full text-[10px] font-black ${viewMode === 'clean' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>{t.buttons.viewDesign}</button>
                  <button onClick={() => setViewMode('craft')} className={`px-4 py-2 rounded-full text-[10px] font-black ${viewMode === 'craft' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>{t.buttons.viewMockup}</button>
                  <button onClick={() => setViewMode('3d')} className={`px-4 py-2 rounded-full text-[10px] font-black ${viewMode === '3d' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>{t.buttons.view3d}</button>
                </div>
                <div className="flex gap-2">
                   <button onClick={handleGenerate3D} disabled={!canGen3D || isProcessing} className="px-4 py-2.5 bg-blue-600 disabled:opacity-50 text-white rounded-xl hover:bg-blue-500 border border-blue-400 text-[10px] font-black uppercase flex items-center gap-2"><Box size={14}/> {t.buttons.gen3d}</button>
                   <button onClick={() => { const img = viewMode === 'clean' ? designImage : mockupImage; if(img) window.open().document.write(`<img src="${img}" style="width:100%">`); }} className="p-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 border border-slate-600"><Maximize2 size={18} /></button>
                </div>
              </div>
             
              <div className="grid grid-cols-4 gap-2">
                {viewMode === '3d' ? (
                  <button onClick={() => downloadAsSTL('scout_design')} disabled={!threeDImage} className={`py-2.5 bg-blue-900 text-white rounded-xl text-[10px] font-black border border-blue-700 col-span-4 uppercase tracking-widest flex items-center justify-center gap-2 ${!threeDImage && 'opacity-50 cursor-not-allowed'}`}><FileType size={14}/> 下載 STL</button>
                ) : (
                  <>
                    <button onClick={() => downloadAsPNG(viewMode === 'clean' ? designImage : mockupImage, viewMode)} className="py-2.5 bg-slate-800 text-white rounded-xl text-[10px] font-black border border-slate-600 col-span-1 flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"><Download size={12}/> PNG</button>
                    <button onClick={() => downloadAsSVG(viewMode === 'clean' ? designImage : mockupImage, viewMode)} className="py-2.5 bg-slate-800 text-white rounded-xl text-[10px] font-black border border-slate-600 col-span-1 flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"><FileCode size={12}/> SVG</button>
                    {viewMode === 'craft' && (
                      <button onClick={downloadAsHTMLReport} className="py-2.5 bg-indigo-900/50 text-indigo-400 rounded-xl text-[10px] font-black border border-indigo-700/50 col-span-2 flex items-center justify-center gap-2 hover:bg-indigo-900/70 transition-colors"><FileCode size={12}/> 下載生產報告 (HTML)</button>
                    )}
                  </>
                )}
              </div>
            </div>




            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0A0F1D] overflow-hidden relative">
              {isProcessing ? (
                <div className="animate-pulse flex flex-col items-center"><Loader2 size={60} className="text-cyan-400 animate-spin mb-4" /><p className="text-cyan-400 text-[10px] font-black uppercase tracking-widest">{t.buttons.processing}</p></div>
              ) : (
                <>
                  {viewMode === 'clean' && designImage && <img src={designImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="Design" />}
                  {viewMode === 'craft' && mockupImage && <img src={mockupImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="Mockup" />}
                  {viewMode === '3d' && (
                    <div ref={canvasRef} className="w-full h-full cursor-move" title="拖拽以旋轉模型" />
                  )}
                  {((viewMode === 'clean' && !designImage) || (viewMode === 'craft' && !mockupImage) || (viewMode === '3d' && !threeDImage)) && (
                    <div className="text-center">
                      <ImageIcon size={64} className="text-slate-700 mx-auto mb-4" />
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{t.buttons.waiting}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>




          <div className="bg-slate-900 rounded-[2rem] p-4 flex flex-col gap-3 border border-slate-700 h-[220px]">
             <div className="grid grid-cols-2 gap-3 flex-1 overflow-hidden">
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 overflow-y-auto relative group custom-scrollbar">
                <button onClick={() => copyToClipboard(designPrompt)} className="absolute top-2 right-2 p-1.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={12}/></button>
                <span className="text-[9px] font-black text-cyan-400 uppercase block mb-1">{t.prompts.design}</span>
                <p className="text-[9px] text-slate-400 font-mono whitespace-pre-line leading-relaxed">{designPrompt || "Awaiting design..."}</p>
              </div>
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 overflow-y-auto relative group custom-scrollbar">
                <button onClick={() => copyToClipboard(mockupPrompt)} className="absolute top-2 right-2 p-1.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={12}/></button>
                <span className="text-[9px] font-black text-indigo-300 uppercase block mb-1">{t.prompts.mockup}</span>
                <p className="text-[9px] text-slate-400 font-mono whitespace-pre-line leading-relaxed">{mockupPrompt || "Awaiting mockup..."}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}



