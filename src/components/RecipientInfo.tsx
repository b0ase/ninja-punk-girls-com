'use client';

import React from 'react';

const RecipientInfo: React.FC = () => {
  const recipientHandle = "$ninjapunkgirls";
  const mintFee = 0.04;

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-lg shadow-lg text-sm h-full flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-semibold mb-3 text-pink-400 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          NFT Generation Fee
        </h3>
        <div className="space-y-2">
          <p className="flex justify-between items-center text-gray-300">
            <span>Recipient:</span>
            <span className="font-mono text-white">{recipientHandle}</span>
          </p>
          <p className="flex justify-between items-center text-gray-300">
            <span>Amount:</span>
            <span className="font-mono text-white">{mintFee.toFixed(5)} BSV</span>
          </p>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-700/50">
        <p className="text-xs text-gray-400">
          This payment covers the cost to generate your unique Ninja Punk Girl NFT.
        </p>
      </div>
    </div>
  );
};

export default RecipientInfo; 