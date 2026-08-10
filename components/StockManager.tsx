
import React, { useState } from 'react';
import { StockItem } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ALL_REFS } from '../src/data/filterData';

interface StockManagerProps {
  stock: StockItem[];
  setStock?: React.Dispatch<React.SetStateAction<StockItem[]>>;
}

const StockManager: React.FC<StockManagerProps> = ({ stock }) => {
  const [newItem, setNewItem] = useState<Partial<StockItem>>({ category: 'Filtre', unit: 'Pcs' });

  const handleAdd = async () => {
    if (!newItem.name || newItem.quantity === undefined) return;
    const id = crypto.randomUUID();
    const item: StockItem = {
      id,
      name: newItem.name,
      quantity: newItem.quantity,
      minQuantity: newItem.minQuantity || 0,
      unit: newItem.unit || 'Pcs',
      category: newItem.category as any,
    };
    
    try {
      await setDoc(doc(db, 'stock', id), item);
      setNewItem({ category: 'Filtre', unit: 'Pcs' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'stock');
    }
  };

  const handleUpdateQuantity = async (id: string, delta: number) => {
    const item = stock.find(s => s.id === id);
    if (!item) return;

    try {
      await updateDoc(doc(db, 'stock', id), { 
        quantity: Math.max(0, item.quantity + delta) 
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'stock');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet article du stock ?')) return;
    try {
      await deleteDoc(doc(db, 'stock', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'stock');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Gestion du Stock</h2>
          <p className="text-slate-500 text-sm">Suivi des pièces et consommables Brel Energie</p>
        </div>
      </div>

      {/* Add New Item */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Désignation</label>
          <input 
            type="text" 
            list="stock-refs"
            value={newItem.name || ''} 
            onChange={e => setNewItem({...newItem, name: e.target.value})}
            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#2185D0] transition-all"
            placeholder="Ex: Filtre Huile Perkins"
          />
          <datalist id="stock-refs">
            {ALL_REFS.map(ref => (
              <option key={ref} value={ref} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Catégorie</label>
          <select 
            value={newItem.category} 
            onChange={e => setNewItem({...newItem, category: e.target.value as any})}
            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#2185D0] transition-all"
          >
            <option value="Filtre">Filtre</option>
            <option value="Huile">Huile</option>
            <option value="Pièce">Pièce</option>
            <option value="Consommable">Consommable</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quantité</label>
          <input 
            type="number" 
            value={newItem.quantity || ''} 
            onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})}
            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#2185D0] transition-all"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Seuil Alerte</label>
          <input 
            type="number" 
            value={newItem.minQuantity || ''} 
            onChange={e => setNewItem({...newItem, minQuantity: Number(e.target.value)})}
            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#2185D0] transition-all"
          />
        </div>
        <button 
          onClick={handleAdd}
          className="bg-[#2185D0] text-white h-[44px] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1a6fb1] transition-all"
        >
          Ajouter au stock
        </button>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Article</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantité</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stock.map(item => (
              <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{item.name}</div>
                  {item.quantity <= item.minQuantity && (
                    <span className="text-[8px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-full">Stock Bas</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{item.category}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <span className={`font-black ${item.quantity <= item.minQuantity ? 'text-red-600' : 'text-[#2185D0]'}`}>
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <button 
                      onClick={() => handleUpdateQuantity(item.id, -1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600 transition-all"
                    >
                      <i className="fas fa-minus text-xs"></i>
                    </button>
                    <button 
                      onClick={() => handleUpdateQuantity(item.id, 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-green-100 hover:text-green-600 transition-all"
                    >
                      <i className="fas fa-plus text-xs"></i>
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-all"
                    >
                      <i className="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockManager;
