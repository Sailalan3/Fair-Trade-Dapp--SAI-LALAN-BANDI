import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getContract } from '../utils/web3Helpers'; // Ensure this helper exists to view data without signer

const PublicTracker = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchPublicData = async () => {
      const contract = await getContract();
      const details = await contract.methods.getProduct(id).call();
      const txs = await contract.methods.getProductTransactions(id).call();
      setProduct(details);
      setHistory(txs);
    };
    if (id) fetchPublicData();
  }, [id]);

  if (!product) return <div className="p-10 text-center">Loading Provenance Data...</div>;

  return (
    <div className="w-full p-6 bg-white shadow-xl rounded-lg mt-10">
      <h1 className="text-3xl font-bold text-[#2a7c7c] mb-4">🌿 FairTrace Provenance</h1>
      <div className="border-l-4 border-[#2a7c7c] pl-4 mb-8">
        <p className="text-gray-600">Product Name: <span className="font-semibold text-black">{product.productName}</span></p>
        <p className="text-gray-600">Batch ID: <span className="font-mono">{product.batchId}</span></p>
      </div>

      <h2 className="text-xl font-semibold mb-6">The Journey</h2>
      <div className="relative">
        {/* Visual Timeline Connector */}
        <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200"></div>
        
        {history.map((tx, index) => (
          <div key={index} className="mb-8 ml-10 relative">
            <div className="absolute -left-10 mt-1.5 w-6 h-6 rounded-full bg-[#2a7c7c] border-4 border-white"></div>
            <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
              <p className="font-bold text-gray-800">{getStageName(tx.toStage)}</p>
              <p className="text-sm text-gray-500">Handled by: {tx.buyer.substring(0,10)}...</p>
              <p className="text-xs text-gray-400">{new Date(tx.timestamp * 1000).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const getStageName = (stage) => {
  const stages = ['Registered', 'Processed', 'Exported', 'Retailed', 'Sold'];
  return stages[stage];
};

export default PublicTracker;