import React from "react";

const UpgradePrompt: React.FC = () => (
  <div className="p-4 border rounded bg-yellow-50 text-yellow-900 text-center">
    <h3 className="text-lg font-bold mb-2">You've hit your Free plan limit!</h3>
    <p className="mb-3">Upgrade to Pro or Elite for unlimited access and premium features.</p>
    <a href="/pricing" className="btn btn-primary mt-2">See Plans</a>
  </div>
);

export default UpgradePrompt; 