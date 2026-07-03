import React, { useState, useEffect, useRef } from 'react';
import { Upload, Plus, Code2, Eye, EyeOff, Save, Trash2, Globe, FileCode } from 'lucide-react';

const PRESET_PROJECTS = [
  {
    id: 'preset-1',
    name: 'Neon Particle Matrix',
    code: `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      background: #06060c;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      color: #00f2fe;
      font-family: sans-serif;
    }
    canvas {
      position: absolute;
      top: 0;
      left: 0;
    }
    .info {
      z-index: 10;
      pointer-events: none;
      text-align: center;
      text-shadow: 0 0 10px #00f2fe;
    }
  </style>
</head>
<body>
  <div class="info">
    <h1>Particle Space</h1>
    <p>Move your mouse around the canvas</p>
  </div>
  <canvas id="canvas"></canvas>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const particles = [];
    const mouse = { x: null, y: null };

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > width) this.speedX *= -1;
        if (this.y < 0 || this.y > height) this.speedY *= -1;

        if (mouse.x && mouse.y) {
          let dx = mouse.x - this.x;
          let dy = mouse.y - this.y;
          let dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 100) {
            this.x -= dx * 0.03;
            this.y -= dy * 0.03;
          }
        }
      }
      draw() {
        ctx.fillStyle = '#00f2fe';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f2fe';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < 80; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(animate);
    }
    animate();
  </script>
</body>
</html>`
  },
  {
    id: 'preset-2',
    name: 'Cyber Clock Widget',
    code: `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      background: radial-gradient(circle at center, #1b1b2f, #0f0c1b);
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: 'Courier New', monospace;
      color: #ff007f;
      overflow: hidden;
    }
    .clock-container {
      text-align: center;
      border: 2px solid #ff007f;
      padding: 40px 60px;
      border-radius: 20px;
      background: rgba(15, 12, 27, 0.6);
      box-shadow: 0 0 20px rgba(255, 0, 127, 0.4), inset 0 0 20px rgba(255, 0, 127, 0.2);
    }
    h2 {
      font-size: 3.5rem;
      margin: 0 0 10px 0;
      text-shadow: 0 0 15px #ff007f;
      letter-spacing: 2px;
    }
    p {
      color: #00f2fe;
      text-shadow: 0 0 10px #00f2fe;
      margin: 0;
      font-size: 1.2rem;
      letter-spacing: 4px;
    }
  </style>
</head>
<body>
  <div class="clock-container">
    <h2 id="time">00:00:00</h2>
    <p id="date">LOADING DATE</p>
  </div>
  <script>
    function updateClock() {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
      document.getElementById('time').innerText = timeStr;
      document.getElementById('date').innerText = dateStr.toUpperCase();
    }
    setInterval(updateClock, 1000);
    updateClock();
  </script>
</body>
</html>`
  }
];

function DevSpace({ onBack }) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('preset-1');
  const [projectName, setProjectName] = useState('Neon Particle Matrix');
  const [code, setCode] = useState(PRESET_PROJECTS[0].code);
  const [previewUrl, setPreviewUrl] = useState('');
  const [viewMode, setViewMode] = useState('split'); // split, code, preview
  const [fileError, setFileError] = useState('');
  
  const fileInputRef = useRef(null);

  // Load custom projects from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('neonportal_dev_projects');
    if (stored) {
      setProjects(JSON.parse(stored));
    }
  }, []);

  // Update Sandbox Preview URL on code change
  useEffect(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [code]);

  const handleProjectSelect = (project) => {
    setSelectedProjectId(project.id);
    setProjectName(project.name);
    setCode(project.code);
  };

  const handleNewProject = () => {
    const id = 'custom-' + Date.now();
    const newProj = {
      id,
      name: 'Untitled Project',
      code: `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background: #111;
      color: #fff;
      font-family: sans-serif;
      text-align: center;
      padding-top: 100px;
    }
  </style>
</head>
<body>
  <h1>My Awesome Webpage</h1>
  <p>Edit this text or click Save to save it to your local gallery.</p>
</body>
</html>`
    };
    setSelectedProjectId(id);
    setProjectName(newProj.name);
    setCode(newProj.code);
  };

  const handleSaveProject = () => {
    // If it's a preset, copy to a custom project first
    let targetId = selectedProjectId;
    if (selectedProjectId.startsWith('preset-')) {
      targetId = 'custom-' + Date.now();
      setSelectedProjectId(targetId);
    }

    const updatedProjects = [...projects];
    const existingIndex = updatedProjects.findIndex(p => p.id === targetId);

    const projectData = {
      id: targetId,
      name: projectName.trim() || 'Untitled Project',
      code: code
    };

    if (existingIndex > -1) {
      updatedProjects[existingIndex] = projectData;
    } else {
      updatedProjects.push(projectData);
    }

    setProjects(updatedProjects);
    localStorage.setItem('neonportal_dev_projects', JSON.stringify(updatedProjects));
  };

  const handleDeleteProject = (id, e) => {
    e.stopPropagation();
    const filtered = projects.filter(p => p.id !== id);
    setProjects(filtered);
    localStorage.setItem('neonportal_dev_projects', JSON.stringify(filtered));

    // If active was deleted, reset to first preset
    if (selectedProjectId === id) {
      handleProjectSelect(PRESET_PROJECTS[0]);
    }
  };

  const handleFileUpload = (e) => {
    setFileError('');
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      setFileError('Only HTML files (.html, .htm) are supported.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const contents = event.target.result;
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      const newId = 'custom-' + Date.now();
      
      setSelectedProjectId(newId);
      setProjectName(cleanName);
      setCode(contents);
    };
    reader.onerror = () => {
      setFileError('Error reading file. Please try again.');
    };
    reader.readAsText(file);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.viewTitle}>Developer Space</h2>
          <p style={styles.viewDesc}>Create or upload your web creations. Host and preview them locally in our sandbox environment.</p>
        </div>
        <div style={styles.actionButtons}>
          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} /> Upload HTML
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            accept=".html,.htm"
          />
          <button className="btn btn-primary" onClick={handleNewProject}>
            <Plus size={16} /> New File
          </button>
        </div>
      </div>

      {fileError && (
        <div style={styles.errorAlert}>
          <ShieldAlert size={18} />
          <span>{fileError}</span>
        </div>
      )}

      <div style={styles.editorLayout}>
        {/* Left column: Files / Gallery list */}
        <div className="glass-panel" style={styles.galleryPanel}>
          <h3 style={styles.panelTitle}>Project Gallery</h3>
          
          <div style={styles.projectList}>
            <div style={styles.listSectionTitle}>PRESETS</div>
            {PRESET_PROJECTS.map((preset) => (
              <div 
                key={preset.id}
                style={{
                  ...styles.projectItem,
                  borderColor: selectedProjectId === preset.id ? 'var(--accent-purple)' : 'transparent',
                  background: selectedProjectId === preset.id ? 'rgba(138, 43, 226, 0.08)' : 'transparent'
                }}
                onClick={() => handleProjectSelect(preset)}
              >
                <div style={styles.projectItemInfo}>
                  <Globe size={16} color="var(--accent-cyan)" />
                  <span style={styles.projectName}>{preset.name}</span>
                </div>
              </div>
            ))}

            <div style={{ ...styles.listSectionTitle, marginTop: '20px' }}>MY UPLOADS</div>
            {projects.length === 0 ? (
              <div style={styles.emptyGallery}>No custom uploads yet. Upload an HTML file or write a new one to save.</div>
            ) : (
              projects.map((proj) => (
                <div 
                  key={proj.id}
                  style={{
                    ...styles.projectItem,
                    borderColor: selectedProjectId === proj.id ? 'var(--accent-purple)' : 'transparent',
                    background: selectedProjectId === proj.id ? 'rgba(138, 43, 226, 0.08)' : 'transparent'
                  }}
                  onClick={() => handleProjectSelect(proj)}
                >
                  <div style={styles.projectItemInfo}>
                    <FileCode size={16} color="var(--accent-purple)" />
                    <span style={styles.projectName}>{proj.name}</span>
                  </div>
                  <button 
                    style={styles.deleteBtn}
                    onClick={(e) => handleDeleteProject(proj.id, e)}
                  >
                    <Trash2 size={14} color="var(--accent-pink)" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: Editor & Sandbox */}
        <div className="glass-panel" style={styles.workspacePanel}>
          {/* Editor Header controls */}
          <div style={styles.workspaceHeader}>
            <input 
              type="text" 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project Name"
              style={styles.nameInput}
            />

            <div style={styles.controlRow}>
              {/* View selectors */}
              <div style={styles.viewSelector}>
                <button 
                  style={{
                    ...styles.viewBtn,
                    backgroundColor: viewMode === 'split' ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: viewMode === 'split' ? 'var(--accent-cyan)' : 'var(--text-secondary)'
                  }}
                  onClick={() => setViewMode('split')}
                >
                  Split View
                </button>
                <button 
                  style={{
                    ...styles.viewBtn,
                    backgroundColor: viewMode === 'code' ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: viewMode === 'code' ? 'var(--accent-cyan)' : 'var(--text-secondary)'
                  }}
                  onClick={() => setViewMode('code')}
                >
                  <Code2 size={14} /> Code Only
                </button>
                <button 
                  style={{
                    ...styles.viewBtn,
                    backgroundColor: viewMode === 'preview' ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: viewMode === 'preview' ? 'var(--accent-cyan)' : 'var(--text-secondary)'
                  }}
                  onClick={() => setViewMode('preview')}
                >
                  <Eye size={14} /> Preview
                </button>
              </div>

              <button className="btn btn-primary" style={styles.saveBtn} onClick={handleSaveProject}>
                <Save size={16} /> Save File
              </button>
            </div>
          </div>

          {/* Editor Core */}
          <div style={styles.editorArea}>
            {(viewMode === 'split' || viewMode === 'code') && (
              <div style={styles.codeColumn}>
                <textarea
                  className="input-field"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={styles.codeTextarea}
                  spellCheck="false"
                />
              </div>
            )}
            
            {(viewMode === 'split' || viewMode === 'preview') && (
              <div style={styles.previewColumn}>
                {previewUrl ? (
                  <iframe
                    title="Dev Sandbox"
                    src={previewUrl}
                    style={styles.iframeSandbox}
                    sandbox="allow-scripts"
                  />
                ) : (
                  <div style={styles.emptyPreview}>Loading Sandbox Preview...</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    animation: 'fadeIn 0.5s ease-out',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '30px',
  },
  viewTitle: {
    fontSize: '2.2rem',
    fontWeight: '800',
    letterSpacing: '-1px',
    marginBottom: '8px',
  },
  viewDesc: {
    color: 'var(--text-secondary)',
    fontSize: '1rem',
  },
  actionButtons: {
    display: 'flex',
    gap: '12px',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(255, 0, 128, 0.1)',
    border: '1px solid var(--accent-pink)',
    padding: '12px 16px',
    borderRadius: '10px',
    color: 'var(--accent-pink)',
    marginBottom: '20px',
    fontSize: '0.9rem',
  },
  editorLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 3fr',
    gap: '24px',
    alignItems: 'stretch',
    minHeight: '520px',
  },
  galleryPanel: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxHeight: '600px',
    overflowY: 'auto',
  },
  panelTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    letterSpacing: '-0.5px',
  },
  projectList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  listSectionTitle: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: 'var(--text-muted)',
    letterSpacing: '1px',
    paddingLeft: '4px',
    marginBottom: '4px',
  },
  projectItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'var(--transition-smooth)',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.02)'
    }
  },
  projectItemInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
    overflow: 'hidden',
  },
  projectName: {
    fontSize: '0.85rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'var(--transition-smooth)',
    '&:hover': {
      backgroundColor: 'rgba(255, 0, 128, 0.1)'
    }
  },
  emptyGallery: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    lineHeight: '1.5',
    padding: '10px 4px',
  },
  workspacePanel: {
    display: 'flex',
    flexDirection: 'column',
    height: '600px',
    overflow: 'hidden',
  },
  workspaceHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-glass)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  nameInput: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '1.2rem',
    fontWeight: '700',
    outline: 'none',
    borderBottom: '1px solid transparent',
    transition: 'var(--transition-smooth)',
    width: '200px',
    '&:focus': {
      borderBottomColor: 'var(--accent-purple)'
    }
  },
  controlRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  viewSelector: {
    display: 'flex',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    padding: '2px',
  },
  viewBtn: {
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '600',
    transition: 'var(--transition-smooth)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  saveBtn: {
    padding: '8px 16px',
    fontSize: '0.85rem',
  },
  editorArea: {
    flex: 1,
    display: 'flex',
    height: 'calc(100% - 70px)',
  },
  codeColumn: {
    flex: 1,
    height: '100%',
    borderRight: '1px solid var(--border-glass)',
  },
  codeTextarea: {
    width: '100%',
    height: '100%',
    background: 'hsl(240, 20%, 8%)',
    border: 'none',
    borderRadius: 0,
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '0.85rem',
    lineHeight: '1.5',
    padding: '20px',
    resize: 'none',
    outline: 'none',
    color: 'var(--text-secondary)',
    overflowY: 'auto',
  },
  previewColumn: {
    flex: 1,
    height: '100%',
    background: '#fff',
  },
  iframeSandbox: {
    width: '100%',
    height: '100%',
    border: 'none',
    background: '#fff',
  },
  emptyPreview: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    background: 'hsl(240, 20%, 8%)',
  }
};

export default DevSpace;
