
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useMemo } from 'react';
import { 
    WrenchScrewdriverIcon, 
    ArrowLeftOnRectangleIcon,
    UsersIcon,
    ChartBarIcon,
    CurrencyDollarIcon,
    MegaphoneIcon,
    ShoppingBagIcon,
    FireIcon,
    GlobeAltIcon,
    BoltIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    TrashIcon,
    PlusIcon,
    CloudArrowUpIcon,
    CloudArrowDownIcon
} from '@heroicons/react/24/solid';
import { 
    WORLDS_METADATA, 
    ShopItem, 
    UserState,
    SHOP_ITEMS,
    Lesson,
    Stock,
    LessonType
} from '../services/gamification';
import { 
    subscribeToAllUsers,
    adminUpdateUser,
    adminMassUpdate,
    subscribeToCollection,
    saveDoc,
    deleteDocument,
    batchWrite
} from '../services/db';
import { db } from '../services/firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { playSound } from '../services/audio';
import { sendMockNotification } from '../services/notifications';
import { useUserStore } from '../services/useUserStore';
import { ASSET_LIST } from '../services/stockMarket';

// --- TYPES & INTERFACES ---

interface AdminProps {
    onExit: () => void;
}

type ViewType = 'dashboard' | 'users' | 'analytics' | 'cms' | 'shop' | 'monetization' | 'push' | 'god' | 'zoo';

// --- REAL-TIME DATA HOOK ---
const useAdminData = () => {
    const [users, setUsers] = useState<UserState[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = subscribeToAllUsers((realUsers) => {
            setUsers(realUsers);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    return { users, loading };
};

// --- SUB-COMPONENTS ---

// 1. DASHBOARD HOME (Stats)
const DashboardHome = ({ users }: { users: UserState[] }) => {
    // Stats calculation logic (same as before)
    const stats = useMemo(() => {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const dau = users.filter(u => new Date(u.lastLoginAt || 0) > yesterday).length;
        const revenue = users.reduce((acc, u) => acc + (u.lifetimeSpend || (u.subscriptionStatus === 'pro' ? 4.99 : 0)), 0);
        const paying = users.filter(u => u.subscriptionStatus === 'pro' || (u.lifetimeSpend || 0) > 0).length;
        const conversion = users.length > 0 ? ((paying / users.length) * 100).toFixed(1) : "0.0";
        const retained = users.filter(u => {
            const created = new Date(u.createdAt || 0);
            const lastLogin = new Date(u.lastLoginAt || 0);
            const ageHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
            return ageHours > 24 && lastLogin > yesterday;
        }).length;
        const cohort = users.filter(u => {
            const created = new Date(u.createdAt || 0);
            const ageHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
            return ageHours > 24 && ageHours < 48;
        }).length;
        const retentionRate = cohort > 0 ? Math.round((retained / cohort) * 100) : 100; 

        return { dau, revenue, conversion, retentionRate };
    }, [users]);

    return (
        <div className="p-8 space-y-8 animate-pop-in">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-game text-white">Command Center</h2>
                <div className="flex items-center gap-2 text-neon-green animate-pulse">
                    <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                    <span className="text-xs font-mono">LIVE DATA STREAM</span>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Daily Active Users', val: stats.dau.toLocaleString(), color: 'bg-blue-600', icon: UsersIcon, sub: 'Active < 24h' },
                    { label: 'Total Revenue', val: `$${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: 'bg-green-600', icon: CurrencyDollarIcon, sub: 'Lifetime Gross' },
                    { label: 'Conversion Rate', val: `${stats.conversion}%`, color: 'bg-purple-600', icon: BoltIcon, sub: 'Free to Paid' },
                    { label: 'Retention (D1)', val: `${stats.retentionRate}%`, color: 'bg-orange-600', icon: FireIcon, sub: 'Returning Users' },
                ].map((s, i) => (
                    <div key={i} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 p-3 rounded-bl-2xl ${s.color} opacity-20 group-hover:opacity-40 transition-opacity`}>
                            <s.icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{s.label}</div>
                        <div className="text-3xl font-black text-white mb-1">{s.val}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{s.sub}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 2. USER MANAGEMENT (Searchable, Sortable)
const UserManagement = ({ users }: { users: UserState[] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredUsers = users.filter(u => 
        u.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.uid?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAction = async (uid: string, action: string) => {
        if (action === 'ban') {
            if(confirm('Ban this user?')) await adminUpdateUser(uid, { role: 'user', loginType: 'guest', coins: 0 }); 
        }
        if (action === 'gift') {
            await adminUpdateUser(uid, { coins: (users.find(u=>u.uid===uid)?.coins || 0) + 1000 });
            playSound('coin');
        }
        if (action === 'promote') {
            await adminUpdateUser(uid, { subscriptionStatus: 'pro' });
            playSound('levelup');
        }
    };

    return (
        <div className="p-8 h-full flex flex-col animate-pop-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-game text-white">User Database ({users.length})</h2>
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search real users..." 
                        className="bg-slate-800 border border-slate-600 p-3 pl-10 rounded-xl w-96 text-white outline-none focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden flex flex-col">
                <div className="grid grid-cols-6 bg-slate-900 p-4 font-bold text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                    <div className="col-span-2">User / ID</div>
                    <div>Status</div>
                    <div>Wealth</div>
                    <div>Last Active</div>
                    <div className="text-right">Actions</div>
                </div>
                <div className="overflow-y-auto flex-1 p-2">
                    {filteredUsers.map(user => (
                        <div key={user.uid} className="grid grid-cols-6 p-4 items-center hover:bg-slate-700/50 rounded-xl transition-colors border-b border-slate-700/50 last:border-0">
                            <div className="col-span-2 flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-xl">
                                    {user.avatar?.emoji || '👤'}
                                </div>
                                <div className="overflow-hidden">
                                    <div className="font-bold text-white truncate">{user.nickname}</div>
                                    <div className="text-xs text-slate-400 truncate">{user.email || 'No Email'}</div>
                                    <div className="text-[9px] font-mono text-slate-600 truncate">{user.uid}</div>
                                </div>
                            </div>
                            <div>
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${user.subscriptionStatus === 'pro' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                    {user.subscriptionStatus || 'Free'}
                                </span>
                                {user.isAdmin && <span className="ml-2 bg-red-500/20 text-red-400 text-[10px] px-2 py-1 rounded-full">ADMIN</span>}
                            </div>
                            <div className="text-sm font-mono">
                                <div className="text-yellow-400 font-bold">{user.coins?.toLocaleString()} 🪙</div>
                                <div className="text-xs text-slate-500">Lvl {user.level}</div>
                            </div>
                            <div className="text-sm text-slate-400">
                                {new Date(user.lastLoginAt || 0).toLocaleTimeString()}
                                <div className="text-[10px]">{new Date(user.lastLoginAt || 0).toLocaleDateString()}</div>
                            </div>
                            <div className="text-right flex justify-end gap-2">
                                <button onClick={() => handleAction(user.uid!, 'gift')} className="p-2 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20" title="+1000 Coins"><CurrencyDollarIcon className="w-4 h-4" /></button>
                                <button onClick={() => handleAction(user.uid!, 'promote')} className="p-2 bg-yellow-500/10 text-yellow-400 rounded hover:bg-yellow-500/20" title="Make Pro"><BoltIcon className="w-4 h-4" /></button>
                                <button onClick={() => handleAction(user.uid!, 'ban')} className="p-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20" title="Reset/Ban"><ArrowLeftOnRectangleIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// 3. CONTENT CMS (Fully Editable)
const ContentCMS = () => {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Lesson>>({});
    const [isUploading, setIsUploading] = useState(false);

    // Helper for form fields
    const InputField = ({ label, value, onChange, type = "text", placeholder = "", disabled = false }: any) => (
        <div className="mb-3">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{label}</label>
            <input 
                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:border-blue-500 outline-none disabled:opacity-50"
                type={type}
                value={value || ''}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
            />
        </div>
    );

    // Listen to live content
    useEffect(() => {
        // Subscribe to 'lessons' collection
        const unsub = subscribeToCollection('lessons', (data) => {
            // Sort lessons by WorldId then Order for clean display
            const sorted = (data as Lesson[]).sort((a, b) => {
                if (a.worldId !== b.worldId) return a.worldId.localeCompare(b.worldId);
                return (a.order || 0) - (b.order || 0);
            });
            setLessons(sorted);
        });
        return () => unsub();
    }, []);

    const handleEdit = (lesson: Lesson) => {
        setEditingId(lesson.id);
        setEditForm(JSON.parse(JSON.stringify(lesson))); // Deep copy
    };

    const handleSave = async () => {
        if (!editingId || !editForm.id || !editForm.title) {
            alert("Missing required fields (ID, Title)");
            return;
        }
        await saveDoc('lessons', editForm.id, editForm);
        setEditingId(null);
        playSound('success');
    };

    const handleDelete = async (id: string) => {
        if (confirm("Delete this lesson?")) {
            await deleteDocument('lessons', id);
            playSound('error');
        }
    };

    const handleSeedDB = async () => {
        if (!confirm("This will DELETE all current lessons and load 384 default ones. Continue?")) return;
        setIsUploading(true);

        try {
            const lessonsRef = collection(db, "lessons");
            
            // 1. DELETE EXISTING (Chunked to avoid batch limits)
            const snapshot = await getDocs(lessonsRef);
            console.log(`Found ${snapshot.size} existing lessons to delete.`);
            
            const deleteBatches = [];
            let currentDeleteBatch = writeBatch(db);
            let deleteCount = 0;

            snapshot.docs.forEach((doc) => {
                currentDeleteBatch.delete(doc.ref);
                deleteCount++;
                if (deleteCount % 400 === 0) {
                    deleteBatches.push(currentDeleteBatch.commit());
                    currentDeleteBatch = writeBatch(db);
                }
            });
            if (deleteCount % 400 !== 0) {
                deleteBatches.push(currentDeleteBatch.commit());
            }
            await Promise.all(deleteBatches);
            console.log("Deletion complete.");

            // 2. FETCH NEW DATA
            const response = await fetch("https://files.catbox.moe/4p3h7k.json");
            if (!response.ok) throw new Error("Failed to fetch JSON file");
            const defaultLessons = await response.json();
            console.log(`Fetched ${defaultLessons.length} lessons.`);

            // 3. WRITE NEW DATA (Chunked)
            const writeBatches = [];
            let currentWriteBatch = writeBatch(db);
            let writeCount = 0;

            defaultLessons.forEach((lesson: any) => {
                const docRef = doc(db, "lessons", lesson.id);
                currentWriteBatch.set(docRef, lesson);
                writeCount++;
                if (writeCount % 400 === 0) {
                    writeBatches.push(currentWriteBatch.commit());
                    currentWriteBatch = writeBatch(db);
                }
            });
            if (writeCount % 400 !== 0) {
                writeBatches.push(currentWriteBatch.commit());
            }
            await Promise.all(writeBatches);

            alert(`SUCCESS: ${defaultLessons.length} lessons seeded! Refresh the page.`);
            playSound('levelup');
            
        } catch (error: any) {
            console.error("Seed DB Error:", error);
            alert("Error seeding DB: " + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const text = await file.text();
            const json = JSON.parse(text);
            if (Array.isArray(json)) {
                await batchWrite('lessons', json);
                alert(`Success! Uploaded ${json.length} records.`);
                playSound('levelup');
            }
        } catch (err) {
            alert("Invalid JSON file.");
        }
        setIsUploading(false);
    };

    // Dynamic Content Fields Renderer
    const renderContentFields = () => {
        const type = editForm.type || 'info';
        const content = editForm.content || {};

        const updateContent = (key: string, val: any) => {
            setEditForm(prev => ({ ...prev, content: { ...prev.content, [key]: val } }));
        };

        switch (type) {
            case 'swipe':
                return (
                    <div className="space-y-2 bg-slate-800/50 p-3 rounded border border-slate-700">
                        <div className="text-xs font-bold text-gray-400 uppercase flex justify-between">
                            <span>Swipe Cards</span>
                            <button onClick={() => updateContent('cards', [...(content.cards || []), { text: '', isRight: true, label: '' }])} className="text-blue-400">+ Add Card</button>
                        </div>
                        {(content.cards || []).map((card: any, i: number) => (
                            <div key={i} className="flex gap-2 items-center bg-slate-900 p-2 rounded border border-slate-700">
                                <input className="flex-1 bg-transparent border-b border-slate-600 text-white text-xs p-1 focus:border-blue-500 outline-none" placeholder="Card Text" value={card.text || ''} onChange={e => {
                                    const newCards = [...(content.cards || [])];
                                    newCards[i] = { ...card, text: e.target.value };
                                    updateContent('cards', newCards);
                                }} />
                                <select className="bg-slate-700 text-white text-xs rounded p-1" value={card.isRight ? 'true' : 'false'} onChange={e => {
                                    const newCards = [...(content.cards || [])];
                                    newCards[i] = { ...card, isRight: e.target.value === 'true' };
                                    updateContent('cards', newCards);
                                }}>
                                    <option value="true">Right (Correct)</option>
                                    <option value="false">Left (Wrong)</option>
                                </select>
                                <input className="w-20 bg-transparent border-b border-slate-600 text-white text-xs p-1" placeholder="Label" value={card.label || ''} onChange={e => {
                                    const newCards = [...(content.cards || [])];
                                    newCards[i] = { ...card, label: e.target.value };
                                    updateContent('cards', newCards);
                                }} />
                                <button onClick={() => updateContent('cards', content.cards.filter((_: any, idx: number) => idx !== i))} className="text-red-500 hover:text-red-400 font-bold">X</button>
                            </div>
                        ))}
                    </div>
                );
            case 'tap_lie':
                return (
                    <div className="space-y-2 bg-slate-800/50 p-3 rounded border border-slate-700">
                        <div className="text-xs font-bold text-gray-400 uppercase flex justify-between">
                            <span>Statements (Find the Lie)</span>
                            <button onClick={() => updateContent('statements', [...(content.statements || []), { text: '', isLie: false }])} className="text-blue-400">+ Add Statement</button>
                        </div>
                        {(content.statements || []).map((stmt: any, i: number) => (
                            <div key={i} className="flex gap-2 items-center bg-slate-900 p-2 rounded border border-slate-700">
                                <input className="flex-1 bg-transparent border-b border-slate-600 text-white text-xs p-1 focus:border-blue-500 outline-none" placeholder="Statement Text" value={stmt.text || ''} onChange={e => {
                                    const newStmts = [...(content.statements || [])];
                                    newStmts[i] = { ...stmt, text: e.target.value };
                                    updateContent('statements', newStmts);
                                }} />
                                <label className="flex items-center gap-1 text-xs text-white">
                                    <input type="checkbox" checked={stmt.isLie || false} onChange={e => {
                                         const newStmts = [...(content.statements || [])];
                                         newStmts[i] = { ...stmt, isLie: e.target.checked };
                                         updateContent('statements', newStmts);
                                    }} /> Is Lie?
                                </label>
                                <button onClick={() => updateContent('statements', content.statements.filter((_: any, idx: number) => idx !== i))} className="text-red-500 hover:text-red-400 font-bold">X</button>
                            </div>
                        ))}
                    </div>
                );
            case 'meme':
                return (
                    <div className="space-y-2 bg-slate-800/50 p-3 rounded border border-slate-700">
                         <InputField label="Image URL" value={content.imageUrl} onChange={(e: any) => updateContent('imageUrl', e.target.value)} />
                         <InputField label="Top Text" value={content.topText} onChange={(e: any) => updateContent('topText', e.target.value)} />
                         <InputField label="Bottom Text" value={content.bottomText} onChange={(e: any) => updateContent('bottomText', e.target.value)} />
                         <InputField label="Explanation" value={content.explanation} onChange={(e: any) => updateContent('explanation', e.target.value)} />
                    </div>
                );
            case 'calculator':
                return (
                    <div className="space-y-2 bg-slate-800/50 p-3 rounded border border-slate-700">
                        <InputField label="Description Label" value={content.label} onChange={(e: any) => updateContent('label', e.target.value)} placeholder="If you invest..." />
                        <InputField label="Result Label" value={content.resultLabel} onChange={(e: any) => updateContent('resultLabel', e.target.value)} placeholder="You will have..." />
                        <InputField label="Formula (static 'auto' for now)" value={content.formula} onChange={(e: any) => updateContent('formula', e.target.value)} />
                    </div>
                );
            case 'drag_drop':
                return (
                    <div className="space-y-2 bg-slate-800/50 p-3 rounded border border-slate-700">
                        <div className="mb-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Buckets (Comma Separated)</label>
                            <input className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-xs" value={(content.buckets || []).join(', ')} onChange={e => updateContent('buckets', e.target.value.split(',').map(s => s.trim()))} />
                        </div>
                        <div className="text-xs font-bold text-gray-400 uppercase flex justify-between">
                            <span>Draggable Items</span>
                            <button onClick={() => updateContent('items', [...(content.items || []), { id: Date.now().toString(), text: '', category: '' }])} className="text-blue-400">+ Add Item</button>
                        </div>
                         {(content.items || []).map((item: any, i: number) => (
                            <div key={i} className="flex gap-2 items-center bg-slate-900 p-2 rounded border border-slate-700">
                                <input className="flex-1 bg-transparent border-b border-slate-600 text-white text-xs p-1" placeholder="Text" value={item.text || ''} onChange={e => {
                                    const newItems = [...(content.items || [])];
                                    newItems[i] = { ...item, text: e.target.value };
                                    updateContent('items', newItems);
                                }} />
                                <input className="w-24 bg-transparent border-b border-slate-600 text-white text-xs p-1" placeholder="Category" value={item.category || ''} onChange={e => {
                                    const newItems = [...(content.items || [])];
                                    newItems[i] = { ...item, category: e.target.value };
                                    updateContent('items', newItems);
                                }} />
                                <button onClick={() => updateContent('items', content.items.filter((_: any, idx: number) => idx !== i))} className="text-red-500 font-bold">X</button>
                            </div>
                        ))}
                    </div>
                );
            case 'info':
            case 'video':
            default:
                return (
                     <div className="space-y-2">
                         <label className="block text-xs font-bold text-gray-400 uppercase">Main Text (Markdown supported)</label>
                         <textarea className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white h-32 text-sm" value={content.text || ''} onChange={e => updateContent('text', e.target.value)} />
                         {type === 'video' && <InputField label="Video URL" value={content.videoUrl} onChange={(e: any) => updateContent('videoUrl', e.target.value)} />}
                     </div>
                );
        }
    };

    return (
        <div className="p-8 animate-pop-in h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-game text-white">Content CMS</h2>
                <div className="flex gap-4">
                    <a href="https://files.catbox.moe/4p3h7k.json" download className="text-xs text-blue-400 underline self-center font-bold">Download Template</a>
                    
                    <button 
                        onClick={handleSeedDB}
                        disabled={isUploading}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 disabled:opacity-50 shadow-lg"
                    >
                        <CloudArrowDownIcon className="w-5 h-5" />
                        {isUploading ? "Seeding..." : "Seed DB"}
                    </button>

                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-lg">
                        <CloudArrowUpIcon className="w-5 h-5" />
                        Bulk Upload
                        <input type="file" className="hidden" accept=".json" onChange={handleBulkUpload} disabled={isUploading} />
                    </label>

                    <button onClick={() => { 
                        setEditingId('new'); 
                        setEditForm({ 
                            id: `world1_l1_${Date.now().toString().slice(-4)}`, 
                            worldId: 'world1', 
                            levelId: 'world1_l1', 
                            order: 1, 
                            type: 'info', 
                            title: '', 
                            xpReward: 100, 
                            coinReward: 50,
                            content: {} 
                        }); 
                    }} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-lg">
                        <PlusIcon className="w-5 h-5" /> Add New
                    </button>
                </div>
            </div>

            {/* Edit Modal */}
            {editingId && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">{editingId === 'new' ? 'Create New Lesson' : 'Edit Lesson'}</h3>
                            <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-white">✕</button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Lesson ID" value={editForm.id} onChange={(e: any) => setEditForm({...editForm, id: e.target.value})} disabled={editingId !== 'new'} placeholder="world1_l1_uniqueId" />
                            <InputField label="Title" value={editForm.title} onChange={(e: any) => setEditForm({...editForm, title: e.target.value})} placeholder="Lesson Title" />
                            
                            <div className="mb-3">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">World</label>
                                <select 
                                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white outline-none"
                                    value={editForm.worldId || 'world1'}
                                    onChange={e => setEditForm({...editForm, worldId: e.target.value})}
                                >
                                    {WORLDS_METADATA.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Lesson Type</label>
                                <select 
                                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white outline-none"
                                    value={editForm.type || 'info'}
                                    onChange={e => setEditForm({...editForm, type: e.target.value as LessonType, content: {} })}
                                >
                                    <option value="info">Info / Text</option>
                                    <option value="video">Video</option>
                                    <option value="swipe">Swipe Cards</option>
                                    <option value="drag_drop">Drag & Drop</option>
                                    <option value="tap_lie">Tap the Lie (Poll)</option>
                                    <option value="calculator">Calculator</option>
                                    <option value="meme">Meme Reveal</option>
                                </select>
                            </div>

                            <InputField label="Level (1-8)" type="number" value={parseInt(editForm.levelId?.split('_l')[1] || '1')} onChange={(e: any) => setEditForm({...editForm, levelId: `${editForm.worldId}_l${e.target.value}`})} />
                            <InputField label="Order" type="number" value={editForm.order} onChange={(e: any) => setEditForm({...editForm, order: Number(e.target.value)})} />
                            
                            <InputField label="XP Reward" type="number" value={editForm.xpReward} onChange={(e: any) => setEditForm({...editForm, xpReward: Number(e.target.value)})} />
                            <InputField label="Coin Reward" type="number" value={editForm.coinReward} onChange={(e: any) => setEditForm({...editForm, coinReward: Number(e.target.value)})} />
                        </div>

                        <div className="mt-4 border-t border-slate-700 pt-4">
                            <h4 className="text-sm font-bold text-white mb-3">Content Configuration ({editForm.type})</h4>
                            {renderContentFields()}
                        </div>

                        <div className="flex justify-end gap-4 mt-6 border-t border-slate-700 pt-4">
                            <button onClick={() => setEditingId(null)} className="px-4 py-2 text-slate-400 font-bold hover:text-white">Cancel</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold shadow-lg">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-900 text-white font-bold uppercase text-xs">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">World</th>
                            <th className="p-4">Level</th>
                            <th className="p-4">Title</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">XP</th>
                            <th className="p-4">Coins</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {lessons.length === 0 ? (
                            <tr><td colSpan={8} className="p-8 text-center text-slate-500 italic">
                                No custom content loaded. 
                                <button onClick={handleSeedDB} className="ml-2 text-purple-400 underline font-bold">Seed Default Content</button>
                            </td></tr>
                        ) : (
                            lessons.map(l => (
                                <tr key={l.id} className="hover:bg-slate-700/50 transition-colors">
                                    <td className="p-4 font-mono text-xs text-slate-500">{l.id}</td>
                                    <td className="p-4 text-xs text-slate-300">{l.worldId}</td>
                                    <td className="p-4 text-xs text-slate-300">{l.levelId ? l.levelId.split('_l')[1] : '-'}</td>
                                    <td className="p-4 font-bold text-white">{l.title}</td>
                                    <td className="p-4"><span className="bg-blue-900/50 border border-blue-500/30 text-blue-300 px-2 py-1 rounded text-xs uppercase font-bold">{l.type}</span></td>
                                    <td className="p-4 text-neon-green font-bold">{l.xpReward}</td>
                                    <td className="p-4 text-yellow-400 font-bold">{l.coinReward}</td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button onClick={() => handleEdit(l)} className="p-2 bg-slate-700 rounded hover:bg-blue-600 hover:text-white transition-colors" title="Edit"><PencilSquareIcon className="w-4 h-4"/></button>
                                        <button onClick={() => handleDelete(l.id)} className="p-2 bg-slate-700 rounded hover:bg-red-600 hover:text-white transition-colors" title="Delete"><TrashIcon className="w-4 h-4"/></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// 4. SHOP & ECONOMY (Live Edit)
const ShopEconomy = () => {
    const [items, setItems] = useState<ShopItem[]>([]);
    
    useEffect(() => {
        const unsub = subscribeToCollection('shop_items', (data) => {
             if (data.length === 0) {
                 // Seed initial if empty
                 batchWrite('shop_items', SHOP_ITEMS);
             }
             setItems(data as ShopItem[]);
        });
        return () => unsub();
    }, []);

    const toggleActive = async (item: ShopItem) => {
        await saveDoc('shop_items', item.id, { active: !item.active });
    };

    const deleteItem = async (id: string) => {
        if(confirm("Delete Item?")) await deleteDocument('shop_items', id);
    };

    return (
        <div className="p-8 animate-pop-in">
            <h2 className="text-3xl font-game text-white mb-6">Shop & Economy</h2>
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden mb-8">
                 <div className="p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
                     <h3 className="font-bold text-white">Inventory Items</h3>
                     <button onClick={() => { 
                         const id = prompt("Item ID:"); 
                         if(id) saveDoc('shop_items', id, { id, name: 'New Item', cost: 100, active: true, emoji: '📦' }); 
                     }} className="bg-blue-600 text-white text-xs px-3 py-1 rounded">Add Item</button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                     {items.map(item => (
                         <div key={item.id} className={`bg-slate-900 p-4 rounded-xl border ${item.active ? 'border-slate-600' : 'border-red-900 opacity-50'} relative group`}>
                             <div className="flex justify-between items-start mb-2">
                                 <div className="text-3xl">{item.emoji}</div>
                                 <div className="flex gap-1">
                                     <button onClick={() => toggleActive(item)} className={`w-3 h-3 rounded-full ${item.active ? 'bg-green-500' : 'bg-red-500'}`}></button>
                                     <button onClick={() => deleteItem(item.id)} className="text-slate-600 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                 </div>
                             </div>
                             <input className="bg-transparent font-bold text-white w-full mb-1" value={item.name} onChange={(e) => saveDoc('shop_items', item.id, { name: e.target.value })} />
                             <div className="flex items-center gap-1">
                                 <span className="text-yellow-400">🪙</span>
                                 <input className="bg-transparent font-mono text-sm w-20" type="number" value={item.cost} onChange={(e) => saveDoc('shop_items', item.id, { cost: Number(e.target.value) })} />
                             </div>
                         </div>
                     ))}
                 </div>
            </div>
        </div>
    );
};

// 5. NOTIFICATIONS (Functional)
const PushNotificationManager = () => {
    const [history, setHistory] = useState<any[]>([]);
    const [form, setForm] = useState({ title: '', body: '' });

    useEffect(() => {
        const unsub = subscribeToCollection('notification_history', (data) => setHistory(data.sort((a,b) => b.sentAt - a.sentAt)));
        return () => unsub();
    }, []);

    const handleSend = async () => {
        if (!form.title || !form.body) return;
        // 1. Save to DB (Cloud Function would pick this up)
        await batchWrite('notification_history', [{ ...form, sentAt: Date.now(), status: 'sent', openRate: '0%' }]);
        // 2. Trigger Mock for Admin
        sendMockNotification('MORNING_STREAK'); // Mock trigger for demo
        playSound('pop');
        setForm({ title: '', body: '' });
        alert("Push Notification Sent to All Users!");
    };

    return (
        <div className="p-8 animate-pop-in">
            <h2 className="text-3xl font-game text-white mb-6">Push Notifications</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="font-bold text-white mb-4">Send Global Blast</h3>
                    <div className="space-y-4">
                        <input className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white" placeholder="Title (e.g. 🔥 Streak Alert)" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                        <textarea className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white h-32" placeholder="Body message..." value={form.body} onChange={e => setForm({...form, body: e.target.value})} />
                        <button onClick={handleSend} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                            <MegaphoneIcon className="w-5 h-5" /> Send Now
                        </button>
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="font-bold text-white mb-4">Recent History</h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {history.map((n, i) => (
                            <div key={i} className="bg-slate-900 p-3 rounded border border-slate-700">
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>{new Date(n.sentAt).toLocaleString()}</span>
                                    <span className="text-green-400">Sent</span>
                                </div>
                                <div className="font-bold text-white">{n.title}</div>
                                <div className="text-sm text-slate-400">{n.body}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// 6. WALL STREET ZOO ADMIN
const ZooAdmin = () => {
    const [stocks, setStocks] = useState<Stock[]>(ASSET_LIST);
    
    const triggerEvent = async (type: 'crash' | 'moon' | 'reset') => {
        await saveDoc('zoo_config', 'market_state', { event: type, timestamp: Date.now() });
        playSound('kaching');
        alert(`Market Event Triggered: ${type.toUpperCase()}`);
    };

    return (
        <div className="p-8 animate-pop-in">
            <h2 className="text-3xl font-game text-white mb-6">Wall Street Zoo Control</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><BoltIcon className="w-5 h-5 text-yellow-400"/> Market Events</h3>
                    <div className="space-y-3">
                        <button onClick={() => triggerEvent('crash')} className="w-full bg-red-900/50 border border-red-500 text-red-200 font-bold py-3 rounded-xl hover:bg-red-900">
                            📉 Trigger Market Crash (-20%)
                        </button>
                        <button onClick={() => triggerEvent('moon')} className="w-full bg-green-900/50 border border-green-500 text-green-200 font-bold py-3 rounded-xl hover:bg-green-900">
                            🚀 Trigger Moon Event (+50%)
                        </button>
                        <button onClick={() => triggerEvent('reset')} className="w-full bg-slate-700 text-white font-bold py-3 rounded-xl">
                            🔄 Reset Market Normal
                        </button>
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 max-h-[500px] overflow-y-auto">
                    <h3 className="font-bold text-white mb-4">Listed Assets</h3>
                    {stocks.map(s => (
                        <div key={s.symbol} className="flex justify-between items-center p-2 border-b border-slate-700">
                             <div className="flex items-center gap-2">
                                 <span className="text-2xl">{s.logo}</span>
                                 <div>
                                     <div className="font-bold text-white">{s.symbol}</div>
                                     <div className="text-xs text-slate-400">{s.name}</div>
                                 </div>
                             </div>
                             <div className="text-right">
                                 <div className="font-mono">${s.price.toFixed(2)}</div>
                                 <div className={`text-xs ${s.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>{s.changePercent}%</div>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// 7. GOD TOOLS
const GodTools = ({ users }: { users: UserState[] }) => {
    const [loading, setLoading] = useState(false);

    const executeMassAction = async (action: 'give_coins' | 'reset' | 'reward_all') => {
        if (!confirm(`Are you sure? This affects ${users.length} REAL users.`)) return;
        setLoading(true);
        playSound('chest');
        try {
            await adminMassUpdate(action);
            alert("Mass Action Executed Successfully.");
        } catch (e) {
            alert("Error executing mass action.");
        }
        setLoading(false);
    };

    return (
        <div className="p-8 animate-pop-in">
            <h2 className="text-3xl font-game text-white mb-6">God Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><BoltIcon className="w-5 h-5 text-yellow-400"/> Mass Actions</h3>
                    <div className="space-y-3">
                        <button 
                            onClick={() => executeMassAction('give_coins')} 
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <CurrencyDollarIcon className="w-5 h-5" /> Give 1,000 Coins to ALL
                        </button>
                        <button 
                            onClick={() => executeMassAction('reward_all')} 
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <ShoppingBagIcon className="w-5 h-5" /> Reset Daily Chests
                        </button>
                        <button 
                            onClick={() => executeMassAction('reset')} 
                            disabled={loading}
                            className="w-full bg-red-900 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 border border-red-500 disabled:opacity-50"
                        >
                            <ExclamationTriangleIcon className="w-5 h-5" /> GLOBAL RESET (DANGER)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN ADMIN COMPONENT ---

export const AdminDashboard: React.FC<AdminProps> = ({ onExit }) => {
    const [view, setView] = useState<ViewType>('dashboard');
    const { user } = useUserStore();
    const { users, loading } = useAdminData();

    const SidebarItem = ({ id, label, icon: Icon }: { id: ViewType, label: string, icon: any }) => (
        <button 
            onClick={() => setView(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-bold mb-1
                ${view === id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}
            `}
        >
            <Icon className="w-5 h-5" />
            {label}
        </button>
    );

    if (loading) {
        return <div className="h-screen bg-slate-950 flex items-center justify-center text-white font-game text-2xl animate-pulse">CONNECTING TO MAINFRAME...</div>;
    }

    return (
        <div className="flex h-screen bg-slate-950 text-white font-sans overflow-hidden">
            {/* SIDEBAR */}
            <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0 relative z-10">
                <div className="p-6 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-600 rounded flex items-center justify-center font-bold text-xs shadow-lg animate-pulse">GM</div>
                    <div>
                        <h1 className="font-bold text-lg tracking-wider leading-none">GOD MODE</h1>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                             <span className="w-2 h-2 bg-green-500 rounded-full"></span> LIVE
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 py-2">
                    <div className="text-[10px] font-bold text-slate-600 uppercase px-4 mb-2 mt-2">Analytics</div>
                    <SidebarItem id="dashboard" label="Real-Time Stats" icon={ChartBarIcon} />
                    
                    <div className="text-[10px] font-bold text-slate-600 uppercase px-4 mb-2 mt-6">Management</div>
                    <SidebarItem id="users" label="User DB" icon={UsersIcon} />
                    <SidebarItem id="cms" label="Content CMS" icon={WrenchScrewdriverIcon} />
                    <SidebarItem id="zoo" label="Wall Street Zoo" icon={GlobeAltIcon} />
                    
                    <div className="text-[10px] font-bold text-slate-600 uppercase px-4 mb-2 mt-6">Growth</div>
                    <SidebarItem id="shop" label="Shop & Economy" icon={ShoppingBagIcon} />
                    <SidebarItem id="push" label="Notifications" icon={MegaphoneIcon} />
                    
                    <div className="text-[10px] font-bold text-slate-600 uppercase px-4 mb-2 mt-6">System</div>
                    <SidebarItem id="god" label="God Tools" icon={BoltIcon} />
                </div>

                <div className="p-4 border-t border-slate-800">
                    <button onClick={onExit} className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-white text-sm font-bold py-2 rounded hover:bg-slate-900 transition-colors">
                        <ArrowLeftOnRectangleIcon className="w-4 h-4" /> Exit Admin
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 bg-slate-900 overflow-hidden relative">
                <div className="absolute inset-0 overflow-y-auto">
                    {view === 'dashboard' && <DashboardHome users={users} />}
                    {view === 'users' && <UserManagement users={users} />}
                    {view === 'cms' && <ContentCMS />}
                    {view === 'shop' && <ShopEconomy />}
                    {view === 'push' && <PushNotificationManager />}
                    {view === 'zoo' && <ZooAdmin />}
                    {view === 'god' && <GodTools users={users} />}
                </div>
            </div>
        </div>
    );
};
