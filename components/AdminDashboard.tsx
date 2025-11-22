
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { 
    WrenchScrewdriverIcon, 
    ArrowLeftOnRectangleIcon,
    CloudArrowUpIcon,
    PlusIcon,
    TrashIcon,
    PencilSquareIcon,
    PhotoIcon,
    ArrowLeftIcon,
    CheckCircleIcon
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
    const [jsonImport, setJsonImport] = useState('');
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

    const handleImportJSON = async () => {
        try {
            const data = JSON.parse(jsonImport);
            if (Array.isArray(data)) {
                let count = 0;
                for (const l of data) {
                    if (l.id && l.content) {
                        await upsertLesson(l);
                        count++;
                    }
                }
                alert(`Imported ${count} lessons successfully.`);
                setJsonImport('');
            } else {
                alert("JSON must be an array of lessons");
            }
        } catch (e) {
            alert("Invalid JSON format. Please check syntax.");
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
                            
                            {/* BOSS EDITOR */}
                            {editingBoss && (
                                <div>
                                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-red-400">
                                        <PencilSquareIcon className="w-6 h-6" />
                                        Edit Boss Battle
                                    </h2>
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-1">Boss Name</label>
                                            <input 
                                                className="w-full bg-slate-900 border border-slate-600 p-2 rounded text-sm" 
                                                value={editingBoss.bossName} 
                                                onChange={e => setEditingBoss({...editingBoss, bossName: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-1">Boss Emoji</label>
                                            <input 
                                                className="w-full bg-slate-900 border border-slate-600 p-2 rounded text-sm text-center text-xl" 
                                                value={editingBoss.bossImage} 
                                                onChange={e => setEditingBoss({...editingBoss, bossImage: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-xs font-bold text-slate-400 mb-1">Trash Talk (Intro)</label>
                                        <input 
                                            className="w-full bg-slate-900 border border-slate-600 p-2 rounded text-sm" 
                                            value={editingBoss.bossIntro} 
                                            onChange={e => setEditingBoss({...editingBoss, bossIntro: e.target.value})}
                                        />
                                    </div>
                                    
                                    {/* Boss Questions */}
                                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-xs font-bold text-slate-400 uppercase">Battle Questions</h3>
                                            <button 
                                                onClick={() => setEditingBoss({...editingBoss, bossQuiz: [...editingBoss.bossQuiz, { question: "New Question", options: ["A", "B", "C"], correctIndex: 0, explanation: "Because." }]})}
                                                className="text-green-500 text-xs hover:underline"
                                            >+ Add Question</button>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            {editingBoss.bossQuiz.map((q, i) => (
                                                <div key={i} className="bg-slate-800 p-3 rounded border border-slate-600">
                                                    <div className="flex justify-between mb-2">
                                                        <label className="text-xs font-bold text-blue-400">Question {i+1}</label>
                                                        <button 
                                                            onClick={() => {
                                                                const newQ = [...editingBoss.bossQuiz];
                                                                newQ.splice(i, 1);
                                                                setEditingBoss({...editingBoss, bossQuiz: newQ});
                                                            }}
                                                            className="text-red-500 text-xs"
                                                        >Remove</button>
                                                    </div>
                                                    <input 
                                                        className="w-full bg-slate-900 border border-slate-600 p-2 rounded text-sm mb-3"
                                                        value={q.question}
                                                        onChange={e => {
                                                            const newQ = [...editingBoss.bossQuiz];
                                                            newQ[i].question = e.target.value;
                                                            setEditingBoss({...editingBoss, bossQuiz: newQ});
                                                        }}
                                                    />
                                                    <div className="grid grid-cols-1 gap-2 mb-3">
                                                        {q.options.map((opt, optI) => (
                                                            <div key={optI} className="flex gap-2">
                                                                <input 
                                                                    className="flex-1 bg-slate-900 border border-slate-600 p-2 rounded text-xs"
                                                                    value={opt}
                                                                    onChange={e => {
                                                                        const newQ = [...editingBoss.bossQuiz];
                                                                        newQ[i].options[optI] = e.target.value;
                                                                        setEditingBoss({...editingBoss, bossQuiz: newQ});
                                                                    }}
                                                                />
                                                                <input 
                                                                    type="radio" 
                                                                    name={`correct_${i}`}
                                                                    checked={q.correctIndex === optI}
                                                                    onChange={() => {
                                                                        const newQ = [...editingBoss.bossQuiz];
                                                                        newQ[i].correctIndex = optI;
                                                                        setEditingBoss({...editingBoss, bossQuiz: newQ});
                                                                    }}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <input 
                                                        placeholder="Explanation"
                                                        className="w-full bg-slate-900 border border-slate-600 p-2 rounded text-xs text-green-400"
                                                        value={q.explanation}
                                                        onChange={e => {
                                                            const newQ = [...editingBoss.bossQuiz];
                                                            newQ[i].explanation = e.target.value;
                                                            setEditingBoss({...editingBoss, bossQuiz: newQ});
                                                        }}
                                                    />
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

                            {/* LESSON EDITOR */}
                            {editingLesson && (
                                <div>
                                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <PencilSquareIcon className="w-6 h-6 text-blue-500" />
                                        Edit Lesson
                                    </h2>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-1">Title</label>
                                            <input 
                                                className="w-full bg-slate-900 border border-slate-600 p-2 rounded text-sm" 
                                                value={editingLesson.title} 
                                                onChange={e => setEditingLesson({...editingLesson, title: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-1">Type</label>
                                            <select 
                                                className="w-full bg-slate-900 border border-slate-600 p-2 rounded text-sm uppercase"
                                                value={editingLesson.type}
                                                onChange={e => setEditingLesson({...editingLesson, type: e.target.value as any})}
                                            >
                                                {LESSON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* DYNAMIC CONTENT FORM */}
                                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-6">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 border-b border-slate-700 pb-2">
                                            {editingLesson.type} Content
                                        </h3>

                                        {/* INFO / VIDEO */}
                                        {(editingLesson.type === 'info' || editingLesson.type === 'video') && (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs text-slate-500 mb-1">Text Body (Markdown supported)</label>
                                                    <textarea 
                                                        className="w-full h-32 bg-slate-900 border border-slate-600 p-2 rounded text-sm font-mono"
                                                        value={editingLesson.content.text || ''}
                                                        onChange={e => setEditingLesson({...editingLesson, content: {...editingLesson.content, text: e.target.value}})}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* SWIPE */}
                                        {editingLesson.type === 'swipe' && (
                                            <div className="space-y-4">
                                                {(editingLesson.content.cards || []).map((card, i) => (
                                                    <div key={i} className="p-3 bg-slate-800 rounded border border-slate-600">
                                                        <div className="flex justify-between mb-2">
                                                            <span className="text-xs font-bold">Card {i+1}</span>
                                                            <button 
                                                                onClick={() => {
                                                                    const newCards = [...(editingLesson.content.cards || [])];
                                                                    newCards.splice(i, 1);
                                                                    setEditingLesson({...editingLesson, content: {...editingLesson.content, cards: newCards}});
                                                                }}
                                                                className="text-red-500 text-xs hover:underline"
                                                            >Remove</button>
                                                        </div>
                                                        <input 
                                                            placeholder="Card Text"
                                                            className="w-full bg-slate-900 border border-slate-600 p-2 rounded text-sm mb-2"
                                                            value={card.text}
                                                            onChange={e => {
                                                                const newCards = [...(editingLesson.content.cards || [])];
                                                                newCards[i].text = e.target.value;
                                                                setEditingLesson({...editingLesson, content: {...editingLesson.content, cards: newCards}});
                                                            }}
                                                        />
                                                        <div className="flex gap-2">
                                                            <select 
                                                                className="bg-slate-900 border border-slate-600 p-1 rounded text-xs"
                                                                value={card.isRight ? 'true' : 'false'}
                                                                onChange={e => {
                                                                    const newCards = [...(editingLesson.content.cards || [])];
                                                                    newCards[i].isRight = e.target.value === 'true';
                                                                    setEditingLesson({...editingLesson, content: {...editingLesson.content, cards: newCards}});
                                                                }}
                                                            >
                                                                <option value="true">Swipe Right (Correct)</option>
                                                                <option value="false">Swipe Left (Incorrect)</option>
                                                            </select>
                                                            <input 
                                                                placeholder="Label (e.g. W or L)"
                                                                className="w-20 bg-slate-900 border border-slate-600 p-1 rounded text-xs"
                                                                value={card.label}
                                                                onChange={e => {
                                                                    const newCards = [...(editingLesson.content.cards || [])];
                                                                    newCards[i].label = e.target.value;
                                                                    setEditingLesson({...editingLesson, content: {...editingLesson.content, cards: newCards}});
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                                <button 
                                                    onClick={() => {
                                                        const newCards = [...(editingLesson.content.cards || []), { text: 'New Card', isRight: true, label: 'W' }];
                                                        setEditingLesson({...editingLesson, content: {...editingLesson.content, cards: newCards}});
                                                    }}
                                                    className="w-full py-2 border border-dashed border-slate-500 text-slate-400 text-xs font-bold hover:bg-slate-800"
                                                >
                                                    + Add Card
                                                </button>
                                            </div>
                                        )}

                                        {/* DRAG DROP */}
                                        {editingLesson.type === 'drag_drop' && (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-2">
                                                    {(editingLesson.content.buckets || ['Needs', 'Wants']).map((b, i) => (
                                                        <input 
                                                            key={i}
                                                            className="bg-slate-900 border border-slate-600 p-2 rounded text-sm text-center font-bold"
                                                            value={b}
                                                            onChange={e => {
                                                                const newBuckets = [...(editingLesson.content.buckets || [])];
                                                                newBuckets[i] = e.target.value;
                                                                setEditingLesson({...editingLesson, content: {...editingLesson.content, buckets: newBuckets}});
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                                
                                                {(editingLesson.content.items || []).map((item, i) => (
                                                    <div key={i} className="flex gap-2">
                                                        <input 
                                                            className="flex-1 bg-slate-900 border border-slate-600 p-2 rounded text-sm"
                                                            value={item.text}
                                                            onChange={e => {
                                                                const newItems = [...(editingLesson.content.items || [])];
                                                                newItems[i].text = e.target.value;
                                                                setEditingLesson({...editingLesson, content: {...editingLesson.content, items: newItems}});
                                                            }}
                                                        />
                                                        <select
                                                            className="w-32 bg-slate-900 border border-slate-600 p-2 rounded text-sm"
                                                            value={item.category}
                                                            onChange={e => {
                                                                const newItems = [...(editingLesson.content.items || [])];
                                                                newItems[i].category = e.target.value;
                                                                setEditingLesson({...editingLesson, content: {...editingLesson.content, items: newItems}});
                                                            }}
                                                        >
                                                            {(editingLesson.content.buckets || []).map(b => <option key={b} value={b}>{b}</option>)}
                                                        </select>
                                                        <button 
                                                            onClick={() => {
                                                                const newItems = [...(editingLesson.content.items || [])];
                                                                newItems.splice(i, 1);
                                                                setEditingLesson({...editingLesson, content: {...editingLesson.content, items: newItems}});
                                                            }}
                                                            className="text-red-500"
                                                        >X</button>
                                                    </div>
                                                ))}
                                                <button 
                                                    onClick={() => {
                                                        const newItems = [...(editingLesson.content.items || []), { id: Date.now().toString(), text: 'Item', category: 'Needs' }];
                                                        setEditingLesson({...editingLesson, content: {...editingLesson.content, items: newItems}});
                                                    }}
                                                    className="w-full py-2 border border-dashed border-slate-500 text-slate-400 text-xs font-bold hover:bg-slate-800"
                                                >
                                                    + Add Item
                                                </button>
                                            </div>
                                        )}
                                        
                                        {/* MEME */}
                                        {editingLesson.type === 'meme' && (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs text-slate-500 mb-1">Image URL</label>
                                                    <input 
                                                        className="w-full bg-slate-900 border border-slate-600 p-2 rounded text-sm"
                                                        value={editingLesson.content.imageUrl || ''}
                                                        onChange={e => setEditingLesson({...editingLesson, content: {...editingLesson.content, imageUrl: e.target.value}})}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input 
                                                        placeholder="Top Text"
                                                        className="bg-slate-900 border border-slate-600 p-2 rounded text-sm"
                                                        value={editingLesson.content.topText || ''}
                                                        onChange={e => setEditingLesson({...editingLesson, content: {...editingLesson.content, topText: e.target.value}})}
                                                    />
                                                    <input 
                                                        placeholder="Bottom Text"
                                                        className="bg-slate-900 border border-slate-600 p-2 rounded text-sm"
                                                        value={editingLesson.content.bottomText || ''}
                                                        onChange={e => setEditingLesson({...editingLesson, content: {...editingLesson.content, bottomText: e.target.value}})}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-500 mb-1">Truth / Explanation</label>
                                                    <textarea 
                                                        className="w-full h-20 bg-slate-900 border border-slate-600 p-2 rounded text-sm"
                                                        value={editingLesson.content.explanation || ''}
                                                        onChange={e => setEditingLesson({...editingLesson, content: {...editingLesson.content, explanation: e.target.value}})}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* TAP LIE */}
                                        {editingLesson.type === 'tap_lie' && (
                                            <div className="space-y-4">
                                                {(editingLesson.content.statements || []).map((stmt, i) => (
                                                    <div key={i} className="flex gap-2">
                                                        <input 
                                                            className="flex-1 bg-slate-900 border border-slate-600 p-2 rounded text-sm"
                                                            value={stmt.text}
                                                            onChange={e => {
                                                                const newStmts = [...(editingLesson.content.statements || [])];
                                                                newStmts[i].text = e.target.value;
                                                                setEditingLesson({...editingLesson, content: {...editingLesson.content, statements: newStmts}});
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                const newStmts = [...(editingLesson.content.statements || [])];
                                                                newStmts[i].isLie = !newStmts[i].isLie;
                                                                setEditingLesson({...editingLesson, content: {...editingLesson.content, statements: newStmts}});
                                                            }}
                                                            className={`px-3 rounded text-xs font-bold ${stmt.isLie ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}
                                                        >
                                                            {stmt.isLie ? 'LIE' : 'TRUTH'}
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                const newStmts = [...(editingLesson.content.statements || [])];
                                                                newStmts.splice(i, 1);
                                                                setEditingLesson({...editingLesson, content: {...editingLesson.content, statements: newStmts}});
                                                            }}
                                                            className="text-red-500"
                                                        >X</button>
                                                    </div>
                                                ))}
                                                <button 
                                                    onClick={() => {
                                                        const newStmts = [...(editingLesson.content.statements || []), { text: 'New Statement', isLie: false }];
                                                        setEditingLesson({...editingLesson, content: {...editingLesson.content, statements: newStmts}});
                                                    }}
                                                    className="w-full py-2 border border-dashed border-slate-500 text-slate-400 text-xs font-bold hover:bg-slate-800"
                                                >
                                                    + Add Statement
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-4">
                                        <button onClick={handleSaveLesson} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-500 shadow-lg">
                                            Save Changes
                                        </button>
                                        <button onClick={() => setEditingLesson(null)} className="px-6 py-3 border border-slate-600 text-slate-400 rounded font-bold hover:bg-slate-800">
                                            Cancel
                                        </button>
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
                         
                         {/* Phone Frame */}
                         <div className="w-[320px] h-[640px] bg-black rounded-[3rem] border-[8px] border-slate-800 relative overflow-hidden shadow-2xl ring-1 ring-white/10">
                            
                            {/* Mock Dynamic Content */}
                            {editingLesson ? (
                                <div className="h-full w-full overflow-y-auto bg-[#1a0b2e] text-white p-4 pt-12 font-body relative">
                                    
                                    {/* Header Mock */}
                                    <div className="flex justify-between items-center mb-8 opacity-50">
                                        <div className="w-24 h-2 bg-slate-700 rounded-full"></div>
                                        <div className="w-6 h-6 bg-slate-700 rounded-full"></div>
                                    </div>

                                    {/* Content Render Logic */}
                                    
                                    {editingLesson.type === 'info' && (
                                        <div className="text-center">
                                            <div className="text-xl leading-relaxed">{editingLesson.content.text}</div>
                                        </div>
                                    )}

                                    {editingLesson.type === 'swipe' && (
                                        <div className="flex flex-col items-center justify-center h-[400px]">
                                            <h3 className="mb-4 font-bold">Swipe Right if Smart</h3>
                                            <div className="w-64 h-80 bg-white rounded-3xl flex flex-col items-center justify-center p-4 text-black text-center shadow-lg border-4 border-black">
                                                <div className="font-black text-2xl mb-2">{editingLesson.content.cards?.[0]?.text || "Preview Card"}</div>
                                                <div className="text-gray-500 font-bold uppercase">{editingLesson.content.cards?.[0]?.label}</div>
                                            </div>
                                        </div>
                                    )}

                                    {editingLesson.type === 'drag_drop' && (
                                        <div className="text-center pt-4">
                                            <h3 className="font-game text-xl mb-4">Sort It!</h3>
                                            <div className="flex justify-center gap-2 mb-8">
                                                {(editingLesson.content.buckets || []).map(b => (
                                                    <div key={b} className="w-20 h-20 border-2 border-dashed border-white/30 rounded flex items-center justify-center text-[10px] uppercase font-bold">{b}</div>
                                                ))}
                                            </div>
                                            <div className="flex flex-wrap justify-center gap-2">
                                                {(editingLesson.content.items || []).map(i => (
                                                    <div key={i.id} className="px-3 py-1 bg-neon-blue text-black rounded-full text-xs font-bold">{i.text}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {editingLesson.type === 'meme' && (
                                        <div className="text-center">
                                            <div className="relative w-full aspect-square bg-black border-4 border-white rounded-xl overflow-hidden mb-4">
                                                {editingLesson.content.imageUrl && <img src={editingLesson.content.imageUrl} className="w-full h-full object-cover opacity-70" />}
                                                <div className="absolute top-2 w-full text-center font-game text-2xl text-white text-stroke-black">{editingLesson.content.topText}</div>
                                                <div className="absolute bottom-2 w-full text-center font-game text-2xl text-white text-stroke-black">{editingLesson.content.bottomText}</div>
                                            </div>
                                            <p className="text-sm text-neon-blue font-bold">"{editingLesson.content.explanation}"</p>
                                        </div>
                                    )}

                                    {editingLesson.type === 'tap_lie' && (
                                        <div className="flex flex-col gap-4 mt-8">
                                            <h3 className="text-center font-game text-2xl">Tap the Lie</h3>
                                            {(editingLesson.content.statements || []).map((s, i) => (
                                                <div key={i} className="p-4 bg-white text-black font-bold rounded-xl shadow-lg">{s.text}</div>
                                            ))}
                                        </div>
                                    )}

                                </div>
                            ) : editingBoss ? (
                                <div className="h-full w-full bg-red-900 text-white p-8 pt-20 text-center font-body">
                                    <div className="text-8xl mb-6 animate-bounce">{editingBoss.bossImage}</div>
                                    <h1 className="font-game text-4xl mb-4">{editingBoss.bossName}</h1>
                                    <div className="bg-black/40 p-4 rounded-xl border-l-4 border-red-500 italic text-xl mb-8">
                                        "{editingBoss.bossIntro}"
                                    </div>
                                    <div className="text-red-300 text-xs uppercase font-bold">
                                        {editingBoss.bossQuiz.length} Questions Loaded
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs uppercase font-bold gap-4">
                                    <WrenchScrewdriverIcon className="w-12 h-12 opacity-20" />
                                    <div>Select a lesson to edit</div>
                                </div>
                            )}

                         </div>
                    </div>
                )}

                {/* IMPORT TAB */}
                {activeTab === 'import' && (
                    <div className="flex-1 bg-slate-900 p-12 flex flex-col">
                        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                            <CloudArrowUpIcon className="w-8 h-8 text-blue-500" />
                            Bulk Content Import
                        </h2>
                        <p className="text-slate-400 mb-6">Paste your JSON array of lessons here. Existing IDs will be updated, new IDs will be created.</p>
                        
                        <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-4 mb-4 font-mono text-xs text-green-400 overflow-hidden">
                            <textarea 
                                className="w-full h-full bg-transparent outline-none resize-none"
                                value={jsonImport}
                                onChange={e => setJsonImport(e.target.value)}
                                placeholder='[
  {
    "id": "world1_l1_les0",
    "worldId": "world1",
    "levelId": "world1_l1",
    "type": "info",
    "title": "Welcome",
    "content": { "text": "Hello World" }
  }
]'
                            />
                        </div>
                        
                        <div className="flex justify-end">
                            <button onClick={handleImportJSON} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-500 shadow-lg flex items-center gap-2">
                                <CheckCircleIcon className="w-5 h-5" />
                                Import JSON
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
