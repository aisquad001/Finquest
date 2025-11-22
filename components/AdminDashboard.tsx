/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { 
    WrenchScrewdriverIcon, 
    ArrowLeftOnRectangleIcon,
    CloudArrowUpIcon,
    PlusIcon,
    TrashIcon,
    PencilSquareIcon,
    PhotoIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    BoltIcon,
    ArrowUpTrayIcon,
    DocumentTextIcon
} from '@heroicons/react/24/solid';
import { 
    WORLDS_METADATA, 
    LevelData, 
    Lesson, 
    LessonType, 
    WorldData 
} from '../services/gamification';
import { 
    fetchLevelsForWorld, 
    fetchLessonsForLevel, 
    seedGameData,
    upsertLesson,
    deleteLesson,
    updateLevelConfig 
} from '../services/db';
import { playSound } from '../services/audio';

interface AdminProps {
    onExit: () => void;
}

const LESSON_TYPES: LessonType[] = ['swipe', 'drag_drop', 'tap_lie', 'calculator', 'meme', 'info'];

export const AdminDashboard: React.FC<AdminProps> = ({ onExit }) => {
    const [activeTab, setActiveTab] = useState<'content' | 'media' | 'import'>('content');
    
    // CMS State
    const [selectedWorld, setSelectedWorld] = useState<WorldData | null>(null);
    const [levels, setLevels] = useState<LevelData[]>([]);
    const [selectedLevel, setSelectedLevel] = useState<LevelData | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    
    // Editor State
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [isSeeding, setIsSeeding] = useState(false);
    
    // Import State
    const [jsonImport, setJsonImport] = useState('');
    const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [importMsg, setImportMsg] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [editingBoss, setEditingBoss] = useState<LevelData | null>(null);

    // Load Levels when World Selected
    useEffect(() => {
        if (selectedWorld) {
            fetchLevelsForWorld(selectedWorld.id).then(setLevels);
            setSelectedLevel(null);
            setLessons([]);
            setEditingLesson(null);
            setEditingBoss(null);
        }
    }, [selectedWorld]);

    // Load Lessons when Level Selected
    useEffect(() => {
        if (selectedLevel) {
            fetchLessonsForLevel(selectedLevel.id).then(setLessons);
            setEditingLesson(null);
            setEditingBoss(null);
        }
    }, [selectedLevel]);

    const handleSeed = async () => {
        if (window.confirm("Overwrite database with procedural content? This will generate 384 unique lessons.")) {
            setIsSeeding(true);
            await seedGameData();
            setIsSeeding(false);
            alert("Content Database Seeded!");
            if (selectedWorld) {
                fetchLevelsForWorld(selectedWorld.id).then(setLevels);
            }
        }
    };

    const handleCreateLesson = () => {
        if (!selectedLevel || !selectedWorld) return;
        const newLesson: Lesson = {
            id: `${selectedLevel.id}_les_${Date.now()}`,
            worldId: selectedWorld.id,
            levelId: selectedLevel.id,
            order: lessons.length,
            type: 'info',
            title: 'New Lesson',
            xpReward: 100,
            coinReward: 50,
            content: { text: "Write your lesson content here..." }
        };
        setEditingLesson(newLesson);
    };

    const handleSaveLesson = async () => {
        if (editingLesson) {
            await upsertLesson(editingLesson);
            const updated = await fetchLessonsForLevel(selectedLevel!.id);
            setLessons(updated);
            setEditingLesson(null);
            playSound('success');
        }
    };

    const handleDeleteLesson = async (id: string) => {
        if (window.confirm("Delete this lesson?")) {
            await deleteLesson(id);
            const updated = await fetchLessonsForLevel(selectedLevel!.id);
            setLessons(updated);
        }
    };

    const handleSaveBoss = async () => {
        if (editingBoss) {
            await updateLevelConfig(editingBoss);
            // Refresh levels list
            const updatedLevels = await fetchLevelsForWorld(selectedWorld!.id);
            setLevels(updatedLevels);
            setSelectedLevel(editingBoss); // Keep selected
            setEditingBoss(null);
            playSound('success');
        }
    };

    // --- ROBUST IMPORT LOGIC ---

    const processImport = async (rawJson: string) => {
        setImportStatus('loading');
        setImportMsg('Parsing JSON...');
        try {
            // 1. Clean the input
            const cleanJson = rawJson.trim().replace(/^\uFEFF/, ''); // Remove BOM
            
            let data;
            try {
                data = JSON.parse(cleanJson);
            } catch (e: any) {
                throw new Error(`Invalid JSON Syntax: ${e.message}`);
            }

            // 2. Normalize Data Structure
            let itemsToImport = [];
            if (Array.isArray(data)) {
                itemsToImport = data;
            } else if (data.lessons && Array.isArray(data.lessons)) {
                itemsToImport = data.lessons;
            } else if (data.items && Array.isArray(data.items)) {
                itemsToImport = data.items;
            } else {
                 // Check if it's a single object that looks like a lesson
                 if (data.id && data.type) {
                    itemsToImport = [data];
                } else {
                    throw new Error("JSON must contain an array of lessons (root array or 'lessons' property).");
                }
            }

            // 3. Import Loop
            let count = 0;
            setImportMsg(`Importing ${itemsToImport.length} items...`);
            
            for (const item of itemsToImport) {
                if (item.id) {
                    // Safety check for content
                    if (!item.content) item.content = { text: "Imported Content" };
                    await upsertLesson(item);
                    count++;
                }
            }

            setImportStatus('success');
            setImportMsg(`SUCCESS: ${count} unique lessons imported — no more repeats 🔥`);
            setJsonImport(''); // Clear input
            playSound('levelup');

            // Auto-reset status
            setTimeout(() => {
                setImportStatus('idle');
                setImportMsg('');
            }, 5000);

        } catch (e: any) {
            console.error("Import Error:", e);
            setImportStatus('error');
            setImportMsg(e.message || "Unknown Import Error");
            playSound('error');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            setJsonImport(text);
        };
        reader.readAsText(file);
    };

    const handleTestImport = () => {
        const testData = [
          {"id":"test1","worldId":"world1","levelId":"world1_1","type":"info","title":"Test Lesson 1","content":{"text":"If this works, we’re golden 🚀"}},
          {"id":"test2","worldId":"world1","levelId":"world1_1","type":"swipe","title":"Test Swipe","content":{"question":"Need or Want?","leftLabel":"Need","rightLabel":"Want","correctSide":"right","text":"Test passed"}},
          {"id":"test3","worldId":"world2","levelId":"world2_1","type":"calculator","title":"Test Calc","content":{"question":"$100/month test","correctAnswer":838000,"text":"Works!"}},
          {"id":"test4","worldId":"world5","levelId":"world5_1","type":"meme","title":"Test Meme","content":{"memeCaption":"When import finally works","text":"🥳"}}
        ];
        const json = JSON.stringify(testData, null, 2);
        setJsonImport(json);
        processImport(json);
    };

    const handleFullImport = async () => {
        setImportStatus('loading');
        setImportMsg("Fetching 384 Unique Lessons...");
        try {
            const res = await fetch('https://files.catbox.moe/4p3h7k.json');
            if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
            const text = await res.text();
            processImport(text);
        } catch (e: any) {
            setImportStatus('error');
            setImportMsg(`Download Failed: ${e.message}`);
        }
    };

    // --- RENDERERS ---

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans flex">
            
            {/* SIDEBAR */}
            <div className="w-64 bg-slate-950 border-r border-slate-800 p-4 flex flex-col flex-shrink-0">
                <div className="flex items-center gap-2 mb-8 px-2">
                    <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center font-bold text-xs">GM</div>
                    <h1 className="font-bold text-lg tracking-wider">FINQUEST CMS</h1>
                </div>

                <nav className="space-y-1 flex-1">
                    {[
                        { id: 'content', label: 'Content Manager', icon: WrenchScrewdriverIcon },
                        { id: 'media', label: 'Media Library', icon: PhotoIcon },
                        { id: 'import', label: 'Bulk Import', icon: CloudArrowUpIcon },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-bold ${
                                activeTab === item.id 
                                ? 'bg-slate-800 text-white border border-slate-700' 
                                : 'text-slate-400 hover:bg-slate-900'
                            }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="pt-6 border-t border-slate-800 space-y-3">
                    <button onClick={handleSeed} disabled={isSeeding} className="w-full bg-indigo-600 hover:bg-indigo-500 py-2 rounded text-xs font-bold transition-colors">
                        {isSeeding ? 'Seeding...' : '⚡ Reset/Seed DB'}
                    </button>
                    <button onClick={onExit} className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-white text-xs">
                        <ArrowLeftOnRectangleIcon className="w-4 h-4" /> Exit Admin
                    </button>
                </div>
            </div>

            {/* MAIN AREA */}
            <div className="flex-1 flex overflow-hidden relative">
                
                {/* COLUMN 1: NAVIGATOR */}
                {activeTab === 'content' && (
                    <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col overflow-y-auto flex-shrink-0">
                        {/* World List */}
                        {!selectedWorld && (
                            <div className="p-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Select World</h3>
                                <div className="space-y-2">
                                    {WORLDS_METADATA.map(w => (
                                        <button 
                                            key={w.id}
                                            onClick={() => setSelectedWorld(w)}
                                            className={`w-full p-3 rounded bg-slate-800 border border-slate-700 flex items-center gap-3 hover:bg-slate-700 transition-colors`}
                                        >
                                            <div className={`w-8 h-8 rounded flex items-center justify-center ${w.color} text-white`}>
                                                <w.icon className="w-5 h-5" />
                                            </div>
                                            <div className="text-left flex-1">
                                                <div className="font-bold text-sm">{w.title}</div>
                                                <div className="text-[10px] text-slate-400 truncate">{w.description}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Level List */}
                        {selectedWorld && !selectedLevel && (
                            <div className="p-4">
                                <button onClick={() => setSelectedWorld(null)} className="mb-4 text-xs text-slate-400 flex items-center gap-1 hover:text-white">
                                    <ArrowLeftIcon className="w-3 h-3" /> Back to Worlds
                                </button>
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">{selectedWorld.title} Levels</h3>
                                <div className="space-y-2">
                                    {levels.map(l => (
                                        <button 
                                            key={l.id}
                                            onClick={() => setSelectedLevel(l)}
                                            className="w-full p-3 rounded bg-slate-800 border border-slate-700 text-left hover:bg-slate-700 flex justify-between items-center transition-colors"
                                        >
                                            <span className="font-bold text-sm">Level {l.levelNumber}</span>
                                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                                <span>{l.bossImage}</span>
                                                <span>{l.bossName}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Lesson List */}
                        {selectedLevel && (
                            <div className="p-4">
                                <button onClick={() => setSelectedLevel(null)} className="mb-4 text-xs text-slate-400 flex items-center gap-1 hover:text-white">
                                    <ArrowLeftIcon className="w-3 h-3" /> Back to Levels
                                </button>
                                
                                {/* Boss Config Trigger */}
                                <div 
                                    onClick={() => { setEditingLesson(null); setEditingBoss(selectedLevel); }}
                                    className={`border border-red-900/50 p-3 rounded mb-6 cursor-pointer transition-colors ${editingBoss ? 'bg-red-900/30' : 'bg-red-900/10 hover:bg-red-900/20'}`}
                                >
                                    <div className="text-xs font-bold text-red-400 uppercase mb-2 flex justify-between">
                                        Boss Battle
                                        <PencilSquareIcon className="w-3 h-3"/>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-2xl">{selectedLevel.bossImage}</div>
                                        <div className="text-sm font-bold">{selectedLevel.bossName}</div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase">Lessons</h3>
                                    <button onClick={handleCreateLesson} className="p-1 bg-green-600 rounded hover:bg-green-500 text-white"><PlusIcon className="w-4 h-4"/></button>
                                </div>
                                <div className="space-y-2">
                                    {lessons.map((l, i) => (
                                        <div 
                                            key={l.id}
                                            onClick={() => { setEditingBoss(null); setEditingLesson(l); }}
                                            className={`p-3 rounded border cursor-pointer text-sm flex justify-between items-center group transition-colors ${editingLesson?.id === l.id ? 'bg-blue-900/50 border-blue-500' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <span className="text-slate-500 font-mono">{i+1}</span>
                                                <span className="truncate font-bold">{l.title}</span>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteLesson(l.id); }} className="text-red-500 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* COLUMN 2: EDITOR FORM */}
                {activeTab === 'content' && (editingLesson || editingBoss) && (
                    <div className="flex-1 bg-slate-800 p-8 overflow-y-auto border-r border-slate-700">
                        <div className="max-w-2xl mx-auto pb-20">
                            {/* Boss & Lesson Editors (keeping existing code logic) */}
                            {editingBoss && (
                                <div>
                                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-red-400">
                                        <PencilSquareIcon className="w-6 h-6" /> Edit Boss Battle
                                    </h2>
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-1">Boss Name</label>
                                            <input className="w-full bg-slate-900 border border-slate-600 p-2 rounded text-sm" value={editingBoss.bossName} onChange={e => setEditingBoss({...editingBoss, bossName: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-1">Boss Emoji</label>
                                            <input className="w-full bg-slate-900 border border-slate-600 p-2 rounded text-sm text-center text-xl" value={editingBoss.bossImage} onChange={e => setEditingBoss({...editingBoss, bossImage: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-xs font-bold text-slate-400 mb-1">Trash Talk (Intro)</label>
                                        <input className="w-full bg-slate-900 border border-slate-600 p-2 rounded text-sm" value={editingBoss.bossIntro} onChange={e => setEditingBoss({...editingBoss, bossIntro: e.target.value})} />
                                    </div>
                                    {/* Boss Quiz Editor */}
                                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-xs font-bold text-slate-400 uppercase">Battle Questions</h3>
                                            <button onClick={() => setEditingBoss({...editingBoss, bossQuiz: [...editingBoss.bossQuiz, { question: "New Question", options: ["A", "B", "C"], correctIndex: 0, explanation: "Because." }]})} className="text-green-500 text-xs hover:underline">+ Add Question</button>
                                        </div>
                                        <div className="space-y-6">
                                            {editingBoss.bossQuiz.map((q, i) => (
                                                <div key={i} className="bg-slate-800 p-3 rounded border border-slate-600">
                                                    <div className="flex justify-between mb-2">
                                                        <label className="text-xs font-bold text-blue-400">Question {i+1}</label>
                                                        <button onClick={() => { const newQ = [...editingBoss.bossQuiz]; newQ.splice(i, 1); setEditingBoss({...editingBoss, bossQuiz: newQ}); }} className="text-red-500 text-xs">Remove</button>
                                                    </div>
                                                    <input className="w-full bg-slate-900 border border-slate-600 p-2 rounded text-sm mb-3" value={q.question} onChange={e => { const newQ = [...editingBoss.bossQuiz]; newQ[i].question = e.target.value; setEditingBoss({...editingBoss, bossQuiz: newQ}); }} />
                                                    <div className="grid grid-cols-1 gap-2 mb-3">
                                                        {q.options.map((opt, optI) => (
                                                            <div key={optI} className="flex gap-2">
                                                                <input className="flex-1 bg-slate-900 border border-slate-600 p-2 rounded text-xs" value={opt} onChange={e => { const newQ = [...editingBoss.bossQuiz]; newQ[i].options[optI] = e.target.value; setEditingBoss({...editingBoss, bossQuiz: newQ}); }} />
                                                                <input type="radio" name={`correct_${i}`} checked={q.correctIndex === optI} onChange={() => { const newQ = [...editingBoss.bossQuiz]; newQ[i].correctIndex = optI; setEditingBoss({...editingBoss, bossQuiz: newQ}); }} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <input placeholder="Explanation" className="w-full bg-slate-900 border border-slate-600 p-2 rounded text-xs text-green-400" value={q.explanation} onChange={e => { const newQ = [...editingBoss.bossQuiz]; newQ[i].explanation = e.target.value; setEditingBoss({...editingBoss, bossQuiz: newQ}); }} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={handleSaveBoss} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-500 shadow-lg">Save Boss</button>
                                        <button onClick={() => setEditingBoss(null)} className="px-6 py-3 border border-slate-600 text-slate-400 rounded font-bold hover:bg-slate-800">Cancel</button>
                                    </div>
                                </div>
                            )}
                            {editingLesson && (
                                <div>
                                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><PencilSquareIcon className="w-6 h-6 text-blue-500" /> Edit Lesson</h2>
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-1">Title</label>
                                            <input className="w-full bg-slate-900 border border-slate-600 p-2 rounded text-sm" value={editingLesson.title} onChange={e => setEditingLesson({...editingLesson, title: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-1">Type</label>
                                            <select className="w-full bg-slate-900 border border-slate-600 p-2 rounded text-sm uppercase" value={editingLesson.type} onChange={e => setEditingLesson({...editingLesson, type: e.target.value as any})}>
                                                {LESSON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-6">
                                        <textarea 
                                            className="w-full h-32 bg-slate-900 border border-slate-600 p-2 rounded text-sm font-mono"
                                            value={JSON.stringify(editingLesson.content, null, 2)}
                                            onChange={e => {
                                                try {
                                                    setEditingLesson({...editingLesson, content: JSON.parse(e.target.value)});
                                                } catch {}
                                            }}
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Edit JSON Content Directly</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={handleSaveLesson} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-500 shadow-lg">Save Changes</button>
                                        <button onClick={() => setEditingLesson(null)} className="px-6 py-3 border border-slate-600 text-slate-400 rounded font-bold hover:bg-slate-800">Cancel</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* COLUMN 3: LIVE PREVIEW */}
                {activeTab === 'content' && (
                    <div className="w-96 bg-[#0f172a] border-l border-slate-800 flex flex-col items-center justify-center p-4 relative flex-shrink-0 hidden xl:flex">
                         <div className="absolute top-4 left-0 w-full text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Live Mobile Preview</div>
                         <div className="w-[320px] h-[640px] bg-black rounded-[3rem] border-[8px] border-slate-800 relative overflow-hidden shadow-2xl ring-1 ring-white/10">
                            <div className="h-full w-full flex items-center justify-center text-slate-500 text-sm">Preview Active</div>
                         </div>
                    </div>
                )}

                {/* IMPORT TAB (UPDATED) */}
                {activeTab === 'import' && (
                    <div className="flex-1 bg-slate-900 p-8 flex flex-col relative">
                        
                        {/* HEADER ACTIONS */}
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-white">
                                    <CloudArrowUpIcon className="w-8 h-8 text-blue-500" />
                                    Bulk Content Import
                                </h2>
                                <p className="text-slate-400 text-sm">Paste valid JSON below OR upload a file.</p>
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={handleTestImport}
                                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded font-bold text-xs flex items-center gap-2 border border-slate-600"
                                >
                                    <BoltIcon className="w-4 h-4 text-yellow-400" />
                                    Test Import (4 Items)
                                </button>
                                <button 
                                    onClick={handleFullImport}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded font-bold text-xs flex items-center gap-2 shadow-lg"
                                >
                                    <CloudArrowUpIcon className="w-4 h-4" />
                                    Import FULL 384 Lessons
                                </button>
                            </div>
                        </div>

                        {/* STATUS BANNER */}
                        {importStatus !== 'idle' && (
                            <div className={`mb-4 p-4 rounded-lg border flex items-center gap-3 font-bold shadow-lg animate-pop-in ${
                                importStatus === 'success' ? 'bg-green-900/30 border-green-500 text-green-400' :
                                importStatus === 'error' ? 'bg-red-900/30 border-red-500 text-red-400' :
                                'bg-blue-900/30 border-blue-500 text-blue-400'
                            }`}>
                                {importStatus === 'loading' && <ArrowUpTrayIcon className="w-5 h-5 animate-bounce" />}
                                {importStatus === 'success' && <CheckCircleIcon className="w-5 h-5" />}
                                {importStatus === 'error' && <TrashIcon className="w-5 h-5" />}
                                <span>{importMsg}</span>
                            </div>
                        )}
                        
                        {/* EDITOR AREA */}
                        <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-4 mb-4 font-mono text-xs text-green-400 overflow-hidden relative group">
                            <textarea 
                                className="w-full h-full bg-transparent outline-none resize-none"
                                value={jsonImport}
                                onChange={e => setJsonImport(e.target.value)}
                                placeholder='[ Paste your JSON here... ]'
                            />
                            {/* Upload Overlay */}
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept=".json"
                                    className="hidden"
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded shadow-lg border border-slate-600 font-bold flex items-center gap-2"
                                >
                                    <DocumentTextIcon className="w-4 h-4" />
                                    Upload .JSON File
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex justify-end">
                            <button 
                                onClick={() => processImport(jsonImport)} 
                                disabled={!jsonImport || importStatus === 'loading'}
                                className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-500 shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <CheckCircleIcon className="w-5 h-5" />
                                Process Import
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};