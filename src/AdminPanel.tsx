import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Video, Image as ImageIcon, Link as LinkIcon, Settings, Home, Save, CheckCircle, XCircle, UploadCloud, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, onSnapshot, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { db, storage } from './firebase';

export default function AdminPanel({ products }) {
  const [newProduct, setNewProduct] = useState({
    title: '',
    category: 'Game',
    price: '',
    rating: 5.0,
    tags: '',
    downloadLink: '',
    imageUrlParam: '',
    videoUrlParam: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [activeTab, setActiveTab] = useState('products'); // 'products', 'purchases'
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'purchases'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPurchases(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, []);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImagePreviewUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleVideoChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadFile = async (file, path) => {
    return new Promise((resolve, reject) => {
      if (!file) return resolve('');
      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (err) => {
          console.error(err);
          reject(err);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setUploading(true);
    setUploadProgress(0);

    try {
      let finalImageUrl = newProduct.imageUrlParam || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800'; // fallback
      let finalVideoUrl = newProduct.videoUrlParam || '';

      const uploadPromises = [];

      if (!newProduct.imageUrlParam && imageFile) {
        uploadPromises.push(
          imageCompression(imageFile, { maxSizeMB: 0.3, maxWidthOrHeight: 1280, useWebWorker: true })
            .then(compressedFile => uploadFile(compressedFile, 'images'))
            .then(url => { finalImageUrl = url; })
        );
      }
      
      if (!newProduct.videoUrlParam && videoFile) {
        uploadPromises.push(uploadFile(videoFile, 'videos').then(url => { finalVideoUrl = url; }));
      }

      await Promise.all(uploadPromises);

      await addDoc(collection(db, 'products'), {
        title: newProduct.title,
        category: newProduct.category,
        price: parseFloat(newProduct.price) || 0,
        rating: parseFloat(newProduct.rating) || 5.0,
        image: finalImageUrl,
        videoUrl: finalVideoUrl,
        downloadLink: newProduct.downloadLink,
        tags: newProduct.tags ? newProduct.tags.split(',').map(t => t.trim()) : ['New'],
        createdAt: serverTimestamp()
      });

      setNewProduct({ title: '', category: 'Game', price: '', rating: 5.0, downloadLink: '', tags: '', imageUrlParam: '', videoUrlParam: '' });
      setImageFile(null);
      setVideoFile(null);
      setImagePreviewUrl('');
      setVideoPreviewUrl('');
      alert('Product Added Successfully!');
    } catch (err) {
      console.error(err);
      if (err.message.includes('unauthorized')) {
        alert('Failed to upload files. Storage Rules not configured properly.');
      } else {
        alert('Failed to add product: ' + err.message);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Una uhakika unataka kufuta bidhaa hii kikamilifu?")) {
      try {
        await deleteDoc(doc(db, 'products', id));
        alert('Bidhaa imefutwa kikamilifu!');
      } catch (err) {
        console.error(err);
        alert('Imeshindikana kufuta: ' + err.message);
      }
    }
  };

  const handleUpdatePurchase = async (id, status) => {
    try {
      await updateDoc(doc(db, 'purchases', id), { status });
    } catch (err) {
      console.error(err);
      alert('Update failed');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-white/10 hidden md:block">
        <div className="p-6">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 mb-8">
            Admin Panel
          </h2>
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'products' ? 'bg-purple-600/20 text-purple-400' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
            >
              <Settings className="w-5 h-5" />
              Manage Products
            </button>
            <button 
              onClick={() => setActiveTab('purchases')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'purchases' ? 'bg-purple-600/20 text-purple-400' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
            >
              <CheckCircle className="w-5 h-5" />
              Manage Orders
            </button>
            <Link to="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white transition">
              <Home className="w-5 h-5" />
              Back to Store
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Control Panel - {activeTab === 'products' ? 'Products' : 'Orders'}</h1>
            <Link to="/" className="md:hidden flex items-center text-purple-400 hover:text-purple-300">
              <Home className="w-4 h-4 mr-2" /> Store Base
            </Link>
          </div>

          {activeTab === 'products' && (
            <>
              {/* Add Product Form */}
              <section className="bg-zinc-900 p-6 md:p-8 rounded-2xl border border-white/10 mb-10 shadow-xl">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-400" />
                  Add New Product
                </h2>
                <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Product Title</label>
                      <input required placeholder="E.g. GTA VI" value={newProduct.title} onChange={e => setNewProduct({...newProduct, title: e.target.value})} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Category</label>
                        <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition">
                          <option>Game</option>
                          <option>Video</option>
                          <option>Accessory</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Price ($/TZS)</label>
                        <input type="number" step="0.01" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Tags (comma separated)</label>
                      <input placeholder="PS5, Action, New" value={newProduct.tags} onChange={e => setNewProduct({...newProduct, tags: e.target.value})} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1 flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" /> Direct Download Link
                      </label>
                      <input placeholder="https://..." value={newProduct.downloadLink} onChange={e => setNewProduct({...newProduct, downloadLink: e.target.value})} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm text-blue-400 font-medium px-4 py-3 bg-blue-500/10 rounded-xl mb-4 border border-blue-500/20 leading-relaxed text-center">
                      💡 Mwanzo upload ilikuwa "haraka" sana kwa sababu haikuwa inahifadhiwa kwenye mtandao halisi. Sasa inahifadhiwa moja kwa moja ili mtu yeyote aione haitapotea.<br/> Hivyo, picha au video kubwa itachukua muda kiasi kulingana na spidi yako ya intaneti.<br/><strong className="text-white">Ili kupakia HARAKA ndani ya sekunde:</strong> Weka (Paste) <strong>Link / URL</strong> ya picha au video kwenye visanduku hapa chini.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Picha URL (Kama hutaki upload faili)</label>
                        <input placeholder="https://..." value={newProduct.imageUrlParam} onChange={e => setNewProduct({...newProduct, imageUrlParam: e.target.value})} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Video URL (Kama hutaki upload faili)</label>
                        <input placeholder="https://..." value={newProduct.videoUrlParam} onChange={e => setNewProduct({...newProduct, videoUrlParam: e.target.value})} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition" />
                      </div>
                    </div>
                    {/* Upload Image */}
                    <div className="border-2 border-dashed border-zinc-700 hover:border-purple-500 transition rounded-2xl p-6 flex flex-col items-center justify-center relative min-h-[140px] bg-zinc-950">
                      {imagePreviewUrl ? (
                        <div className="absolute inset-0 w-full h-full p-2">
                           <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                           <button type="button" onClick={() => {setImagePreviewUrl(''); setImageFile(null);}} className="absolute top-4 right-4 bg-black/70 p-1.5 rounded-lg text-white hover:text-red-400 z-10"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 text-zinc-500 mb-3" />
                          <p className="text-sm text-zinc-400 text-center font-medium">Bofya au Vuta Picha Hapa (Cover)</p>
                          <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </>
                      )}
                    </div>

                    {/* Upload Video */}
                    <div className="border-2 border-dashed border-zinc-700 hover:border-blue-500 transition rounded-2xl p-6 flex flex-col items-center justify-center relative min-h-[140px] bg-zinc-950">
                      {videoPreviewUrl ? (
                        <div className="absolute inset-0 w-full h-full p-2 bg-zinc-900 flex flex-col items-center justify-center rounded-xl overflow-hidden">
                           <video src={videoPreviewUrl} className="w-full h-full object-cover opacity-60" muted autoPlay loop />
                           <div className="absolute flex items-center gap-2 bg-blue-600/80 px-3 py-1 rounded-full text-sm font-bold"><Video className="w-4 h-4"/> Video Ready</div>
                           <button type="button" onClick={() => {setVideoPreviewUrl(''); setVideoFile(null);}} className="absolute top-4 right-4 bg-black/70 p-1.5 rounded-lg text-white hover:text-red-400 z-10"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      ) : (
                        <>
                          <Video className="w-8 h-8 text-zinc-500 mb-3" />
                          <p className="text-sm text-zinc-400 text-center font-medium">Bofya au Vuta Video Hapa (Optional)</p>
                          <input type="file" accept="video/*" onChange={handleVideoChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-4 border-t border-white/5 space-y-4">
                    {uploading && (
                       <div className="w-full bg-zinc-800 rounded-full h-2.5">
                         <div className="bg-purple-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                         <p className="text-xs text-zinc-400 mt-2 text-center">Inapakia... {Math.round(uploadProgress)}%</p>
                       </div>
                    )}
                    <button type="submit" disabled={uploading} className="w-full md:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50">
                      {uploading ? <UploadCloud className="w-5 h-5 animate-pulse" /> : <Save className="w-5 h-5" />}
                      {uploading ? 'Inapakia kwenye mtandao...' : 'Save Product To Store'}
                    </button>
                  </div>
                </form>
              </section>

              {/* Current Products */}
              <section>
                <h2 className="text-xl font-semibold mb-6">Current Products ({products.length})</h2>
                <div className="grid grid-cols-1 mb-10 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-zinc-400 text-sm">
                        <th className="py-4 px-4">Item</th>
                        <th className="py-4 px-4">Type</th>
                        <th className="py-4 px-4">Price</th>
                        <th className="py-4 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="py-4 px-4 flex items-center gap-4">
                            <img src={p.image} className="w-12 h-12 rounded-lg object-cover bg-zinc-800" alt={p.title} />
                            <span className="font-medium text-white">{p.title}</span>
                          </td>
                          <td className="py-4 px-4 text-zinc-300">{p.category}</td>
                          <td className="py-4 px-4 text-purple-400 font-bold">${p.price}</td>
                          <td className="py-4 px-4 flex items-center gap-2">
                            <button onClick={() => handleDelete(p.id)} className="p-2 text-zinc-500 hover:text-red-400 transition bg-zinc-800 hover:bg-zinc-700 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {activeTab === 'purchases' && (
            <section>
              <h2 className="text-xl font-semibold mb-6">User Purchase Requests ({purchases.length})</h2>
              <div className="grid grid-cols-1 mb-10 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-zinc-400 text-sm">
                      <th className="py-4 px-4">User</th>
                      <th className="py-4 px-4">Product ID</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-4">Transaction ID</th>
                      <th className="py-4 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map(req => (
                      <tr key={req.id} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="py-4 px-4 text-zinc-300">
                          <div className="font-medium text-white">{req.userEmail}</div>
                          <div className="text-xs text-zinc-500">{req.userId}</div>
                        </td>
                        <td className="py-4 px-4 text-zinc-300">
                          {products.find(p => p.id === req.productId)?.title || req.productId}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            req.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                            req.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-zinc-400 font-mono text-sm">{req.transactionId || 'N/A'}</td>
                        <td className="py-4 px-4 flex gap-2">
                           {req.status === 'pending' && (
                             <>
                               <button onClick={() => handleUpdatePurchase(req.id, 'approved')} className="p-2 bg-green-600/20 text-green-400 hover:bg-green-600/40 rounded-lg transition" title="Approve">
                                 <CheckCircle className="w-4 h-4" />
                               </button>
                               <button onClick={() => handleUpdatePurchase(req.id, 'rejected')} className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded-lg transition" title="Reject">
                                 <XCircle className="w-4 h-4" />
                               </button>
                             </>
                           )}
                           <button onClick={() => deleteDoc(doc(db, 'purchases', req.id))} className="p-2 text-zinc-500 hover:text-red-400 transition bg-zinc-800 hover:bg-zinc-700 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}

